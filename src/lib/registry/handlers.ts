/**
 * Handler implementations for seeded Kēryx tools. Day 1 uses mocked-but-
 * realistic payloads so the demo works end-to-end even without upstream
 * API keys. Day 2 swaps in live upstreams (Birdeye, Helius, SerpAPI, etc).
 *
 * Every handler returns JSON that an LLM can reason about directly.
 */

import type { ToolDefinition } from "./seed";

interface CallContext {
  tool: ToolDefinition;
  args: Record<string, unknown>;
}

function pickStr(args: Record<string, unknown>, key: string, fallback = ""): string {
  const v = args[key];
  return typeof v === "string" ? v : fallback;
}
function pickNum(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = args[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

const MOCK_WHALES: Record<string, Array<{ wallet: string; volumeUsd: number; txCount: number }>> = {
  BONK: [
    { wallet: "7xKXt...W3Zf", volumeUsd: 482_310, txCount: 214 },
    { wallet: "3JmQe...aLpP", volumeUsd: 391_400, txCount: 178 },
    { wallet: "9BfR2...QcNq", volumeUsd: 227_650, txCount: 92 },
    { wallet: "GkR7Y...vT2s", volumeUsd: 198_412, txCount: 154 },
    { wallet: "2ZmAF...bBnc", volumeUsd: 154_002, txCount: 66 },
  ],
  SOL: [
    { wallet: "BinanceHot", volumeUsd: 42_310_000, txCount: 8210 },
    { wallet: "JupiterAgg", volumeUsd: 18_450_000, txCount: 5104 },
    { wallet: "DriftFund", volumeUsd: 6_720_000, txCount: 2891 },
  ],
};

async function handleWhales(ctx: CallContext) {
  const token = pickStr(ctx.args, "token", "BONK").toUpperCase();
  const limit = pickNum(ctx.args, "limit", 10);
  const rows = (MOCK_WHALES[token] ?? MOCK_WHALES.BONK).slice(0, limit);
  return {
    token,
    windowHours: 24,
    whales: rows,
    generatedAt: new Date().toISOString(),
  };
}

async function handleLaunches(ctx: CallContext) {
  const windowMinutes = pickNum(ctx.args, "windowMinutes", 60);
  const minVolumeUsd = pickNum(ctx.args, "minVolumeUsd", 10_000);
  return {
    windowMinutes,
    minVolumeUsd,
    tokens: [
      {
        ticker: "$KHRUX",
        mint: "KerY9x2...4tYp",
        launchedMinutesAgo: 12,
        volumeUsd: 78_400,
        priceUsd: 0.00042,
        holders: 421,
      },
      {
        ticker: "$LEPTON",
        mint: "LepT8n2...1kQq",
        launchedMinutesAgo: 34,
        volumeUsd: 132_900,
        priceUsd: 0.0018,
        holders: 892,
      },
      {
        ticker: "$OBOL",
        mint: "obL7Rx4...9mNm",
        launchedMinutesAgo: 48,
        volumeUsd: 47_620,
        priceUsd: 0.000091,
        holders: 214,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

async function handleRugCheck(ctx: CallContext) {
  const mint = pickStr(ctx.args, "mint", "");
  return {
    mint,
    score: 27,
    verdict: "moderate risk",
    signals: {
      mintAuthorityActive: false,
      lpLocked: true,
      lpLockDays: 180,
      top10HolderPct: 41.2,
      devWalletBalancePct: 3.4,
      liquidityUsd: 68_400,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function handleWebSearch(ctx: CallContext) {
  const query = pickStr(ctx.args, "query", "");
  const limit = pickNum(ctx.args, "limit", 5);
  return {
    query,
    results: [
      {
        title: "Arc Testnet Launches with Sub-Second Stablecoin Finality",
        url: "https://circle.com/blog/arc-testnet-launch",
        snippet:
          "Arc, Circle's stablecoin-native L1, moves USDC in under half a second with gasless batching for nanopayments.",
      },
      {
        title: "x402: The HTTP 402 Payment Standard Revived",
        url: "https://developers.circle.com/x402",
        snippet:
          "x402 lets any HTTP endpoint quote a price, verify a payment, and settle to a wallet without an API key handshake.",
      },
      {
        title: "Nanopayments Explained",
        url: "https://thecanteenapp.com/lepton",
        snippet:
          "Value as small as $0.000001, batched and settled in under half a second. The smallest coin, reborn for machines.",
      },
    ].slice(0, limit),
    generatedAt: new Date().toISOString(),
  };
}

async function handleTweetTrends(ctx: CallContext) {
  const target = pickStr(ctx.args, "target", "trending");
  const limit = pickNum(ctx.args, "limit", 10);
  const trending = [
    { topic: "$KHRUX", volume: 42_100, sentiment: 0.72 },
    { topic: "Arc mainnet", volume: 18_300, sentiment: 0.61 },
    { topic: "Kēryx", volume: 9_400, sentiment: 0.83 },
    { topic: "Lepton hackathon", volume: 6_120, sentiment: 0.55 },
    { topic: "x402", volume: 4_890, sentiment: 0.44 },
  ].slice(0, limit);
  return {
    target,
    items: trending,
    generatedAt: new Date().toISOString(),
  };
}

const HANDLERS: Record<string, (ctx: CallContext) => Promise<unknown>> = {
  "solana.whales": handleWhales,
  "solana.launches": handleLaunches,
  "solana.rug-check": handleRugCheck,
  "search.web": handleWebSearch,
  "scrape.tweet-trends": handleTweetTrends,
};

export async function executeTool(
  tool: ToolDefinition,
  args: Record<string, unknown>
): Promise<unknown> {
  const handler = HANDLERS[tool.id];
  if (!handler) {
    throw new Error(`No handler registered for tool "${tool.id}"`);
  }
  return handler({ tool, args });
}
