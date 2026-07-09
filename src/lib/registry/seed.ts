/**
 * Keryx seed registry. Every entry here maps to a real handler in
 * src/lib/registry/handlers.ts that hits a live public API — no mocked
 * data. Community publishers can add their own via POST /api/publishers/tools.
 *
 * The publishers for the seed lineup are the Keryx treasury so demo revenue
 * flows to a wallet we control while the platform is bootstrapping.
 */

import { KERYX_TREASURY_ADDRESS } from "@/lib/chains";

export type ToolCategory =
  | "solana"
  | "search"
  | "scrape"
  | "memory"
  | "compute"
  | "social"
  | "weather"
  | "finance"
  | "geo"
  | "dns"
  | "utility"
  | "web";

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
  /** Whether this tool is verified by Keryx (seeded = true). */
  verified: boolean;
  /** Approximate latency in ms (for agent budgeting). */
  latencyMs: number;
  /**
   * For community-published tools: the publisher's HTTPS endpoint that Keryx
   * will POST the args to (after payment settles). Keryx forwards the call
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
    publisherName: "Keryx",
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
    publisherName: "Keryx",
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
    publisherName: "Keryx",
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
    name: "Wikipedia Grounded Search",
    summary:
      "Factual search over Wikipedia. Returns page titles, short extracts, and URLs. Best for definitions, history, geography, notable facts, and established knowledge. NOT for prices, availability, bookings, current events, commercial recommendations, or live data.",
    category: "search",
    priceUsd: 0.004,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
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
    publisherName: "Keryx",
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

  // --- Weather (Open-Meteo, free no-key) ---
  {
    id: "weather.current",
    name: "Current Weather",
    summary: "Live current weather for any lat/lon. Worth paying for when the user needs up-to-the-minute conditions (travel today, outdoor plans, severe weather). Not needed for general city descriptions.",
    category: "weather",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      latitude: { type: "number", required: true, description: "Latitude, e.g. 40.71" },
      longitude: { type: "number", required: true, description: "Longitude, e.g. -74.00" },
      units: { type: "string", description: "celsius or fahrenheit (default celsius)" },
    },
    sampleArgs: { latitude: 40.71, longitude: -74.0, units: "fahrenheit" },
    verified: true,
    latencyMs: 420,
  },
  {
    id: "weather.forecast",
    name: "Weather Forecast",
    summary: "Hourly + daily forecast for a location (up to 7 days). Worth it for concrete near-term travel or event planning. Not needed for generic 'Berlin has seasons' advice.",
    category: "weather",
    priceUsd: 0.003,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      latitude: { type: "number", required: true, description: "Latitude" },
      longitude: { type: "number", required: true, description: "Longitude" },
      days: { type: "number", description: "Forecast days, 1-7 (default 3)" },
    },
    sampleArgs: { latitude: 52.52, longitude: 13.41, days: 3 },
    verified: true,
    latencyMs: 480,
  },

  // --- Finance / Currency (public currency APIs, no key) ---
  {
    id: "finance.exchange-rates",
    name: "Exchange Rates",
    summary: "Live fiat + crypto exchange rates for any base currency (200+ currencies). Call when you need current rates for a specific conversion or comparison you will show the user.",
    category: "finance",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      base: { type: "string", required: true, description: "Base currency code, e.g. usd, eur, btc" },
    },
    sampleArgs: { base: "usd" },
    verified: true,
    latencyMs: 380,
  },
  {
    id: "finance.convert",
    name: "Currency Converter",
    summary: "Convert an amount from one currency to another using live rates. Only call when you are actually going to perform and display a specific conversion for the user.",
    category: "finance",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      amount: { type: "number", required: true, description: "Amount to convert" },
      from: { type: "string", required: true, description: "From currency code (usd, eur...)" },
      to: { type: "string", required: true, description: "To currency code" },
    },
    sampleArgs: { amount: 100, from: "usd", to: "eur" },
    verified: true,
    latencyMs: 400,
  },

  // --- Geo / IP (free public geolocation) ---
  {
    id: "geo.ip-lookup",
    name: "IP Geolocation",
    summary: "Location, ISP, ASN, timezone and security flags for an IP (or caller's IP). Only useful when the user's actual location or network context materially affects the answer (e.g. local currency, nearby services, compliance).",
    category: "geo",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      ip: { type: "string", description: "IPv4 or IPv6. Omit to lookup the caller's IP (best effort)." },
    },
    sampleArgs: { ip: "8.8.8.8" },
    verified: true,
    latencyMs: 350,
  },

  // --- DNS / Domain (free whois) ---
  {
    id: "dns.domain-whois",
    name: "Domain WHOIS",
    summary: "Registrar, creation/expiry dates, name servers and status for a domain name.",
    category: "dns",
    priceUsd: 0.003,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      domain: { type: "string", required: true, description: "Domain name, e.g. example.com" },
    },
    sampleArgs: { domain: "keryxhq.xyz" },
    verified: true,
    latencyMs: 620,
  },

  // --- Web / Everyday (HN, GitHub public) ---
  {
    id: "web.hacker-news",
    name: "Hacker News Top",
    summary: "Top stories from Hacker News: title, url, score, comments, time.",
    category: "web",
    priceUsd: 0.001,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      limit: { type: "number", description: "How many stories (default 10, max 30)" },
    },
    sampleArgs: { limit: 8 },
    verified: true,
    latencyMs: 380,
  },
  {
    id: "web.github-repo",
    name: "GitHub Repo Info",
    summary: "Public repo metadata: stars, forks, description, language, license, last push.",
    category: "web",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      owner: { type: "string", required: true, description: "GitHub org or user" },
      repo: { type: "string", required: true, description: "Repository name" },
    },
    sampleArgs: { owner: "vercel", repo: "next.js" },
    verified: true,
    latencyMs: 450,
  },

  // --- Crypto prices (CoinGecko free) ---
  {
    id: "crypto.price",
    name: "Crypto Prices",
    summary: "Real-time price, market cap, 24h change for one or more coins (CoinGecko).",
    category: "finance",
    priceUsd: 0.002,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      ids: { type: "string", required: true, description: "Comma-separated coin ids or symbols, e.g. bitcoin,ethereum,solana" },
      vs: { type: "string", description: "vs currency, default usd" },
    },
    sampleArgs: { ids: "bitcoin,ethereum,solana", vs: "usd" },
    verified: true,
    latencyMs: 520,
  },

  // --- Utility ---
  {
    id: "utility.qr",
    name: "QR Code",
    summary: "Generate a QR code image URL for any text (URL, text, wallet address, etc.).",
    category: "utility",
    priceUsd: 0.001,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      text: { type: "string", required: true, description: "The content to encode (url, address, text)" },
      size: { type: "number", description: "Pixel size (default 200, 100-1000)" },
    },
    sampleArgs: { text: "https://keryxhq.xyz", size: 256 },
    verified: true,
    latencyMs: 280,
  },

  // Real external-creator example. The publisher wallet is a genuine second
  // wallet Keryx controls (funded from treasury with a small USDC float),
  // NOT the treasury itself and NOT a burner. When an agent pays for this
  // tool, real USDC lands in that external wallet onchain — provably not
  // going to Keryx, verifiable on Arcscan. This demonstrates the
  // publisher-payout flow end-to-end for external creators.
  {
    id: "demo.content-block",
    name: "Paid Creator Snippet",
    summary: "Example of a paid creator tool. Returns a monetized knowledge snippet. 95% of the fee lands directly in the external creator's Arc wallet (0x3AfD…B34E), not the Keryx treasury. Click the tx hash on /live to verify onchain.",
    category: "web",
    priceUsd: 0.004,
    publisherWallet: "0x3AfD3EF93cd406eBBd76fc1b32C58492FAd4B34E" as const,
    publisherName: "External Creator",
    args: {
      topic: { type: "string", required: true, description: "Topic for the snippet" },
    },
    sampleArgs: { topic: "what is x402" },
    verified: false,
    latencyMs: 200,
  },

  // --- Countries / Geo data ---
  {
    id: "geo.country",
    name: "Country Info",
    summary: "Basic country data: capital, population, currencies, languages, region. Mostly useful for structured lookup when building a specific comparison or form. General knowledge about Germany is usually sufficient.",
    category: "geo",
    priceUsd: 0.001,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {
      query: { type: "string", required: true, description: "Country name or ISO code (e.g. Brazil, BR, usa)" },
    },
    sampleArgs: { query: "japan" },
    verified: true,
    latencyMs: 410,
  },

  // --- Simple high-utility tools (pure or cheap public data) ---
  {
    id: "time.current",
    name: "Current Time",
    summary: "Precise current time in unix seconds, ISO, and human formats. Call when the agent must not hallucinate the date or needs a fresh timestamp for logs, expiries, or time-based decisions.",
    category: "utility",
    priceUsd: 0.0005,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {},
    sampleArgs: {},
    verified: true,
    latencyMs: 5,
  },
  {
    id: "utility.uuid",
    name: "UUID v4",
    summary: "Generate a random UUID v4. Useful when an agent needs a unique identifier for plans, sessions, or objects it is creating.",
    category: "utility",
    priceUsd: 0.0005,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {},
    sampleArgs: {},
    verified: true,
    latencyMs: 5,
  },
  {
    id: "crypto.btc-dominance",
    name: "BTC/ETH Market Dominance",
    summary: "Live BTC and ETH dominance percentages plus total crypto market cap from CoinGecko. Worth calling when the agent needs a broad market regime signal before making allocation or timing decisions.",
    category: "social",
    priceUsd: 0.0015,
    publisherWallet: KERYX_TREASURY_ADDRESS,
    publisherName: "Keryx",
    args: {},
    sampleArgs: {},
    verified: true,
    latencyMs: 650,
  },
];

/** Map for O(1) lookup by id. Rebuilt from SEEDED_TOOLS every call so
 *  tests can rehydrate from a fresh module import. */
export function seedIndex(): Map<string, ToolDefinition> {
  return new Map(SEEDED_TOOLS.map((t) => [t.id, t]));
}
