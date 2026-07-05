/**
 * @keryxhq/middleware — turn any HTTP handler into a paid tool for AI agents.
 *
 * Core primitives (framework-agnostic). Import from the framework-specific
 * subpath for the wrapper you want:
 *
 *   import { paidHandler } from "@keryxhq/middleware/next";
 *   import { paidExpress } from "@keryxhq/middleware/express";
 */

export type Network = "arc-testnet" | "arc-mainnet";

/** CAIP-2 identifier for the supported networks. */
export const NETWORK_CAIP2: Record<Network, string> = {
  "arc-testnet": "eip155:5042002",
  "arc-mainnet": "eip155:5042001",
};

/** Canonical USDC asset address per network. Arc uses USDC as native gas at 0x360…0000. */
export const USDC_ADDRESS: Record<Network, `0x${string}`> = {
  "arc-testnet": "0x3600000000000000000000000000000000000000",
  "arc-mainnet": "0x3600000000000000000000000000000000000000",
};

/** Configuration for a single paid endpoint. */
export interface PaidToolConfig<TArgs = unknown, TResult = unknown> {
  /** Price per call, in USD. Fractions allowed (e.g. 0.004). */
  price: number;
  /** Publisher wallet that receives payment. Must be a `0x…` address. */
  wallet: `0x${string}`;
  /** Target network. Defaults to `"arc-testnet"`. */
  network?: Network;
  /**
   * Optional facilitator URL. When set, the SDK POSTs the payment payload to
   * this URL for verify + broadcast, and returns the tx hash to the caller.
   * When unset, the SDK verifies the signature locally and returns a
   * `verified: true` receipt — the publisher can broadcast the authorization
   * later or delegate it.
   *
   * Defaults to the value of the env var `KERYX_FACILITATOR_URL`, if set.
   */
  facilitatorUrl?: string;
  /** Human-readable description an agent reads before deciding to pay. */
  description?: string;
  /**
   * How long the payment authorization is valid (seconds). Default 60.
   * The `validBefore` in the EIP-3009 signature must exceed `now + this`.
   */
  maxTimeoutSeconds?: number;
  /** The actual handler. Called after payment verifies. */
  handler: (args: TArgs, ctx: PaidRequestContext) => Promise<TResult> | TResult;
}

/** Context passed to the publisher's handler after successful payment. */
export interface PaidRequestContext {
  /** The caller-supplied X-PAYMENT header (decoded). */
  payment: DecodedPayment;
  /** The requirements the payment matched. */
  requirements: PaymentRequirements;
  /** Verification result. `settlementMode: "verified"` when the signature is
   *  valid but hasn't been broadcast onchain; `"settled"` when a facilitator
   *  broadcast it and returned a tx hash. */
  receipt: PaymentReceipt;
}

/** Machine-readable payment requirements returned in HTTP 402. */
export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  description: string;
  resource: string;
  mimeType: "application/json";
}

/** The 402 body an agent parses. */
export interface X402Response {
  x402Version: 1;
  accepts: PaymentRequirements[];
  error?: string;
}

/** EIP-3009 `transferWithAuthorization` payload, base64-decoded from X-PAYMENT. */
export interface DecodedPayment {
  x402Version: 1;
  scheme: "exact";
  network: string;
  payload: {
    signature: `0x${string}`;
    authorization: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: `0x${string}`;
    };
  };
}

export interface PaymentReceipt {
  settlementMode: "verified" | "settled";
  txHash?: string;
  from: `0x${string}`;
  amount: string;
}

/** Convert USD to six-decimal atomic USDC units. */
export function priceToAtomicUsdc(priceUsd: number): string {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error(`invalid price: ${priceUsd}`);
  }
  return String(Math.round(priceUsd * 1_000_000));
}

/** Build the PaymentRequirements object for a given config + resource URL. */
export function buildRequirements(
  config: PaidToolConfig,
  resource: string,
): PaymentRequirements {
  const network = config.network ?? "arc-testnet";
  return {
    scheme: "exact",
    network: NETWORK_CAIP2[network],
    asset: USDC_ADDRESS[network],
    amount: priceToAtomicUsdc(config.price),
    payTo: config.wallet,
    maxTimeoutSeconds: config.maxTimeoutSeconds ?? 60,
    description: config.description ?? "Paid tool call",
    resource,
    mimeType: "application/json",
  };
}

/** Base64-decode + parse an X-PAYMENT header value. */
export function decodePaymentHeader(header: string): DecodedPayment {
  const buf =
    typeof globalThis.atob === "function"
      ? globalThis.atob(header)
      : Buffer.from(header, "base64").toString("utf-8");
  const parsed = JSON.parse(buf);
  if (parsed?.scheme !== "exact") {
    throw new Error(`unsupported scheme: ${parsed?.scheme}`);
  }
  return parsed as DecodedPayment;
}

/**
 * Verify a decoded payment against requirements. Returns a receipt.
 *
 * Verification runs in three tiers, in order:
 *
 * 1. **Structural** — amount, payTo, network, expiry (fast, no I/O, no deps).
 * 2. **Cryptographic** — if `viem` is available, recover the EIP-3009 signer
 *    and compare to the authorization's `from`. Silently skipped when `viem`
 *    isn't installed so the SDK works standalone; publishers who want strong
 *    verification should install `viem` (`pnpm add viem`).
 * 3. **Settlement** — if `facilitatorUrl` (or env `KERYX_FACILITATOR_URL`) is
 *    set, POST `{ payment, requirements }` and read `{ txHash }` back.
 *
 * Any failed tier throws with a machine-readable error string.
 */
export async function verifyPayment(
  payment: DecodedPayment,
  requirements: PaymentRequirements,
  facilitatorUrl?: string,
): Promise<PaymentReceipt> {
  // ---------- Tier 1: structural ----------
  const auth = payment?.payload?.authorization;
  if (!auth) throw new Error("payment_missing_authorization");
  if (payment.network !== requirements.network) {
    throw new Error(`payment_network_mismatch: ${payment.network} != ${requirements.network}`);
  }
  if (auth.to.toLowerCase() !== requirements.payTo.toLowerCase()) {
    throw new Error("payment_wrong_recipient");
  }
  if (BigInt(auth.value) < BigInt(requirements.amount)) {
    throw new Error(`payment_underpaid: ${auth.value} < ${requirements.amount}`);
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Number(auth.validBefore) <= nowSec) {
    throw new Error("payment_expired");
  }

  // ---------- Tier 2: cryptographic (optional) ----------
  const network = networkFromCaip2(requirements.network);
  if (network) {
    const { verifySignature } = await import("./verify.js");
    const sigCheck = await verifySignature(payment, network);
    if (!sigCheck.ok && sigCheck.reason !== "viem_not_installed") {
      throw new Error(
        `payment_signature_invalid: ${sigCheck.reason}${
          sigCheck.recovered ? ` (recovered=${sigCheck.recovered})` : ""
        }`,
      );
    }
  }

  // ---------- Tier 3: settlement (optional) ----------
  const url =
    facilitatorUrl ??
    (typeof process !== "undefined" ? process.env?.KERYX_FACILITATOR_URL : undefined);
  if (url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payment, requirements }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`facilitator_rejected: ${res.status} ${detail}`);
    }
    const body = (await res.json()) as { txHash?: string };
    return {
      settlementMode: "settled",
      txHash: body.txHash,
      from: auth.from,
      amount: auth.value,
    };
  }

  return {
    settlementMode: "verified",
    from: auth.from,
    amount: auth.value,
  };
}

/** Reverse-lookup our `Network` label from a CAIP-2 id. Returns undefined for
 *  unrecognised networks so signature verification is skipped rather than
 *  failing the whole request. */
function networkFromCaip2(caip2: string): Network | undefined {
  for (const [key, value] of Object.entries(NETWORK_CAIP2) as Array<
    [Network, string]
  >) {
    if (value === caip2) return key;
  }
  return undefined;
}

/** Build a well-formed 402 response body. */
export function buildX402Body(
  requirements: PaymentRequirements,
  error?: string,
): X402Response {
  return {
    x402Version: 1,
    accepts: [requirements],
    error,
  };
}

/**
 * Shared internal: given a Request-like shape (URL + headers), either return
 * a 402 response body or the verified receipt. Used by both the Next.js and
 * Express wrappers so the payment logic is written once.
 */
export async function handlePaymentCheck(
  config: PaidToolConfig,
  resource: string,
  paymentHeader: string | null,
): Promise<
  | { kind: "402"; body: X402Response; requirements: PaymentRequirements }
  | { kind: "ok"; requirements: PaymentRequirements; payment: DecodedPayment; receipt: PaymentReceipt }
> {
  const requirements = buildRequirements(config, resource);
  if (!paymentHeader) {
    return { kind: "402", body: buildX402Body(requirements), requirements };
  }
  let payment: DecodedPayment;
  try {
    payment = decodePaymentHeader(paymentHeader);
  } catch (err) {
    return {
      kind: "402",
      body: buildX402Body(
        requirements,
        `payment_decode_failed: ${err instanceof Error ? err.message : "unknown"}`,
      ),
      requirements,
    };
  }
  try {
    const receipt = await verifyPayment(payment, requirements, config.facilitatorUrl);
    return { kind: "ok", requirements, payment, receipt };
  } catch (err) {
    return {
      kind: "402",
      body: buildX402Body(
        requirements,
        err instanceof Error ? err.message : "payment_verify_failed",
      ),
      requirements,
    };
  }
}
