/**
 * OKX.AI ASP config — parallel to Arc settlement.
 * Does not import or mutate Arc facilitator / USDC paths.
 */

import type { ToolDefinition } from "@/lib/registry/seed";
import { seedIndex } from "@/lib/registry/seed";

/** Tools exposed on the OKX Finance Copilot ASP (reuse Keryx handlers). */
export const OKX_ASP_TOOL_IDS = [
  "crypto.price",
  "crypto.trending",
  "crypto.btc-dominance",
  "solana.token-activity",
  "solana.rug-check",
  "solana.launches",
  "finance.convert",
  "finance.exchange-rates",
  "okx.token-price",
  "okx.token-market",
  "okx.wallet-pnl",
  "okx.wallet-recent-pnl",
] as const;

export type OkxAspToolId = (typeof OKX_ASP_TOOL_IDS)[number];

/** URL slug → registry tool id */
export const OKX_ASP_SLUGS: Record<string, OkxAspToolId> = {
  "crypto-price": "crypto.price",
  "crypto-trending": "crypto.trending",
  "crypto-btc-dominance": "crypto.btc-dominance",
  "solana-token-activity": "solana.token-activity",
  "solana-rug-check": "solana.rug-check",
  "solana-launches": "solana.launches",
  "finance-convert": "finance.convert",
  "finance-exchange-rates": "finance.exchange-rates",
  "okx-token-price": "okx.token-price",
  "okx-token-market": "okx.token-market",
  "okx-wallet-pnl": "okx.wallet-pnl",
  "okx-wallet-recent-pnl": "okx.wallet-recent-pnl",
};

export function okxNetwork(): string {
  return process.env.OKX_X402_NETWORK?.trim() || "eip155:1952";
}

export function okxPayTo(): `0x${string}` | null {
  const raw = process.env.OKX_PAY_TO_ADDRESS?.trim() ?? "";
  const m = raw.match(/0x[a-fA-F0-9]{40}/);
  return m ? (m[0] as `0x${string}`) : null;
}

export function okxCredentialsReady(): boolean {
  return Boolean(
    process.env.OKX_API_KEY?.trim() &&
      process.env.OKX_SECRET_KEY?.trim() &&
      process.env.OKX_PASSPHRASE?.trim() &&
      okxPayTo(),
  );
}

export function priceUsdToOkxPrice(priceUsd: number): string {
  const fixed = priceUsd.toFixed(6).replace(/\.?0+$/, "");
  return `$${fixed || "0"}`;
}

export function getOkxAspTool(id: string): ToolDefinition | null {
  if (!OKX_ASP_TOOL_IDS.includes(id as OkxAspToolId)) return null;
  return seedIndex().get(id) ?? null;
}

export function listOkxAspTools(): ToolDefinition[] {
  const idx = seedIndex();
  return OKX_ASP_TOOL_IDS.map((id) => idx.get(id)).filter(
    (t): t is ToolDefinition => Boolean(t),
  );
}

export function slugForToolId(toolId: string): string | null {
  const entry = Object.entries(OKX_ASP_SLUGS).find(([, id]) => id === toolId);
  return entry ? entry[0] : null;
}
