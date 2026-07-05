/**
 * EIP-3009 signature verification.
 *
 * This is the real cryptographic check — recover the signer of the
 * `TransferWithAuthorization` typed data and compare to the authorization's
 * `from` field. It requires viem (peer dep, optional) and a chain domain.
 *
 * If viem isn't installed, `verifySignature()` returns `{ ok: false, reason:
 * "viem_not_installed" }` and callers should fall back to structural checks.
 */

import type { DecodedPayment, Network } from "./index.js";

/** EIP-712 domain params for USDC on each supported network.
 *
 *  Note: EIP-712 `chainId` is the numeric chain id, not the CAIP-2 string.
 *  These values match the USDC contracts deployed on each network.
 */
export const USDC_DOMAIN: Record<
  Network,
  { name: string; version: string; chainId: number; verifyingContract: `0x${string}` }
> = {
  "arc-testnet": {
    name: "USD Coin",
    version: "2",
    chainId: 5042002,
    verifyingContract: "0x3600000000000000000000000000000000000000",
  },
  "arc-mainnet": {
    name: "USD Coin",
    version: "2",
    chainId: 5042001,
    verifyingContract: "0x3600000000000000000000000000000000000000",
  },
};

/** EIP-3009 `TransferWithAuthorization` typed-data types. */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface VerifySignatureResult {
  ok: boolean;
  reason?:
    | "viem_not_installed"
    | "signer_mismatch"
    | "recovery_failed"
    | "unknown_network";
  recovered?: `0x${string}`;
}

/**
 * Recover the signer of an EIP-3009 authorization and compare to the
 * authorization's `from`. Requires viem to be installed.
 */
export async function verifySignature(
  payment: DecodedPayment,
  network: Network,
): Promise<VerifySignatureResult> {
  const domain = USDC_DOMAIN[network];
  if (!domain) return { ok: false, reason: "unknown_network" };

  let recoverTypedDataAddress: typeof import("viem").recoverTypedDataAddress;
  try {
    // Dynamic import so viem stays a truly optional peer dep — the SDK works
    // without it (structural verify only) and only loads viem when this path
    // is exercised.
    ({ recoverTypedDataAddress } = await import("viem"));
  } catch {
    return { ok: false, reason: "viem_not_installed" };
  }

  const auth = payment.payload.authorization;
  let recovered: `0x${string}`;
  try {
    recovered = await recoverTypedDataAddress({
      domain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: "TransferWithAuthorization",
      message: {
        from: auth.from,
        to: auth.to,
        value: BigInt(auth.value),
        validAfter: BigInt(auth.validAfter),
        validBefore: BigInt(auth.validBefore),
        nonce: auth.nonce,
      },
      signature: payment.payload.signature,
    });
  } catch {
    return { ok: false, reason: "recovery_failed" };
  }

  if (recovered.toLowerCase() !== auth.from.toLowerCase()) {
    return { ok: false, reason: "signer_mismatch", recovered };
  }
  return { ok: true, recovered };
}
