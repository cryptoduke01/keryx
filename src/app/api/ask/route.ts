/**
 * POST /api/ask — the Keryx playground agent.
 *
 * Streams a chat completion. The LLM sees every listed tool as a callable
 * function; when it calls one, we route through /api/call so a real
 * ledger entry gets written and the /live page ticks up.
 *
 * Day 2 uses OpenAI directly; day 3 can swap in Anthropic / any provider.
 */

import { openai, createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";

type StreamModel = Parameters<typeof streamText>[0]["model"];

/** Groq exposes an OpenAI-compatible endpoint, so we reuse the openai
 *  provider with a swapped base URL and pick a Groq-hosted model. Saves
 *  us fighting the AI-SDK/@ai-sdk-groq version matrix. */
const groqClient = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
  compatibility: "compatible",
});
import { z } from "zod";
import { listTools } from "@/lib/registry/store";
import { executeTool, isExecutableTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { recordEntry } from "@/lib/ledger";
import { getTool } from "@/lib/registry/store";
import { getFacilitator } from "@/lib/x402/facilitator";
import { signSelfAuthorization } from "@/lib/x402/local-facilitator";
import { requirementsForTool } from "@/lib/x402/requirements";

export const runtime = "nodejs";
export const maxDuration = 60;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Keryx — a helpful AI assistant with a VERY SMALL budget for paid tools (fractions of a cent per call). Every tool call costs real money in USDC on Arc. The user explicitly said: only use paid tools when the data is worth the cost.

CRITICAL ECONOMIC RULES:
- Most general knowledge, famous landmarks, well-known advice, public facts, and common recommendations are already in your training data. Answer from knowledge for free.
- ONLY call a paid tool when:
  • You need genuinely fresh/live data that your knowledge does not have (current prices, real-time status, live weather, latest onchain activity, etc.)
  • The data is specific/narrow and materially changes the answer (exact current exchange rate for a conversion you will actually perform, precise coordinates for a calculation, etc.)
  • There is no good free alternative and the cost is tiny relative to the value.
- NEVER call paid tools for:
  • Planning trips to major cities ("best free things in Berlin", "famous landmarks", "cheap hostels people recommend")
  • General recommendations you can give from knowledge
  • Wikipedia-style background facts
  • IP geolocation "just in case" or for hypothetical future use
- Before ANY tool call, you must internally answer: "Is this specific piece of data worth ~$X right now for this user?"
- If in doubt, answer from knowledge and do not spend.
- When you do call: say ONE short line using the canonical dotted id "Calling <tool> ($price) — <precise reason this data is worth paying for>". Example: "Calling solana.rug-check ($0.002) — to assess rug risk on this mint before any decision."
- Cite ONLY with the exact canonical dotted id: "Sources: solana.rug-check (Keryx, $0.002)".
- Be concise. Never fabricate.

HIGH-STAKES ONCHAIN / CRYPTO DECISIONS (the exact reason people pay for Keryx):
When the query involves real money moving onchain right now ("$50K just aped into mint X", "fresh launch", "is it a rug?", "should I ape or follow this wallet?"), this is THE use case.
- Immediately call the right solana.* / crypto.* tool(s). The tiny fee is economically trivial compared to the decision.
- After the tool result arrives, give a DIRECT, blunt, numbers-first read. Use the actual scores, %, holders, liquidity, etc.
  Good style:
  - "Rug score 1/100 (normalised 1). LP 0% locked. Top holder 22%. Unlocked liquidity + concentration = high risk. Walk away."
  - "Rug score 91/100, 94% LP locked, clean flags. For a mint that took $50k, metrics look ok so far. Still small book though."
- NEVER append disclaimers, "not financial advice", "do your own research", "exercise caution", "crucial to note higher risk", "consult professionals", or similar lawyer text. The user paid for the fresh data precisely to get a clear read instead of generic hedging. End on the data + implication.
- If data is partial, say exactly "missing X" and stop. No moralizing.

You have high-quality paid tools for weather, finance, geo, crypto, onchain, search, etc. Use them sparingly and intelligently. Most queries can be answered well without spending.`;

export async function POST(req: Request) {
  let body: { messages?: IncomingMessage[]; agent?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const callerId = typeof body?.agent === "string" && body.agent.length > 0
    ? body.agent.slice(0, 32)
    : `web-${Math.random().toString(36).slice(2, 8)}`;

  const model = pickModel();
  if (!model) {
    return new Response(
      JSON.stringify({
        error: "llm_key_missing",
        hint: "Set GROQ_API_KEY (free at console.groq.com) or OPENAI_API_KEY in your environment. /ask picks whichever is available.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const registryTools = await listTools();

  /** Only expose tools that the playground (and the unified executor) can run.
   *  This now includes:
   *   - Keryx-seeded tools (hardcoded real handlers)
   *   - Published community tools that provided a handlerUrl at publish time
   */
  const playableTools = registryTools.filter((t) => isExecutableTool(t));

  /** Build the tool map the AI SDK expects. Each tool id is normalized
   *  from dotted (solana.token-activity) to dashed (solana-token-activity)
   *  because OpenAI's function names disallow dots (dashes are allowed).
   *  We tell the model in the system prompt + per-tool description to cite
   *  using the canonical dotted form (solana.rug-check) in text.
   *  Typed as `any` because the AI SDK's tool<>execute generic doesn't
   *  narrow cleanly across a heterogeneous record. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};
  for (const t of playableTools) {
    const fnName = t.id.replace(/\./g, "-");
    tools[fnName] = tool({
      description: `[$${t.priceUsd.toFixed(3)} paid via Keryx to ${t.publisherName}] Canonical id: ${t.id}. ${t.summary} — only call if the fresh/structured result is worth the cost vs answering from knowledge. When writing "Calling ..." or "Sources:", always use the dotted canonical id "${t.id}".`,
      parameters: argsToZod(t.args),
      execute: async (rawArgs) => {
        const tool = await getTool(t.id);
        if (!tool) return { error: "tool_disappeared", id: t.id };
        const quote = quoteCall(tool.priceUsd);
        // Run the *actual* tool handler first so we can return data to the LLM immediately.
        // Settlement + ledger write are intentionally fire-and-forget so that the /ask
        // chat stays responsive even when using the real Circle Gateway (which can take
        // several seconds per call). The live ledger and /live still fill with real txs.
        let handlerResult: unknown;
        try {
          handlerResult = await executeTool(tool, rawArgs as Record<string, unknown>);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Record the failure (non-blocking for the model).
          void recordEntry({
            toolId: tool.id,
            toolName: tool.name,
            publisherName: tool.publisherName,
            publisherWallet: tool.publisherWallet,
            callerId,
            priceUsd: quote.priceUsd,
            platformFeeUsd: quote.platformFeeUsd,
            netToPublisherUsd: quote.netToPublisherUsd,
            status: "failed",
            settlementMode: getFacilitator().mode,
          });
          const isNoHandler = /no handler registered|no handlerurl/i.test(msg);
          return {
            error: "handler_failed",
            detail: isNoHandler
              ? `Tool "${tool.id}" is listed but has no executable handler configured. The publisher must provide a handlerUrl when publishing (or re-publish).`
              : msg,
          };
        }

        // Return the fresh data to the model right away (no settlement latency).
        const provisional = {
          toolId: tool.id,
          paid: quote,
          settlementMode: getFacilitator().mode,
          result: handlerResult,
        };

        // Fire settlement + ledger in the background. This is what makes /live tick.
        // We do not await it, so the stream to the user stays fast.
        void (async () => {
          try {
          const facilitator = getFacilitator();
          const requirements = requirementsForTool(tool, "https://keryxhq.xyz");
          const payload =
            facilitator.mode === "local"
              ? await signSelfAuthorization({
                  payTo: tool.publisherWallet,
                  atomicUsdc: BigInt(Math.round(tool.priceUsd * 1_000_000)),
                })
              : undefined;
          const settle = await facilitator.settle(payload, requirements);
          await recordEntry({
            toolId: tool.id,
            toolName: tool.name,
            publisherName: tool.publisherName,
            publisherWallet: tool.publisherWallet,
            callerId,
            priceUsd: quote.priceUsd,
            platformFeeUsd: quote.platformFeeUsd,
            netToPublisherUsd: quote.netToPublisherUsd,
            status: "paid",
            txHash: settle.txHash,
            settlementMode: facilitator.mode,
          });
          } catch {
            // If settlement fails we still recorded the call attempt above in some paths;
            // best-effort is acceptable for the playground.
          await recordEntry({
            toolId: tool.id,
            toolName: tool.name,
            publisherName: tool.publisherName,
            publisherWallet: tool.publisherWallet,
            callerId,
            priceUsd: quote.priceUsd,
            platformFeeUsd: quote.platformFeeUsd,
            netToPublisherUsd: quote.netToPublisherUsd,
            status: "failed",
            settlementMode: getFacilitator().mode,
          });
        }
        })();

        return provisional;
      },
    });
  }

  const result = await streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools,
    maxToolRoundtrips: 4,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}

/** Pick whichever LLM provider the environment has a key for. Groq is
 *  preferred because it's free-tier friendly and its Llama 3.3 70B model
 *  handles tool calls cleanly at very low latency; OpenAI is the fallback
 *  if only OPENAI_API_KEY is set. */
function pickModel(): StreamModel | null {
  if (process.env.GROQ_API_KEY) return groqClient("llama-3.3-70b-versatile") as StreamModel;
  if (process.env.OPENAI_API_KEY) return openai("gpt-4o-mini") as StreamModel;
  return null;
}

/** Convert a Keryx arg spec to a zod schema so the AI SDK can validate
 *  what the LLM sends before we execute it. */
function argsToZod(spec: Record<string, { type: "string" | "number" | "boolean"; required?: boolean; description: string }>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, meta] of Object.entries(spec)) {
    const base =
      meta.type === "string"
        ? z.string()
        : meta.type === "number"
          ? z.number()
          : z.boolean();
    shape[key] = meta.required ? base.describe(meta.description) : base.optional().describe(meta.description);
  }
  return z.object(shape);
}
