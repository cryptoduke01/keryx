/**
 * Kēryx seed registry. Every entry here maps to a real handler in
 * src/lib/registry/handlers.ts that hits a live public API — no mocked
 * data. Community publishers can add their own via POST /api/publishers/tools.
 *
 * The publishers for the seed lineup are the Kēryx treasury so demo revenue
 * flows to a wallet we control while the platform is bootstrapping.
 */

import { KERYX_TREASURY_ADDRESS } from "@/lib/chains";

export type ToolCategory =
  | "solana"
  | "search"
  | "scrape"
  | "memory"
  | "compute"
  | "social";

export interface ToolDefinition {
  /** URL-safe id: e.g. "solana.token-activity", "search.web". Also the API slug. */
  id: string;
  /** Publisher-facing display name. */
  name: string;
  /** One-sentence summary an agent uses to decide whether to call it. */
  summary: string;
  /** Category for browsing. */
  category: ToolCategory;
  /** Price per call, in USD. Nano-fees allowed (e.g. 0.001). */
  priceUsd: number;
  /** Wallet that receives payments for calls to this tool. */
  publisherWallet: `0x${string}`;
  /** Publisher display name (community-facing byline). */
  publisherName: string;
  /** JSON-schema-like args the tool expects. */
  args: Record<
    string,
    { type: "string" | "number" | "boolean"; required?: boolean; description: string }
  >;
  /** Sample invocation for documentation. */
  sampleArgs: Record<string, unknown>;
  /** Whether this tool is verified by Kēryx (seeded = true). */
  verified: boolean;
  /** Approximate latency in ms (for agent budgeting). */
  latencyMs: number;
  /**
   * For community-published tools: the publisher's HTTPS endpoint that Kēryx
   * will POST the args to (after payment settles). Kēryx forwards the call
   * server-to-server and returns whatever the handler returns.
   * Seeded tools do not use this.
   */
  handlerUrl?: string;
}

export const SEEDED_TOOLS: ToolDefinition[] = [
  {
    id: "solana.token-activity",
    name: "Solana Token Activity",
    summary:
      "Live trading data for a Solana token: top DEX pairs, 24h volume, buy/sell counts, liquidity, and market cap.",
    category: "solana",
    priceUsd: 0.005,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      mintOrSymbol: {
        type: "string",
        required: true,
        description:
          "Solana token mint address, symbol, or name (e.g. 'BONK', 'DezXAZ8z...263').",
      },
    },
    sampleArgs: { mintOrSymbol: "BONK" },
    verified: true,
    latencyMs: 850,
  },
  {
    id: "solana.launches",
    name: "New Solana Token Launches",
    summary:
      "Freshly-boosted Solana token profiles from DexScreener with descriptions, links, and dex URLs.",
    category: "solana",
    priceUsd: 0.003,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      limit: {
        type: "number",
        description: "How many recent launches to return. Default 5, max 20.",
      },
    },
    sampleArgs: { limit: 5 },
    verified: true,
    latencyMs: 720,
  },
  {
    id: "solana.rug-check",
    name: "Solana Rug Risk Score",
    summary:
      "Live risk assessment from rugcheck.xyz: numeric score, normalised score, LP lock percentage, and every flagged risk.",
    category: "solana",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      mint: {
        type: "string",
        required: true,
        description: "Solana token mint address to check.",
      },
    },
    sampleArgs: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    verified: true,
    latencyMs: 950,
  },
  {
    id: "search.web",
    name: "Grounded Web Search",
    summary:
      "Query-to-summary search backed by Wikipedia. Returns page titles, extracts, and canonical URLs. Optimised for LLM grounding.",
    category: "search",
    priceUsd: 0.004,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      query: {
        type: "string",
        required: true,
        description: "Search query.",
      },
      limit: {
        type: "number",
        description: "How many results to return. Default 3, max 5.",
      },
    },
    sampleArgs: { query: "Circle Arc stablecoin network", limit: 3 },
    verified: true,
    latencyMs: 620,
  },
  {
    id: "crypto.trending",
    name: "Trending Cryptos",
    summary:
      "The most-searched coins on CoinGecko right now, with price, 24h change, market cap, and rank.",
    category: "social",
    priceUsd: 0.001,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      limit: {
        type: "number",
        description: "How many trending coins to return. Default 7, max 15.",
      },
    },
    sampleArgs: { limit: 7 },
    verified: true,
    latencyMs: 500,
  },
];

/** Map for O(1) lookup by id. Rebuilt from SEEDED_TOOLS every call so
 *  tests can rehydrate from a fresh module import. */
export function seedIndex(): Map<string, ToolDefinition> {
  return new Map(SEEDED_TOOLS.map((t) => [t.id, t]));
}
