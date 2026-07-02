/**
 * Kēryx quote helper. Day 1 handles pricing + fee split in a single
 * simulated settlement; day 2 wires this through actual x402 + Circle
 * Gateway batching for real onchain USDC movement.
 */

import { PLATFORM_FEE_BPS } from "@/lib/chains";

export interface Quote {
  priceUsd: number;
  platformFeeUsd: number;
  netToPublisherUsd: number;
}

export function quoteCall(priceUsd: number): Quote {
  const platformFeeUsd = round6((priceUsd * PLATFORM_FEE_BPS) / 10_000);
  const netToPublisherUsd = round6(priceUsd - platformFeeUsd);
  return { priceUsd: round6(priceUsd), platformFeeUsd, netToPublisherUsd };
}

function round6(n: number): number {
  return Number(n.toFixed(6));
}
