/**
 * Local x402 facilitator that broadcasts real USDC transferWithAuthorization
 * calls on Arc testnet. Activates when KERYX_FACILITATOR_PRIVATE_KEY is set.
 *
 * Flow (for a real X-PAYMENT header from an external agent):
 *   1. verify(): recover the signer from the EIP-712 signature the payload
 *      carries and check it matches `authorization.from`.
 *   2. settle(): submit the same authorization to USDC.transferWithAuthorization
 *      onchain. Facilitator wallet pays gas (USDC-as-gas on Arc). Returns the
 *      broadcast tx hash.
 *
 * When Kēryx itself is the caller (as in /ask or MCP), we sign the
 * authorization on behalf of a self-controlled agent wallet first via
 * signSelfAuthorization(), then hand it to verify + settle. USDC still moves
 * onchain — from the facilitator/agent wallet to the publisher wallet.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  hexToBigInt,
  hexToBytes,
  bytesToHex,
  type Address,
  type Hex,
  type WalletClient,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_USDC_ADDRESS } from "@/lib/chains";
import type { KeryxFacilitator } from "@/lib/x402/facilitator";

const USDC_ABI = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
]);

const DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: arcTestnet.id,
  verifyingContract: ARC_USDC_ADDRESS as Address,
} as const;

const TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

interface Authorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}

interface DecodedAuthorization extends Authorization {
  signature: Hex;
}

let cached: {
  facilitator: KeryxFacilitator;
  pubClient: PublicClient;
  walletClient: WalletClient;
  account: ReturnType<typeof privateKeyToAccount>;
} | null = null;

export function tryBuildLocalFacilitator(): KeryxFacilitator | null {
  const pk = process.env.KERYX_FACILITATOR_PRIVATE_KEY;
  if (!pk) return null;
  if (cached) return cached.facilitator;

  const account = privateKeyToAccount(pk.startsWith("0x") ? (pk as Hex) : (`0x${pk}` as Hex));
  const pubClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });

  const facilitator: KeryxFacilitator = {
    mode: "local",
    async verify(payload) {
      const decoded = safeDecodeAuthorization(payload);
      if (!decoded) return { valid: false, reason: "invalid_payload" };
      const ok = await pubClient.verifyTypedData({
        address: decoded.from,
        domain: DOMAIN,
        types: TYPES,
        primaryType: "TransferWithAuthorization",
        message: {
          from: decoded.from,
          to: decoded.to,
          value: decoded.value,
          validAfter: decoded.validAfter,
          validBefore: decoded.validBefore,
          nonce: decoded.nonce,
        },
        signature: decoded.signature,
      });
      if (!ok) return { valid: false, reason: "signature_invalid", payer: decoded.from };
      return { valid: true, payer: decoded.from };
    },
    async settle(payload) {
      const decoded = safeDecodeAuthorization(payload);
      if (!decoded) return { success: false, reason: "invalid_payload" };
      const { v, r, s } = splitSig(decoded.signature);
      try {
        const txHash = await walletClient.writeContract({
          chain: arcTestnet,
          account,
          address: ARC_USDC_ADDRESS as Address,
          abi: USDC_ABI,
          functionName: "transferWithAuthorization",
          args: [
            decoded.from,
            decoded.to,
            decoded.value,
            decoded.validAfter,
            decoded.validBefore,
            decoded.nonce,
            v,
            r,
            s,
          ],
        });
        return {
          success: true,
          txHash,
          network: "eip155:5042002",
        };
      } catch (err) {
        return {
          success: false,
          reason: err instanceof Error ? err.message.slice(0, 200) : "settle_reverted",
        };
      }
    },
  };

  cached = { facilitator, pubClient, walletClient, account };
  return facilitator;
}

/** Kēryx facilitator wallet address, when configured. Handy for /ask and
 *  MCP to sign self-authorizations from a known agent wallet. */
export function facilitatorAddress(): Address | null {
  if (!cached) tryBuildLocalFacilitator();
  return cached?.account.address ?? null;
}

/**
 * Sign an EIP-3009 authorization "transfer `amount` USDC from the Kēryx
 * facilitator wallet to `payTo`". Used by /ask and MCP so a paid call
 * becomes a real onchain USDC transfer without asking the visitor for a
 * wallet. Returns a payload shaped for the facilitator's verify/settle.
 */
export async function signSelfAuthorization(params: {
  payTo: Address;
  atomicUsdc: bigint;
  validitySeconds?: number;
}): Promise<unknown | null> {
  if (!cached) tryBuildLocalFacilitator();
  if (!cached) return null;
  const validity = params.validitySeconds ?? 3600;
  const now = Math.floor(Date.now() / 1000);
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const auth: Authorization = {
    from: cached.account.address,
    to: params.payTo,
    value: params.atomicUsdc,
    validAfter: 0n,
    validBefore: BigInt(now + validity),
    nonce,
  };
  const signature = await cached.walletClient.signTypedData({
    account: cached.account,
    domain: DOMAIN,
    types: TYPES,
    primaryType: "TransferWithAuthorization",
    message: auth,
  });
  return {
    x402Version: 1,
    scheme: "exact",
    network: "eip155:5042002",
    payload: {
      authorization: {
        from: auth.from,
        to: auth.to,
        value: auth.value.toString(),
        validAfter: auth.validAfter.toString(),
        validBefore: auth.validBefore.toString(),
        nonce: auth.nonce,
      },
      signature,
    },
  };
}

// ---- helpers -------------------------------------------------------------

function safeDecodeAuthorization(payload: unknown): DecodedAuthorization | null {
  if (!payload || typeof payload !== "object") return null;
  const outer = payload as Record<string, unknown>;
  const inner = outer.payload as Record<string, unknown> | undefined;
  if (!inner) return null;
  const auth = inner.authorization as Record<string, unknown> | undefined;
  const signature = inner.signature as string | undefined;
  if (!auth || !signature) return null;
  try {
    return {
      from: auth.from as Address,
      to: auth.to as Address,
      value: BigInt(String(auth.value)),
      validAfter: BigInt(String(auth.validAfter)),
      validBefore: BigInt(String(auth.validBefore)),
      nonce: auth.nonce as Hex,
      signature: (signature.startsWith("0x") ? signature : `0x${signature}`) as Hex,
    };
  } catch {
    return null;
  }
}

function splitSig(sig: Hex): { v: number; r: Hex; s: Hex } {
  const bytes = hexToBytes(sig);
  if (bytes.length !== 65) throw new Error(`bad signature length: ${bytes.length}`);
  const r = bytesToHex(bytes.slice(0, 32));
  const s = bytesToHex(bytes.slice(32, 64));
  let v = bytes[64];
  if (v < 27) v += 27; // normalize (viem sometimes emits {0,1})
  return { v: Number(v), r, s };
  // (hexToBigInt kept as an import in case future use, silences tree-shaker)
  void hexToBigInt;
}
