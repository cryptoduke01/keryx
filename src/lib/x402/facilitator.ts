/**
 * Keryx's x402 facilitator layer.
 *
 * Three settlement modes, picked from env at boot:
 *
 *  1. `local`    — Keryx's own facilitator wallet broadcasts USDC
 *                  transferWithAuthorization on Arc. Requires
 *                  KERYX_FACILITATOR_PRIVATE_KEY. Preferred when present —
 *                  this is the proven production path (real Arcscan txs).
 *
 *  2. `gateway`  — Circle Gateway batched settlement. Requires
 *                  CIRCLE_GATEWAY_API_URL. Used when no local key is set,
 *                  or when CIRCLE_GATEWAY_PREFERRED=true forces Gateway.
 *
 *  3. `demo`     — no external calls. Accepts well-formed X-PAYMENT payloads
 *                  and returns a synthetic demo_0x… hash. Cold-clone default.
 *
 * The x402 protocol shape (402 + PaymentRequirements + X-PAYMENT retry) is
 * identical across all three modes; only verify/settle differ.
 */

import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { tryBuildLocalFacilitator } from "@/lib/x402/local-facilitator";
import { getActiveArcNetwork } from "@/lib/chains";

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

  const gatewayUrl = process.env.CIRCLE_GATEWAY_API_URL?.trim();
  const preferGateway = process.env.CIRCLE_GATEWAY_PREFERRED === "true";
  const local = tryBuildLocalFacilitator();

  // Prefer proven local Arc settlement when a facilitator key is present.
  // Gateway is opt-in via CIRCLE_GATEWAY_PREFERRED=true (or when no local key).
  if (local && !preferGateway) {
    cached = local;
    return cached;
  }

  if (gatewayUrl) {
    cached = buildGatewayFacilitator(gatewayUrl);
    return cached;
  }

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
    async verify(payload, requirements) {
      const payer = readPayer(payload);
      if (!payer) return { valid: false, reason: "missing_payer_signature" };

      // Soft shape checks so demo mode is not a total free-for-all.
      if (!payload || typeof payload !== "object") {
        return { valid: false, reason: "invalid_payload" };
      }
      const req = requirements as { amount?: string; payTo?: string; asset?: string } | null;
      const auth = readAuthorization(payload);
      if (!auth) return { valid: false, reason: "missing_authorization" };
      if (req?.payTo && auth.to && auth.to.toLowerCase() !== req.payTo.toLowerCase()) {
        return { valid: false, reason: "payTo_mismatch" };
      }
      if (req?.amount && auth.value) {
        try {
          if (BigInt(auth.value) !== BigInt(req.amount)) {
            return { valid: false, reason: "amount_mismatch" };
          }
        } catch {
          return { valid: false, reason: "amount_unparseable" };
        }
      }
      return { valid: true, payer };
    },
    async settle(payload) {
      return {
        success: true,
        txHash: synthesizedTxHash(),
        network: getActiveArcNetwork().caip2,
        payer: readPayer(payload),
      } as FacilitatorSettleResult;
    },
  };
}

function readAuthorization(payload: unknown): {
  to?: string;
  value?: string;
  asset?: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const p = (payload as Record<string, unknown>).payload;
  if (!p || typeof p !== "object") return null;
  const authorization = (p as Record<string, unknown>).authorization;
  if (!authorization || typeof authorization !== "object") return null;
  const a = authorization as Record<string, unknown>;
  return {
    to: typeof a.to === "string" ? a.to : undefined,
    value:
      typeof a.value === "string" || typeof a.value === "number"
        ? String(a.value)
        : undefined,
    asset: typeof a.asset === "string" ? a.asset : undefined,
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
