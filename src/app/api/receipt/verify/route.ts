/**
 * POST /api/receipt/verify — free settlement trust check.
 * Agents (and judges) can prove a paid call beyond "we returned 200"
 * by looking up the public ledger entry + Arcscan link.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { findLedgerEntry } from "@/lib/ledger";
import { arcTestnet } from "@/lib/chains";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** Ledger entry id returned from POST /api/call. */
  id: z.string().min(4).optional(),
  /** Onchain settlement tx hash (0x… or demo_0x…). */
  txHash: z.string().min(8).optional(),
});

type ProofTier = "R0" | "R1" | "R2" | "R3" | "R4" | "R5";

function classify(entry: NonNullable<Awaited<ReturnType<typeof findLedgerEntry>>>): {
  tier: ProofTier;
  reasons: string[];
} {
  const reasons: string[] = [];
  let tier: ProofTier = "R0";

  if (entry.status === "paid") {
    tier = "R1";
    reasons.push("ledger_status_paid");
  } else if (entry.status === "failed") {
    reasons.push("ledger_status_failed");
    return { tier: "R0", reasons };
  } else {
    reasons.push("ledger_status_pending");
    return { tier: "R0", reasons };
  }

  if (entry.txHash) {
    tier = "R2";
    reasons.push("tx_hash_present");
  }

  if (entry.settlementMode === "local" || entry.settlementMode === "gateway") {
    tier = "R3";
    reasons.push(`settlement_mode_${entry.settlementMode}`);
  } else if (entry.settlementMode === "demo") {
    reasons.push("settlement_mode_demo_synthetic");
  }

  if (
    entry.txHash &&
    entry.txHash.startsWith("0x") &&
    !entry.txHash.startsWith("demo_") &&
    (entry.settlementMode === "local" || entry.settlementMode === "gateway")
  ) {
    tier = "R4";
    reasons.push("onchain_hash_shape_ok");
  }

  // R5 reserved for future: RPC receipt confirmation against Arc.
  return { tier, reasons };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id, txHash } = parsed.data;
  if (!id && !txHash) {
    return NextResponse.json(
      { error: "missing_lookup", hint: "Provide id and/or txHash" },
      { status: 400 },
    );
  }

  const entry = await findLedgerEntry({ id, txHash });
  if (!entry) {
    return NextResponse.json(
      {
        ok: false,
        found: false,
        tier: "R0" as ProofTier,
        reasons: ["not_in_public_ledger_window"],
        hint: "Ledger is a ring buffer; older entries may have rotated out.",
      },
      { status: 404 },
    );
  }

  const { tier, reasons } = classify(entry);
  const explorerBase = arcTestnet.blockExplorers?.default.url;
  const arcscan =
    entry.txHash &&
    entry.txHash.startsWith("0x") &&
    !entry.txHash.startsWith("demo_") &&
    explorerBase
      ? `${explorerBase}/tx/${entry.txHash}`
      : null;

  return NextResponse.json({
    ok: true,
    found: true,
    tier,
    reasons,
    entry: {
      id: entry.id,
      ts: entry.ts,
      toolId: entry.toolId,
      toolName: entry.toolName,
      publisherName: entry.publisherName,
      publisherWallet: entry.publisherWallet,
      callerId: entry.callerId,
      priceUsd: entry.priceUsd,
      platformFeeUsd: entry.platformFeeUsd,
      netToPublisherUsd: entry.netToPublisherUsd,
      status: entry.status,
      txHash: entry.txHash,
      settlementMode: entry.settlementMode,
    },
    economicsNote:
      "Onchain transferWithAuthorization pays 100% of the call price to payTo (publisher wallet). platformFeeUsd / netToPublisherUsd are ledger accounting for the 5% platform take; split settlement to treasury is not yet a separate onchain transfer.",
    arcscan,
    live: "https://keryxhq.xyz/live",
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/receipt/verify",
    free: true,
    body: { id: "<ledgerEntry.id>", txHash: "0x…" },
    tiers: {
      R0: "Not found / failed / pending",
      R1: "Paid in public ledger",
      R2: "Tx hash recorded",
      R3: "Settled via local or gateway facilitator (not demo)",
      R4: "Onchain-shaped hash + real facilitator mode",
      R5: "Reserved — live RPC receipt confirmation",
    },
  });
}
