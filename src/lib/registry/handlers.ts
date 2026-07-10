/**
 * Real handlers for Keryx tools. Each one hits a live public API — no
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

async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "user-agent": "keryxhq.xyz (+https://keryxhq.xyz)",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`handler_${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
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
// weather.current + forecast (Open-Meteo, free public)
// ---------------------------------------------------------------------------

async function handleWeatherCurrent(ctx: CallContext) {
  const lat = pickNum(ctx.args, "latitude", NaN);
  const lon = pickNum(ctx.args, "longitude", NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Missing or invalid latitude/longitude");
  }
  const units = (pickStr(ctx.args, "units", "celsius") || "celsius").toLowerCase();
  const tempUnit = units.startsWith("f") ? "fahrenheit" : "celsius";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=${tempUnit === "fahrenheit" ? "fahrenheit" : "celsius"}&wind_speed_unit=ms`;
  const data = await fetchJson<any>(url);
  const cur = data.current || {};
  return {
    location: { latitude: lat, longitude: lon },
    temperature: cur.temperature_2m ?? null,
    apparentTemperature: cur.apparent_temperature ?? null,
    humidity: cur.relative_humidity_2m ?? null,
    windSpeedMs: cur.wind_speed_10m ?? null,
    weatherCode: cur.weather_code ?? null,
    units: { temperature: tempUnit, wind: "m/s" },
    source: "open-meteo",
    generatedAt: new Date().toISOString(),
  };
}

async function handleWeatherForecast(ctx: CallContext) {
  const lat = pickNum(ctx.args, "latitude", NaN);
  const lon = pickNum(ctx.args, "longitude", NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Missing or invalid latitude/longitude");
  const days = Math.min(Math.max(pickNum(ctx.args, "days", 3), 1), 7);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&forecast_days=${days}`;
  const data = await fetchJson<any>(url);
  const daily = data.daily || {};
  const out = (daily.time || []).map((t: string, i: number) => ({
    date: t,
    tMax: daily.temperature_2m_max?.[i] ?? null,
    tMin: daily.temperature_2m_min?.[i] ?? null,
    precipSum: daily.precipitation_sum?.[i] ?? null,
    windMax: daily.wind_speed_10m_max?.[i] ?? null,
  }));
  return { location: { latitude: lat, longitude: lon }, days: out, source: "open-meteo" };
}

// ---------------------------------------------------------------------------
// finance exchange rates (fawazahmed0 currency api, no key)
// ---------------------------------------------------------------------------

async function handleExchangeRates(ctx: CallContext) {
  const base = (pickStr(ctx.args, "base", "usd") || "usd").toLowerCase();
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`;
  const data = await fetchJson<any>(url);
  const rates = data[base] || {};
  return {
    base: base.toUpperCase(),
    rates,
    count: Object.keys(rates).length,
    source: "currency-api",
    generatedAt: new Date().toISOString(),
  };
}

async function handleConvert(ctx: CallContext) {
  const amount = pickNum(ctx.args, "amount", NaN);
  const from = (pickStr(ctx.args, "from", "") || "").toLowerCase();
  const to = (pickStr(ctx.args, "to", "") || "").toLowerCase();
  if (!Number.isFinite(amount) || !from || !to) throw new Error("amount, from, to are required");
  const [fromData, toData] = await Promise.all([
    fetchJson<any>(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`),
    fetchJson<any>(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${to}.json`),
  ]);
  const fromRateToUsd = fromData[from]?.usd ?? (from === "usd" ? 1 : null);
  const toRateFromUsd = toData[to] ? 1 / (toData[to].usd || 1) : (to === "usd" ? 1 : null);
  if (!fromRateToUsd || !toRateFromUsd) throw new Error("Unsupported currency");
  const result = amount * fromRateToUsd * toRateFromUsd;
  return {
    amount,
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    result: Number(result.toFixed(4)),
    source: "currency-api",
  };
}

// ---------------------------------------------------------------------------
// geo.ip-lookup (ipapi.co free)
// ---------------------------------------------------------------------------

async function handleIpLookup(ctx: CallContext) {
  const ip = pickStr(ctx.args, "ip", "").trim();
  const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : "https://ipapi.co/json/";
  const data = await fetchJson<any>(url);
  return {
    ip: data.ip || ip || null,
    city: data.city || null,
    region: data.region || null,
    country: data.country_name || data.country || null,
    countryCode: data.country_code || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    timezone: data.timezone || null,
    org: data.org || null,
    asn: data.asn || null,
    source: "ipapi.co",
  };
}

// ---------------------------------------------------------------------------
// dns.domain-whois (who-dat free public)
// ---------------------------------------------------------------------------

async function handleDomainWhois(ctx: CallContext) {
  const domain = pickStr(ctx.args, "domain", "").trim();
  if (!domain) throw new Error("domain is required");
  const url = `https://who-dat.as93.net/${encodeURIComponent(domain)}`;
  const data = await fetchJson<any>(url);
  return {
    domain,
    registrar: data.registrar || null,
    created: data.creation_date || data.created || null,
    expires: data.expiration_date || data.expires || null,
    updated: data.updated_date || null,
    nameServers: data.name_servers || data.nameservers || [],
    status: data.status || null,
    source: "who-dat",
  };
}

// ---------------------------------------------------------------------------
// web.hacker-news (Firebase public)
// ---------------------------------------------------------------------------

async function handleHackerNews(ctx: CallContext) {
  const limit = Math.min(Math.max(pickNum(ctx.args, "limit", 10), 1), 30);
  const topIds: number[] = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");
  const ids = (topIds || []).slice(0, limit);
  const items = await Promise.all(
    ids.map((id) => fetchJson<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)),
  );
  const stories = items
    .filter(Boolean)
    .map((it) => ({
      id: it.id,
      title: it.title,
      url: it.url || null,
      score: it.score ?? 0,
      by: it.by || null,
      time: it.time ? new Date(it.time * 1000).toISOString() : null,
      descendants: it.descendants ?? 0,
    }));
  return { count: stories.length, stories, source: "hacker-news" };
}

// ---------------------------------------------------------------------------
// web.github-repo (public GitHub REST, unauthenticated)
// ---------------------------------------------------------------------------

async function handleGithubRepo(ctx: CallContext) {
  const owner = pickStr(ctx.args, "owner", "").trim();
  const repo = pickStr(ctx.args, "repo", "").trim();
  if (!owner || !repo) throw new Error("owner and repo are required");
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const r = await fetchJson<any>(url);
  return {
    fullName: r.full_name,
    description: r.description,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    license: r.license?.spdx_id || r.license?.name || null,
    updatedAt: r.updated_at,
    htmlUrl: r.html_url,
    source: "github",
  };
}

// ---------------------------------------------------------------------------
// crypto.price (CoinGecko simple price)
// ---------------------------------------------------------------------------

async function handleCryptoPrice(ctx: CallContext) {
  const idsRaw = pickStr(ctx.args, "ids", "");
  const vs = (pickStr(ctx.args, "vs", "usd") || "usd").toLowerCase();
  if (!idsRaw) throw new Error("ids is required (comma separated)");
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20)
    .join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vs)}&include_market_cap=true&include_24hr_change=true`;
  const data = await fetchJson<Record<string, any>>(url);
  const out: Record<string, any> = {};
  for (const [id, v] of Object.entries(data || {})) {
    out[id] = {
      price: v[vs] ?? null,
      marketCap: v[`${vs}_market_cap`] ?? null,
      change24h: v[`${vs}_24h_change`] ?? null,
    };
  }
  return { vs: vs.toUpperCase(), prices: out, source: "coingecko" };
}

// ---------------------------------------------------------------------------
// utility.qr (public qrserver, returns image url)
// ---------------------------------------------------------------------------

async function handleQr(ctx: CallContext) {
  const text = pickStr(ctx.args, "text", "").trim();
  if (!text) throw new Error("text is required");
  const size = Math.min(Math.max(pickNum(ctx.args, "size", 200), 100), 1000);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return {
    text,
    size,
    qrUrl: url,
    source: "qrserver",
  };
}

// ---------------------------------------------------------------------------
// geo.country (restcountries free)
// ---------------------------------------------------------------------------

async function handleCountry(ctx: CallContext) {
  const q = pickStr(ctx.args, "query", "").trim();
  if (!q) throw new Error("query (country name or code) is required");
  const url = q.length === 2
    ? `https://restcountries.com/v3.1/alpha/${encodeURIComponent(q)}`
    : `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fullText=false`;
  const arr = await fetchJson<any[]>(url);
  const c = (arr && arr[0]) || {};
  return {
    name: c.name?.common || q,
    capital: c.capital?.[0] || null,
    region: c.region || null,
    population: c.population || null,
    currencies: c.currencies ? Object.keys(c.currencies) : [],
    languages: c.languages ? Object.values(c.languages) : [],
    source: "restcountries",
  };
}

// ---------------------------------------------------------------------------
// Generic proxy for externally-hosted publisher handlers.
// After Keryx has taken payment, we forward the args to the publisher's URL.
async function handleExternal(ctx: CallContext) {
  const url = ctx.tool.handlerUrl;
  if (!url) {
    throw new Error(`No handlerUrl configured for tool "${ctx.tool.id}"`);
  }
  // Forward exactly the args the agent supplied.
  const result = await postJson<unknown>(url, ctx.args);
  return {
    ...((typeof result === "object" && result !== null) ? result : { result }),
    source: "publisher",
    via: "keryx-external",
    handler: url,
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
  "weather.current": handleWeatherCurrent,
  "weather.forecast": handleWeatherForecast,
  "finance.exchange-rates": handleExchangeRates,
  "finance.convert": handleConvert,
  "geo.ip-lookup": handleIpLookup,
  "dns.domain-whois": handleDomainWhois,
  "web.hacker-news": handleHackerNews,
  "web.github-repo": handleGithubRepo,
  "crypto.price": handleCryptoPrice,
  "utility.qr": handleQr,
  "geo.country": handleCountry,
  "demo.content-block": handleDemoContentBlock,
  "time.current": handleTimeCurrent,
  "utility.uuid": handleUuid,
  "crypto.btc-dominance": handleBtcDominance,
  "okx.token-price": handleOkxTokenPrice,
  "okx.token-market": handleOkxTokenMarket,
  "okx.wallet-pnl": handleOkxWalletPnl,
  "okx.wallet-recent-pnl": handleOkxWalletRecentPnl,
};

async function handleDemoContentBlock(ctx: CallContext) {
  const topic = pickStr(ctx.args, "topic", "general").toLowerCase();
  const snippets: Record<string, string> = {
    "what is x402": "x402 is the HTTP 402 Payment Required standard for pay-per-request APIs. Client gets 402 with price, signs USDC auth, retries with X-Payment header.",
    "arc": "Arc is Circle's stablecoin-native L1. Gas in USDC, sub-second finality, designed for micropayments and agents.",
    general: "This is a demo paid snippet. In production the publisher returns real content after Keryx settles USDC to their payTo wallet.",
  };
  return {
    topic,
    snippet: snippets[topic] || snippets.general,
    note: "Demo external publisher tool — onchain settlement pays 100% of the call price to the listed publisher wallet (payTo).",
    source: "demo-external-publisher",
  };
}

export function isSeededExecutableTool(id: string): boolean {
  return id in HANDLERS;
}

/** A tool is executable in Keryx if either:
 *  - it is one of the built-in seeded handlers, or
 *  - it is a published tool that supplied a handlerUrl at publish time.
 */
export function isExecutableTool(tool: ToolDefinition): boolean {
  if (isSeededExecutableTool(tool.id)) return true;
  return !!tool.handlerUrl;
}

export async function executeTool(
  tool: ToolDefinition,
  args: Record<string, unknown>,
): Promise<unknown> {
  const handler = HANDLERS[tool.id];
  if (handler) {
    return handler({ tool, args });
  }
  if (tool.handlerUrl) {
    return handleExternal({ tool, args });
  }
  throw new Error(`No handler registered for tool "${tool.id}"`);
}

// ---------------------------------------------------------------------------
// time.current — always-fresh timestamp for agents that must not hallucinate "now"
// ---------------------------------------------------------------------------

async function handleTimeCurrent(_ctx: CallContext) {
  const now = new Date();
  return {
    unix: Math.floor(now.getTime() / 1000),
    iso: now.toISOString(),
    utc: now.toUTCString(),
    local: now.toString(),
    source: "system",
  };
}

// ---------------------------------------------------------------------------
// utility.uuid — generate a v4 uuid client-side (no external call)
// ---------------------------------------------------------------------------

async function handleUuid(_ctx: CallContext) {
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return { uuid };
}

// ---------------------------------------------------------------------------
// crypto.btc-dominance — real market data worth paying a fraction of a cent for
// ---------------------------------------------------------------------------

async function handleBtcDominance(_ctx: CallContext) {
  const raw = await fetchJson<any>("https://api.coingecko.com/api/v3/global");
  const mc = raw?.data?.market_cap_percentage || {};
  return {
    btcDominance: typeof mc.btc === "number" ? mc.btc : null,
    ethDominance: typeof mc.eth === "number" ? mc.eth : null,
    totalMarketCapUsd: raw?.data?.total_market_cap?.usd ?? null,
    updatedAt: new Date().toISOString(),
    source: "coingecko",
  };
}

async function handleOkxTokenPrice(ctx: CallContext) {
  const { fetchOkxTokenPrice } = await import("@/lib/okxasp/okx-market");
  const address = pickStr(ctx.args, "address", "").trim();
  const chain = pickStr(ctx.args, "chain", "ethereum").trim() || "ethereum";
  return fetchOkxTokenPrice({ address, chain });
}

async function handleOkxTokenMarket(ctx: CallContext) {
  const { fetchOkxTokenMarket } = await import("@/lib/okxasp/okx-market");
  const address = pickStr(ctx.args, "address", "").trim();
  const chain = pickStr(ctx.args, "chain", "ethereum").trim() || "ethereum";
  return fetchOkxTokenMarket({ address, chain });
}

async function handleOkxWalletPnl(ctx: CallContext) {
  const { fetchOkxWalletPnl } = await import("@/lib/okxasp/okx-market");
  const wallet = pickStr(ctx.args, "wallet", "").trim();
  const chain = pickStr(ctx.args, "chain", "ethereum").trim() || "ethereum";
  const timeFrame = pickStr(ctx.args, "timeFrame", "4").trim() || "4";
  return fetchOkxWalletPnl({ wallet, chain, timeFrame });
}

async function handleOkxWalletRecentPnl(ctx: CallContext) {
  const { fetchOkxWalletRecentPnl } = await import("@/lib/okxasp/okx-market");
  const wallet = pickStr(ctx.args, "wallet", "").trim();
  const chain = pickStr(ctx.args, "chain", "ethereum").trim() || "ethereum";
  const limit = pickNum(ctx.args, "limit", 10);
  return fetchOkxWalletRecentPnl({ wallet, chain, limit });
}
