/**
 * Keryx's x402 facilitator layer.
 *
 * Three settlement modes, picked from env at boot:
 *
 *  1. `gateway`  — real Circle Gateway. Batched onchain USDC on Arc.
 *                  Requires CIRCLE_GATEWAY_API_URL (+ credentials Circle issues you).
 *                  This is the production path we want to be on for the demo.
 *
 *  2. `local`    — Keryx's own facilitator wallet broadcasts USDC transfers
 *                  directly on Arc. Requires KERYX_FACILITATOR_PRIVATE_KEY and
 *                  an RPC. Useful when Gateway creds aren't in hand yet but the
 *                  wallet has testnet USDC.
 *
 *  3. `demo`     — no external calls. Accepts any well-formed X-PAYMENT payload
 *                  as valid and returns a synthetic tx hash. This is what a
 *                  cold-cloned fork runs by default; the /live ledger clearly
 *                  labels demo-mode entries so nothing misrepresents onchain
 *                  state.
 *
 * The x402 protocol shape (402 + PaymentRequirements + X-PAYMENT retry) is
 * identical across all three modes; only verify/settle differ.
 */

import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { tryBuildLocalFacilitator } from "@/lib/x402/local-facilitator";

export type FacilitatorMode = "gateway" | "local" | "demo";

export interface FacilitatorVerifyResult {
  valid: boolean;
  reason?: string;
  payer?: string;
}

export interface FacilitatorSettleResult {
  success: boolean;
  txHash?: string;
  network?: string;
  reason?: string;
}

export interface KeryxFacilitator {
  mode: FacilitatorMode;
  verify(paymentPayload: unknown, requirements: unknown): Promise<FacilitatorVerifyResult>;
  settle(paymentPayload: unknown, requirements: unknown): Promise<FacilitatorSettleResult>;
}

let cached: KeryxFacilitator | null = null;

export function getFacilitator(): KeryxFacilitator {
  if (cached) return cached;

  const gatewayUrl = process.env.CIRCLE_GATEWAY_API_URL;
  if (gatewayUrl) {
    cached = buildGatewayFacilitator(gatewayUrl);
    return cached;
  }

  const local = tryBuildLocalFacilitator();
  if (local) {
    cached = local;
    return cached;
  }

  cached = buildDemoFacilitator();
  return cached;
}

function buildGatewayFacilitator(url: string): KeryxFacilitator {
  const client = new BatchFacilitatorClient({
    url,
    arcPrivateMainnet: process.env.CIRCLE_ARC_PRIVATE_MAINNET === "true",
  });
  return {
    mode: "gateway",
    async verify(payload, requirements) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const res = await client.verify(payload as any, requirements as any);
      return {
        valid: res.isValid,
        reason: res.invalidReason,
        payer: res.payer,
      };
    },
    async settle(payload, requirements) {
      const res = await client.settle(payload as any, requirements as any);
      return {
        success: res.success,
        txHash: res.transaction,
        network: res.network,
        reason: res.errorReason,
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */
    },
  };
}

function buildDemoFacilitator(): KeryxFacilitator {
  return {
    mode: "demo",
    async verify(payload) {
      const payer = readPayer(payload);
      if (!payer) return { valid: false, reason: "missing_payer_signature" };
      return { valid: true, payer };
    },
    async settle(payload) {
      return {
        success: true,
        txHash: synthesizedTxHash(),
        network: "eip155:5042002",
        payer: readPayer(payload),
      } as FacilitatorSettleResult;
    },
  };
}

function readPayer(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = (payload as Record<string, unknown>).payload;
  if (!p || typeof p !== "object") return undefined;
  const authorization = (p as Record<string, unknown>).authorization;
  if (authorization && typeof authorization === "object") {
    const from = (authorization as Record<string, unknown>).from;
    if (typeof from === "string") return from;
  }
  return undefined;
}

/** Prefixed with `demo_` so /live can render "Demo" instead of a fake link. */
function synthesizedTxHash(): string {
  const hex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `demo_0x${hex}`;
}
