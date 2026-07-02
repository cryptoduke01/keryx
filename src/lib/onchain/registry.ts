/**
 * Client for the KeryxRegistry contract on Arc.
 *
 * Read-only for now — the Publish UI still writes through the offchain
 * /api/publishers/tools endpoint (which enforces the EIP-191 signature).
 * Once the deployed address is set via NEXT_PUBLIC_REGISTRY_ADDRESS, /registry
 * calls `getOnchainTool` per listing and renders the "on Arc at 0x…" badge
 * with a link to Arcscan.
 *
 * When the deploy env var is missing this module returns null everywhere —
 * production still works, just without the badges. That keeps local dev
 * and preview builds honest.
 */

import { createPublicClient, http, keccak256, toBytes, type Address } from "viem";
import { arcTestnet } from "@/lib/chains";

const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "") as Address | "";

export interface OnchainTool {
  publisher: Address;
  priceAtomicUsdc: bigint;
  createdAt: number;
  updatedAt: number;
  active: boolean;
  verified: boolean;
  metadataUri: string;
}

const REGISTRY_ABI = [
  {
    type: "function",
    name: "getTool",
    stateMutability: "view",
    inputs: [{ name: "idHash", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "publisher", type: "address" },
          { name: "priceAtomicUsdc", type: "uint256" },
          { name: "createdAt", type: "uint40" },
          { name: "updatedAt", type: "uint40" },
          { name: "active", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "metadataUri", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "toolCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

let cached: ReturnType<typeof createPublicClient> | null = null;

function client() {
  if (cached) return cached;
  cached = createPublicClient({ chain: arcTestnet, transport: http() });
  return cached;
}

export function isConfigured(): boolean {
  return typeof REGISTRY_ADDRESS === "string" && REGISTRY_ADDRESS.length === 42;
}

export function registryAddress(): string | null {
  return isConfigured() ? REGISTRY_ADDRESS : null;
}

export function toolIdHash(id: string): `0x${string}` {
  return keccak256(toBytes(id));
}

export async function getOnchainTool(toolId: string): Promise<OnchainTool | null> {
  if (!isConfigured()) return null;
  try {
    const res = (await client().readContract({
      address: REGISTRY_ADDRESS as Address,
      abi: REGISTRY_ABI,
      functionName: "getTool",
      args: [toolIdHash(toolId)],
    })) as unknown as {
      publisher: Address;
      priceAtomicUsdc: bigint;
      createdAt: number | bigint;
      updatedAt: number | bigint;
      active: boolean;
      verified: boolean;
      metadataUri: string;
    };
    // Empty publisher means "not listed onchain yet"
    if (res.publisher === "0x0000000000000000000000000000000000000000") return null;
    return {
      publisher: res.publisher,
      priceAtomicUsdc: res.priceAtomicUsdc,
      createdAt: Number(res.createdAt),
      updatedAt: Number(res.updatedAt),
      active: res.active,
      verified: res.verified,
      metadataUri: res.metadataUri,
    };
  } catch {
    return null;
  }
}

export async function getOnchainToolCount(): Promise<number> {
  if (!isConfigured()) return 0;
  try {
    const n = (await client().readContract({
      address: REGISTRY_ADDRESS as Address,
      abi: REGISTRY_ABI,
      functionName: "toolCount",
    })) as bigint;
    return Number(n);
  } catch {
    return 0;
  }
}

export function arcscanAddressUrl(addr: string): string {
  return `https://testnet.arcscan.app/address/${addr}`;
}
