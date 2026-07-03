/**
 * POST /api/ask — the Kēryx playground agent.
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
import { executeTool } from "@/lib/registry/handlers";
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

const SYSTEM_PROMPT = `You are Kēryx, a Greek herald reborn as an AI agent that answers questions by paying real developers for real data.

The tools you have access to, and what each ACTUALLY returns:
- solana_token-activity(mintOrSymbol): the TOP DEX PAIRS for a Solana token — pair address, DEX, price, 24h volume, 24h buys/sells, liquidity, market cap. It does NOT return individual wallet addresses or wallet-level trading behavior. If the user asks about "wallets" or "traders", say plainly that your available tool returns pair-level data, not wallet-level data, and offer the pair-level answer.
- solana_launches(limit): fresh Solana token profiles from DexScreener (mint, description, links).
- solana_rug-check(mint): the rugcheck.xyz risk report — numeric score, LP-locked %, list of risks.
- search_web(query, limit): grounded page summaries from Wikipedia. Good for concepts and companies, not for breaking news.
- crypto_trending(limit): the trending coins on CoinGecko right now (symbol, name, price, 24h change).

Rules:
- Every tool call costs USDC and settles onchain to the publisher. Only call a tool when the question genuinely needs it. Before calling, write ONE short line: "Calling <tool> — <why>".
- If the user's question is off the coverage of your tools (e.g. wallet-level whales, real-time X/Twitter data, specific news articles), say so PLAINLY in one sentence, then either offer the closest thing your tools CAN answer or answer briefly from your own knowledge with a "no tool call needed" note. Don't fire the wrong tool just to appear to be doing something.
- When results come back, weave them into a plain-language answer. Cite each tool you used and what it cost on a trailing line like: "Sources: solana.token-activity (Kēryx, $0.005), search.web (Kēryx, $0.004)".
- Never make up data. Never claim a call returned something it didn't.
- Keep answers tight. This is a chat surface, not an essay.
- Small-talk (hi, what are you) — reply briefly, no tools.`;

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

  /** Build the tool map the AI SDK expects. Each tool id is normalized
   *  from dotted (solana.token-activity) to underscored (solana_token_activity)
   *  because OpenAI's function names disallow dots.
   *  Typed as `any` because the AI SDK's tool<>execute generic doesn't
   *  narrow cleanly across a heterogeneous record. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};
  for (const t of registryTools) {
    const fnName = t.id.replace(/\./g, "_");
    tools[fnName] = tool({
      description: `[$${t.priceUsd.toFixed(3)} · ${t.publisherName}] ${t.summary}`,
      parameters: argsToZod(t.args),
      execute: async (rawArgs) => {
        const tool = await getTool(t.id);
        if (!tool) return { error: "tool_disappeared", id: t.id };
        const quote = quoteCall(tool.priceUsd);
        try {
          const result = await executeTool(tool, rawArgs as Record<string, unknown>);
          // Route the playground call through the same facilitator the real
          // x402 route uses, so /live shows the same badge for ask-driven
          // activity as for direct API callers. In `local` mode Kēryx signs
          // a self-authorization from its facilitator wallet so the payment
          // moves onchain — real tx hash on Arc lands on the ledger row.
          // In `demo` mode we leave payload undefined and get a synthetic
          // hash; in `gateway` mode Circle handles both.
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
          return {
            toolId: tool.id,
            paid: quote,
            settlementMode: facilitator.mode,
            txHash: settle.txHash,
            result,
          };
        } catch (err) {
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
          return {
            error: "handler_failed",
            detail: err instanceof Error ? err.message : String(err),
          };
        }
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

/** Convert a Kēryx arg spec to a zod schema so the AI SDK can validate
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
