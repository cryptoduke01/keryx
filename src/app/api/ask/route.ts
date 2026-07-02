/**
 * POST /api/ask — the Kēryx playground agent.
 *
 * Streams a chat completion. The LLM sees every listed tool as a callable
 * function; when it calls one, we route through /api/call so a real
 * ledger entry gets written and the /live page ticks up.
 *
 * Day 2 uses OpenAI directly; day 3 can swap in Anthropic / any provider.
 */

import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { listTools } from "@/lib/registry/store";
import { executeTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { recordEntry } from "@/lib/ledger";
import { getTool } from "@/lib/registry/store";
import { getFacilitator } from "@/lib/x402/facilitator";
import { requirementsForTool } from "@/lib/x402/requirements";

export const runtime = "nodejs";
export const maxDuration = 60;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Kēryx, a Greek herald reborn as an AI agent that answers questions by paying real developers for real data.

Rules:
- Every tool call costs USDC and settles onchain to the tool's publisher. Only call a tool if the question genuinely needs it. Say what you're about to call and why, in one short line, before you call it.
- When results come back, weave them into a plain-language answer for the user. Cite each tool you used and what it cost, in a short trailing line like: "Sources: solana.token-activity (Kēryx, $0.005), search.web (Kēryx, $0.004)".
- If a tool errors or returns nothing useful, say so plainly. Never make up data.
- Keep answers tight. This is a chat surface, not an essay.
- If the user is just chatting (hi, what are you), respond briefly without calling any tools.`;

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

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "openai_key_missing",
        hint: "Set OPENAI_API_KEY in .env.local. The /ask playground needs it to route tool calls.",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
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
          // x402 route uses, so /live shows the same DEMO / GATEWAY badge for
          // ask-driven activity as it does for direct API callers. Kēryx
          // sponsors the payment in demo mode; when Gateway is configured
          // production ask-flows would sign on behalf of a hosted agent
          // wallet instead of leaving payload undefined.
          const facilitator = getFacilitator();
          const requirements = requirementsForTool(tool, "https://keryxhq.xyz");
          const settle = await facilitator.settle(undefined, requirements);
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
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools,
    maxToolRoundtrips: 4,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
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
