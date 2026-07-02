/**
 * Real handlers for Kēryx tools. Each one hits a live public API — no
 * hardcoded mocks. If an upstream is down, we surface the error to the
 * caller rather than making something up.
 *
 * Upstreams:
 *   - solana.token-activity → DexScreener (Solana pair data)
 *   - solana.launches       → DexScreener latest token profiles
 *   - solana.rug-check      → RugCheck.xyz
 *   - search.web            → Wikipedia REST + MediaWiki search
 *   - crypto.trending       → CoinGecko trending
 *
 * Each fetch runs with a hard timeout so a slow upstream can't stall
 * a paid call for the whole 60-second x402 window.
 */

import type { ToolDefinition } from "./seed";

interface CallContext {
  tool: ToolDefinition;
  args: Record<string, unknown>;
}

function pickStr(args: Record<string, unknown>, key: string, fallback = ""): string {
  const v = args[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function pickNum(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = args[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "keryxhq.xyz (+https://keryxhq.xyz)" },
    });
    if (!res.ok) {
      throw new Error(`upstream_${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// solana.token-activity
// ---------------------------------------------------------------------------

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  volume?: { h24?: number; h6?: number; h1?: number };
  txns?: { h24?: { buys: number; sells: number } };
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
  url?: string;
}

async function handleTokenActivity(ctx: CallContext) {
  const query = pickStr(ctx.args, "mintOrSymbol") || pickStr(ctx.args, "token");
  if (!query) {
    throw new Error("Missing required arg: mintOrSymbol");
  }
  const raw = await fetchJson<{ pairs: DexScreenerPair[] }>(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
  );
  const solPairs = (raw.pairs ?? []).filter((p) => p.chainId === "solana");
  if (solPairs.length === 0) {
    return { query, chain: "solana", found: false, pairs: [] };
  }
  const top = solPairs
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
    .slice(0, 5)
    .map((p) => ({
      pairAddress: p.pairAddress,
      dex: p.dexId,
      symbol: p.baseToken.symbol,
      priceUsd: p.priceUsd,
      volume24hUsd: p.volume?.h24 ?? 0,
      txns24h: p.txns?.h24 ?? { buys: 0, sells: 0 },
      liquidityUsd: p.liquidity?.usd ?? 0,
      marketCapUsd: p.marketCap ?? p.fdv ?? null,
      dexscreenerUrl: p.url,
    }));
  return {
    query,
    chain: "solana",
    found: true,
    topPairs: top,
    generatedAt: new Date().toISOString(),
    source: "dexscreener",
  };
}

// ---------------------------------------------------------------------------
// solana.launches
// ---------------------------------------------------------------------------

interface DexScreenerProfile {
  chainId: string;
  tokenAddress: string;
  description?: string;
  links?: Array<{ label?: string; type?: string; url: string }>;
  icon?: string;
  header?: string;
  openGraph?: string;
  url?: string;
}

async function handleLaunches(ctx: CallContext) {
  const limit = Math.min(Math.max(pickNum(ctx.args, "limit", 5), 1), 20);
  const raw = await fetchJson<DexScreenerProfile[]>(
    "https://api.dexscreener.com/token-profiles/latest/v1",
  );
  const solanaProfiles = (Array.isArray(raw) ? raw : []).filter(
    (p) => p.chainId === "solana",
  );
  const items = solanaProfiles.slice(0, limit).map((p) => ({
    mint: p.tokenAddress,
    description: p.description ?? null,
    icon: p.icon ?? null,
    links: (p.links ?? []).map((l) => ({ label: l.label ?? l.type, url: l.url })),
    dexscreenerUrl: p.url ?? `https://dexscreener.com/solana/${p.tokenAddress}`,
  }));
  return {
    count: items.length,
    tokens: items,
    generatedAt: new Date().toISOString(),
    source: "dexscreener",
  };
}

// ---------------------------------------------------------------------------
// solana.rug-check
// ---------------------------------------------------------------------------

interface RugCheckSummary {
  score?: number;
  score_normalised?: number;
  risks?: Array<{ name: string; description: string; level: string; score?: number }>;
  lpLockedPct?: number;
  tokenProgram?: string;
  tokenType?: string;
}

async function handleRugCheck(ctx: CallContext) {
  const mint = pickStr(ctx.args, "mint");
  if (!mint) {
    throw new Error("Missing required arg: mint");
  }
  const raw = await fetchJson<RugCheckSummary>(
    `https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(mint)}/report/summary`,
  );
  return {
    mint,
    score: raw.score ?? null,
    scoreNormalised: raw.score_normalised ?? null,
    lpLockedPct: raw.lpLockedPct ?? null,
    tokenType: raw.tokenType ?? null,
    tokenProgram: raw.tokenProgram ?? null,
    risks: (raw.risks ?? []).map((r) => ({
      name: r.name,
      level: r.level,
      description: r.description,
      score: r.score,
    })),
    generatedAt: new Date().toISOString(),
    source: "rugcheck.xyz",
  };
}

// ---------------------------------------------------------------------------
// search.web
// ---------------------------------------------------------------------------

interface WikiSearchHit {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikiSummary {
  title: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
}

async function handleWebSearch(ctx: CallContext) {
  const query = pickStr(ctx.args, "query");
  if (!query) {
    throw new Error("Missing required arg: query");
  }
  const limit = Math.min(Math.max(pickNum(ctx.args, "limit", 3), 1), 5);

  const searchRes = await fetchJson<{ query?: { search?: WikiSearchHit[] } }>(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query,
    )}&srlimit=${limit}&format=json&origin=*`,
  );
  const hits = searchRes.query?.search ?? [];
  if (hits.length === 0) {
    return { query, results: [], source: "wikipedia" };
  }

  const summaries = await Promise.all(
    hits.map(async (h) => {
      try {
        const s = await fetchJson<WikiSummary>(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            h.title.replace(/ /g, "_"),
          )}`,
        );
        return {
          title: s.title,
          snippet: (s.extract ?? h.snippet.replace(/<[^>]+>/g, "")).slice(0, 320),
          url: s.content_urls?.desktop?.page ?? null,
          thumbnail: s.thumbnail?.source ?? null,
        };
      } catch {
        return {
          title: h.title,
          snippet: h.snippet.replace(/<[^>]+>/g, "").slice(0, 320),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
          thumbnail: null,
        };
      }
    }),
  );

  return {
    query,
    results: summaries,
    source: "wikipedia",
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// crypto.trending
// ---------------------------------------------------------------------------

interface CoinGeckoTrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank?: number;
    thumb?: string;
    score?: number;
    data?: {
      price?: number;
      price_change_percentage_24h?: { usd?: number };
      market_cap?: string;
      total_volume?: string;
    };
  };
}

async function handleTrending(ctx: CallContext) {
  const limit = Math.min(Math.max(pickNum(ctx.args, "limit", 7), 1), 15);
  const raw = await fetchJson<{ coins?: CoinGeckoTrendingCoin[] }>(
    "https://api.coingecko.com/api/v3/search/trending",
  );
  const coins = (raw.coins ?? []).slice(0, limit).map((c) => ({
    symbol: c.item.symbol.toUpperCase(),
    name: c.item.name,
    marketCapRank: c.item.market_cap_rank ?? null,
    priceUsd: c.item.data?.price ?? null,
    change24hPct: c.item.data?.price_change_percentage_24h?.usd ?? null,
    marketCap: c.item.data?.market_cap ?? null,
    volume24h: c.item.data?.total_volume ?? null,
    trendingRank: c.item.score ?? null,
  }));
  return {
    count: coins.length,
    coins,
    generatedAt: new Date().toISOString(),
    source: "coingecko",
  };
}

// ---------------------------------------------------------------------------
// dispatcher
// ---------------------------------------------------------------------------

const HANDLERS: Record<string, (ctx: CallContext) => Promise<unknown>> = {
  "solana.token-activity": handleTokenActivity,
  "solana.launches": handleLaunches,
  "solana.rug-check": handleRugCheck,
  "search.web": handleWebSearch,
  "crypto.trending": handleTrending,
};

export async function executeTool(
  tool: ToolDefinition,
  args: Record<string, unknown>,
): Promise<unknown> {
  const handler = HANDLERS[tool.id];
  if (!handler) {
    throw new Error(`No handler registered for tool "${tool.id}"`);
  }
  return handler({ tool, args });
}
