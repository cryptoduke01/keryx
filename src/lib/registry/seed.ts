/**
 * Day-1 in-memory registry. Every tool listed here is a real, callable
 * endpoint. Publishers can add their own via POST /api/publishers/tools;
 * those persist to Redis on day 2.
 *
 * Design intent: seed with tools an agent actually WANTS. Solana-native
 * signals (whale trades, token launches), premium web scraping (X, LinkedIn),
 * and search-with-provenance. Publishers here are we (Kēryx team) so demo
 * revenue flows to the treasury wallet.
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
  /** URL-safe id: e.g. "solana.whales", "search.web". Also the API slug. */
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
}

export const SEEDED_TOOLS: ToolDefinition[] = [
  {
    id: "solana.whales",
    name: "Whale Wallet Tracker",
    summary:
      "Returns the top Solana wallets that transacted in a given token in the last 24h, ranked by USD volume.",
    category: "solana",
    priceUsd: 0.005,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      token: {
        type: "string",
        required: true,
        description: "Solana token mint address or ticker (e.g. 'SOL', 'BONK').",
      },
      limit: {
        type: "number",
        description: "How many top wallets to return. Default 10.",
      },
    },
    sampleArgs: { token: "BONK", limit: 5 },
    verified: true,
    latencyMs: 850,
  },
  {
    id: "solana.launches",
    name: "New Token Launches",
    summary:
      "Returns Solana tokens launched in the last N minutes with 24h volume > threshold, sorted by momentum.",
    category: "solana",
    priceUsd: 0.003,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      windowMinutes: {
        type: "number",
        description: "Look-back window. Default 60.",
      },
      minVolumeUsd: {
        type: "number",
        description: "Minimum 24h volume. Default 10000.",
      },
    },
    sampleArgs: { windowMinutes: 60, minVolumeUsd: 25000 },
    verified: true,
    latencyMs: 720,
  },
  {
    id: "solana.rug-check",
    name: "Rug Risk Score",
    summary:
      "Heuristic risk score (0-100) for a Solana token: mint authority, LP lock, holder concentration, dev wallet.",
    category: "solana",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      mint: {
        type: "string",
        required: true,
        description: "Solana token mint address to score.",
      },
    },
    sampleArgs: { mint: "So11111111111111111111111111111111111111112" },
    verified: true,
    latencyMs: 950,
  },
  {
    id: "search.web",
    name: "Grounded Web Search",
    summary:
      "Web search that returns clean snippets + source URLs. Optimized for LLM grounding.",
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
        description: "How many results. Default 5.",
      },
    },
    sampleArgs: { query: "latest arc network stablecoin news", limit: 5 },
    verified: true,
    latencyMs: 620,
  },
  {
    id: "scrape.tweet-trends",
    name: "X / Twitter Trend Scraper",
    summary:
      "Returns trending topics or a specific user's recent posts, without an X API subscription.",
    category: "scrape",
    priceUsd: 0.006,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Kēryx",
    args: {
      target: {
        type: "string",
        required: true,
        description: "'trending' or an X username (without @).",
      },
      limit: {
        type: "number",
        description: "How many items. Default 10.",
      },
    },
    sampleArgs: { target: "trending", limit: 10 },
    verified: true,
    latencyMs: 1400,
  },
];

/** Map for O(1) lookup by id. Rebuilt from SEEDED_TOOLS every call so
 *  tests can rehydrate from a fresh module import. */
export function seedIndex(): Map<string, ToolDefinition> {
  return new Map(SEEDED_TOOLS.map((t) => [t.id, t]));
}
