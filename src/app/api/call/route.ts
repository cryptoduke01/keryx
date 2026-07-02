/**
 * POST /api/call — the paid tool call, gated by x402.
 *
 * Two flows:
 *
 *  1. First hit (no X-PAYMENT header): return HTTP 402 with a machine-readable
 *     `accepts` array. The caller uses this to sign a USDC EIP-3009 authorization
 *     against the seller wallet.
 *
 *  2. Retry with X-PAYMENT: decode the signed payload, ask our facilitator to
 *     verify, execute the tool, ask the facilitator to settle, and return the
 *     result + a ledger entry that carries the tx hash.
 *
 * Which facilitator runs is decided by env (see src/lib/x402/facilitator.ts):
 * Circle Gateway when configured, demo when not. The wire protocol is the same
 * either way, so the /docs curl example works in both.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { decodePaymentSignatureHeader } from "@x402/core/http";
import { getTool } from "@/lib/registry/store";
import { executeTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { recordEntry } from "@/lib/ledger";
import { requirementsForTool } from "@/lib/x402/requirements";
import { getFacilitator } from "@/lib/x402/facilitator";

export const runtime = "nodejs";

const CallSchema = z.object({
  toolId: z.string().min(1),
  args: z.record(z.unknown()).optional().default({}),
});

const X402_VERSION = 1;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = CallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
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

  const origin = new URL(req.url).origin;
  const requirements = requirementsForTool(tool, origin);
  const paymentHeader = req.headers.get("x-payment");

  // No signed payment yet — reply with the 402 price tag.
  if (!paymentHeader) {
    return NextResponse.json(
      {
        x402Version: X402_VERSION,
        error: "X-PAYMENT header is required",
        accepts: [requirements],
      },
      { status: 402 },
    );
  }

  // Decode the caller's signed payload. Malformed base64 or non-JSON gets a
  // 402 back with the same requirements — the caller can retry with a good one.
  let payload: unknown;
  try {
    payload = decodePaymentSignatureHeader(paymentHeader);
  } catch {
    return NextResponse.json(
      {
        x402Version: X402_VERSION,
        error: "invalid_payment_header",
        accepts: [requirements],
      },
      { status: 402 },
    );
  }

  const facilitator = getFacilitator();

  const verify = await facilitator.verify(payload, requirements);
  if (!verify.valid) {
    return NextResponse.json(
      {
        x402Version: X402_VERSION,
        error: "payment_invalid",
        reason: verify.reason ?? "unspecified",
        accepts: [requirements],
      },
      { status: 402 },
    );
  }

  const quote = quoteCall(tool.priceUsd);

  // Execute the tool. If it throws, we record the failure but don't settle —
  // the caller wasn't charged.
  let result: unknown;
  try {
    result = await executeTool(tool, args);
  } catch (err) {
    await recordEntry({
      toolId: tool.id,
      toolName: tool.name,
      publisherName: tool.publisherName,
      publisherWallet: tool.publisherWallet,
      callerId: verify.payer ?? callerId,
      priceUsd: quote.priceUsd,
      platformFeeUsd: quote.platformFeeUsd,
      netToPublisherUsd: quote.netToPublisherUsd,
      status: "failed",
      settlementMode: facilitator.mode,
    });
    const msg = err instanceof Error ? err.message : "unknown_handler_error";
    return NextResponse.json({ error: "handler_failed", detail: msg }, { status: 502 });
  }

  // Settle. If the facilitator errors we still count this as a failed payment
  // so /live surfaces it — an agent should retry, not assume success.
  const settle = await facilitator.settle(payload, requirements);
  if (!settle.success) {
    await recordEntry({
      toolId: tool.id,
      toolName: tool.name,
      publisherName: tool.publisherName,
      publisherWallet: tool.publisherWallet,
      callerId: verify.payer ?? callerId,
      priceUsd: quote.priceUsd,
      platformFeeUsd: quote.platformFeeUsd,
      netToPublisherUsd: quote.netToPublisherUsd,
      status: "failed",
      settlementMode: facilitator.mode,
    });
    return NextResponse.json(
      { error: "settlement_failed", reason: settle.reason ?? "unspecified" },
      { status: 502 },
    );
  }

  const entry = await recordEntry({
    toolId: tool.id,
    toolName: tool.name,
    publisherName: tool.publisherName,
    publisherWallet: tool.publisherWallet,
    callerId: verify.payer ?? callerId,
    priceUsd: quote.priceUsd,
    platformFeeUsd: quote.platformFeeUsd,
    netToPublisherUsd: quote.netToPublisherUsd,
    status: "paid",
    txHash: settle.txHash,
    settlementMode: facilitator.mode,
  });

  return NextResponse.json({
    ok: true,
    tool: { id: tool.id, name: tool.name, publisherName: tool.publisherName },
    quote,
    result,
    settlement: {
      mode: facilitator.mode,
      txHash: settle.txHash,
      network: settle.network,
    },
    ledgerEntry: { id: entry.id, ts: entry.ts },
  });
}
