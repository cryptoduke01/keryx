import type { ToolDefinition } from "@/lib/registry/seed";
import {
  getActiveArcNetwork,
  type ArcNetworkProfile,
} from "@/lib/chains";

/** Match the SchemeNetworkServer registration key. */
export const X402_EXACT_SCHEME = "exact" as const;

/** @deprecated Prefer getActiveArcNetwork().caip2 */
export const ARC_TESTNET_NETWORK = "eip155:5042002" as const;

/** Six-decimal USDC atomic units. */
function priceToAtomicUsdc(priceUsd: number): string {
  return String(Math.round(priceUsd * 1_000_000));
}

export interface KeryxPaymentRequirements {
  scheme: typeof X402_EXACT_SCHEME;
  network: string;
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
  network: ArcNetworkProfile = getActiveArcNetwork(),
): KeryxPaymentRequirements {
  return {
    scheme: X402_EXACT_SCHEME,
    network: network.caip2,
    asset: network.usdcAddress,
    amount: priceToAtomicUsdc(tool.priceUsd),
    payTo: tool.publisherWallet,
    maxTimeoutSeconds: 60,
    description: tool.summary,
    resource: `${origin}/api/call#${tool.id}`,
    mimeType: "application/json",
  };
}
