/**
 * POST /api/receipt/verify — free settlement trust check.
 * Agents (and judges) can prove a paid call beyond "we returned 200"
 * by looking up the public ledger entry + Arc RPC receipt (R5).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, http, type Hex } from "viem";
import { findLedgerEntry, type LedgerEntry } from "@/lib/ledger";
import { arcTestnet } from "@/lib/chains";

export const runtime = "nodejs";

const BodySchema = z.object({
  /** Ledger entry id returned from POST /api/call. */
  id: z.string().min(4).optional(),
  /** Onchain settlement tx hash (0x… or demo_0x…). */
  txHash: z.string().min(8).optional(),
});

type ProofTier = "R0" | "R1" | "R2" | "R3" | "R4" | "R5";

interface ClassifyResult {
  tier: ProofTier;
  reasons: string[];
  onchain?: {
    status: "success" | "reverted" | "not_found";
    blockNumber?: string;
    blockHash?: string;
    gasUsed?: string;
    from?: string;
    to?: string;
  };
}

function isOnchainHash(txHash: string | undefined): txHash is string {
  return Boolean(
    txHash &&
      txHash.startsWith("0x") &&
      !txHash.startsWith("demo_") &&
      txHash.length >= 66,
  );
}

async function fetchArcReceipt(txHash: string): Promise<ClassifyResult["onchain"]> {
  try {
    const client = createPublicClient({
      chain: arcTestnet,
      transport: http(
        process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
        { timeout: 8_000 },
      ),
    });
    const receipt = await client.getTransactionReceipt({
      hash: txHash as Hex,
    });
    if (!receipt) {
      return { status: "not_found" };
    }
    return {
      status: receipt.status === "success" ? "success" : "reverted",
      blockNumber: receipt.blockNumber.toString(),
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to ?? undefined,
    };
  } catch {
    return { status: "not_found" };
  }
}

async function classify(entry: LedgerEntry): Promise<ClassifyResult> {
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
    isOnchainHash(entry.txHash) &&
    (entry.settlementMode === "local" || entry.settlementMode === "gateway")
  ) {
    tier = "R4";
    reasons.push("onchain_hash_shape_ok");
  }

  let onchain: ClassifyResult["onchain"];
  if (
    isOnchainHash(entry.txHash) &&
    (entry.settlementMode === "local" || entry.settlementMode === "gateway")
  ) {
    onchain = await fetchArcReceipt(entry.txHash);
    if (onchain?.status === "success") {
      tier = "R5";
      reasons.push("arc_rpc_receipt_success");
    } else if (onchain?.status === "reverted") {
      reasons.push("arc_rpc_receipt_reverted");
    } else {
      reasons.push("arc_rpc_receipt_not_found");
    }
  }

  return { tier, reasons, onchain };
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

  const { tier, reasons, onchain } = await classify(entry);
  const explorerBase = arcTestnet.blockExplorers?.default.url;
  const arcscan =
    isOnchainHash(entry.txHash) && explorerBase
      ? `${explorerBase}/tx/${entry.txHash}`
      : null;

  return NextResponse.json({
    ok: true,
    found: true,
    tier,
    reasons,
    onchain: onchain ?? null,
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
      R5: "Arc RPC eth_getTransactionReceipt confirmed success",
    },
    example: {
      curl: `curl -sS -X POST https://keryxhq.xyz/api/receipt/verify -H 'content-type: application/json' -d '{"txHash":"0xeccf6b588a2ab9d53efa100796eadcd930d5aa4a6525109d2dadf45ea4a3cab8"}'`,
    },
  });
}
