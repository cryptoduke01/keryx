/**
 * POST /api/call — the paid tool call.
 *
 * Day 1: the request must include `x-keryx-agent` (a caller id, for the
 * demo ledger). Payment is simulated at the quote price and recorded to
 * the public ledger so the /live page shows real-time flow.
 *
 * Day 2: this becomes x402-gated with actual USDC payment verification
 * (@x402/next), Circle Gateway batching, and real onchain settlement.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTool } from "@/lib/registry/store";
import { executeTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { recordEntry } from "@/lib/ledger";

export const runtime = "nodejs";

const CallSchema = z.object({
  toolId: z.string().min(1),
  args: z.record(z.unknown()).optional().default({}),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 }
    );
  }

  const parsed = CallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { toolId, args } = parsed.data;
  const tool = await getTool(toolId);
  if (!tool) {
    return NextResponse.json({ error: "tool_not_found", id: toolId }, { status: 404 });
  }

  const callerId =
    req.headers.get("x-keryx-agent") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";

  const quote = quoteCall(tool.priceUsd);

  let result: unknown;
  try {
    result = await executeTool(tool, args);
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
    });
    const msg = err instanceof Error ? err.message : "unknown_handler_error";
    return NextResponse.json({ error: "handler_failed", detail: msg }, { status: 502 });
  }

  const entry = await recordEntry({
    toolId: tool.id,
    toolName: tool.name,
    publisherName: tool.publisherName,
    publisherWallet: tool.publisherWallet,
    callerId,
    priceUsd: quote.priceUsd,
    platformFeeUsd: quote.platformFeeUsd,
    netToPublisherUsd: quote.netToPublisherUsd,
    status: "paid",
  });

  return NextResponse.json({
    ok: true,
    tool: { id: tool.id, name: tool.name, publisherName: tool.publisherName },
    quote,
    result,
    ledgerEntry: { id: entry.id, ts: entry.ts },
  });
}
