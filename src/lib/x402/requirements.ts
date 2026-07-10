import type { ToolDefinition } from "@/lib/registry/seed";
import { ARC_USDC_ADDRESS } from "@/lib/chains";

/** CAIP-2 chain id for Arc testnet. */
export const ARC_TESTNET_NETWORK = "eip155:5042002" as const;

/** Match the SchemeNetworkServer registration key. */
export const X402_EXACT_SCHEME = "exact" as const;

/** Six-decimal USDC atomic units. */
function priceToAtomicUsdc(priceUsd: number): string {
  return String(Math.round(priceUsd * 1_000_000));
}

export interface KeryxPaymentRequirements {
  scheme: typeof X402_EXACT_SCHEME;
  network: typeof ARC_TESTNET_NETWORK;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  description: string;
  resource: string;
  mimeType: "application/json";
}

export function requirementsForTool(
  tool: ToolDefinition,
  origin: string,
): KeryxPaymentRequirements {
  return {
    scheme: X402_EXACT_SCHEME,
    network: ARC_TESTNET_NETWORK,
    asset: ARC_USDC_ADDRESS,
    amount: priceToAtomicUsdc(tool.priceUsd),
    payTo: tool.publisherWallet,
    maxTimeoutSeconds: 60,
    description: tool.summary,
    resource: `${origin}/api/call#${tool.id}`,
    mimeType: "application/json",
  };
}
