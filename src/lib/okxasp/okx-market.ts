/**
 * Signed calls to OKX Web3 market APIs (DEX price / price-info).
 * Uses the same OKX_API_KEY / SECRET / PASSPHRASE as the x402 facilitator.
 */

import { createHmac } from "crypto";

const OKX_WEB3_HOST = "https://web3.okx.com";

const CHAIN_INDEX: Record<string, string> = {
  ethereum: "1",
  eth: "1",
  "1": "1",
  xlayer: "196",
  "x-layer": "196",
  "196": "196",
  solana: "501",
  sol: "501",
  "501": "501",
  base: "8453",
  "8453": "8453",
  bsc: "56",
  "56": "56",
  arbitrum: "42161",
  "42161": "42161",
  polygon: "137",
  "137": "137",
};

function credentials(): { apiKey: string; secret: string; passphrase: string } {
  const apiKey = process.env.OKX_API_KEY?.trim() ?? "";
  const secret = process.env.OKX_SECRET_KEY?.trim() ?? "";
  const passphrase = process.env.OKX_PASSPHRASE?.trim() ?? "";
  if (!apiKey || !secret || !passphrase) {
    throw new Error("okx_credentials_missing");
  }
  return { apiKey, secret, passphrase };
}

async function okxRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const { apiKey, secret, passphrase } = credentials();
  const bodyStr = method === "POST" ? JSON.stringify(body ?? {}) : "";
  const timestamp = new Date().toISOString();
  const sign = createHmac("sha256", secret)
    .update(timestamp + method + path + bodyStr)
    .digest("base64");

  const res = await fetch(`${OKX_WEB3_HOST}${path}`, {
    method,
    headers: {
      "OK-ACCESS-KEY": apiKey,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passphrase,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? bodyStr : undefined,
    signal: AbortSignal.timeout(12_000),
  });

  const json = (await res.json()) as {
    code?: string | number;
    msg?: string;
    data?: T;
  };
  if (!res.ok || String(json.code) !== "0") {
    throw new Error(
      `okx_market_failed:${json.msg || json.code || res.status}`,
    );
  }
  return json.data as T;
}

async function okxPost<T>(path: string, body: unknown): Promise<T> {
  return okxRequest<T>("POST", path, body);
}

async function okxGet<T>(pathWithQuery: string): Promise<T> {
  return okxRequest<T>("GET", pathWithQuery);
}

export function resolveChainIndex(chain: string): string {
  const key = chain.trim().toLowerCase();
  const idx = CHAIN_INDEX[key];
  if (!idx) {
    throw new Error(
      `unsupported_chain:${chain}. Use ethereum, xlayer, solana, base, bsc, arbitrum, or polygon.`,
    );
  }
  return idx;
}

export interface OkxMarketPriceRow {
  chainIndex: string;
  tokenContractAddress: string;
  price: string;
  time: string;
}

export interface OkxMarketPriceInfoRow {
  chainIndex: string;
  tokenContractAddress?: string;
  price?: string;
  marketCap?: string;
  volume24h?: string;
  liquidity?: string;
  holders?: string;
  circSupply?: string;
  maxPrice?: string;
  minPrice?: string;
}

export async function fetchOkxTokenPrice(args: {
  address: string;
  chain?: string;
}): Promise<{
  chainIndex: string;
  address: string;
  priceUsd: number;
  time: string;
  source: "okx-web3";
}> {
  const address = args.address.trim();
  if (!address) throw new Error("address is required");
  const chainIndex = resolveChainIndex(args.chain ?? "ethereum");
  const data = await okxPost<OkxMarketPriceRow[]>(
    "/api/v6/dex/market/price",
    [{ chainIndex, tokenContractAddress: address }],
  );
  const row = data?.[0];
  if (!row?.price) throw new Error("okx_price_empty");
  return {
    chainIndex: row.chainIndex,
    address: row.tokenContractAddress,
    priceUsd: Number(row.price),
    time: row.time,
    source: "okx-web3",
  };
}

export async function fetchOkxTokenMarket(args: {
  address: string;
  chain?: string;
}): Promise<{
  chainIndex: string;
  address: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  holders: number | null;
  source: "okx-web3";
}> {
  const address = args.address.trim();
  if (!address) throw new Error("address is required");
  const chainIndex = resolveChainIndex(args.chain ?? "ethereum");
  const data = await okxPost<OkxMarketPriceInfoRow[]>(
    "/api/v6/dex/market/price-info",
    [{ chainIndex, tokenContractAddress: address }],
  );
  const row = data?.[0] ?? {};
  const num = (v?: string) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    chainIndex,
    address,
    priceUsd: num(row.price),
    marketCapUsd: num(row.marketCap),
    volume24hUsd: num(row.volume24h),
    liquidityUsd: num(row.liquidity),
    holders: num(row.holders),
    source: "okx-web3",
  };
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Wallet PnL overview from OKX Web3 (proprietary). */
export async function fetchOkxWalletPnl(args: {
  wallet: string;
  chain?: string;
  timeFrame?: string | number;
}): Promise<{
  chainIndex: string;
  wallet: string;
  realizedPnlUsd: number | null;
  winRate: number | null;
  buyTxCount: number | null;
  sellTxCount: number | null;
  buyTxVolumeUsd: number | null;
  sellTxVolumeUsd: number | null;
  top3PnlTokenSumUsd: number | null;
  topPnlTokens: unknown;
  source: "okx-web3";
}> {
  const wallet = args.wallet.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet) && wallet.length < 32) {
    throw new Error("wallet address is required");
  }
  const chainIndex = resolveChainIndex(args.chain ?? "ethereum");
  const timeFrame = String(args.timeFrame ?? "4");
  const path =
    `/api/v6/dex/market/portfolio/overview?walletAddress=${encodeURIComponent(wallet)}` +
    `&chainIndex=${encodeURIComponent(chainIndex)}&timeFrame=${encodeURIComponent(timeFrame)}`;
  const data = await okxGet<Record<string, unknown>>(path);
  return {
    chainIndex,
    wallet,
    realizedPnlUsd: numOrNull(data.realizedPnlUsd),
    winRate: numOrNull(data.winRate),
    buyTxCount: numOrNull(data.buyTxCount),
    sellTxCount: numOrNull(data.sellTxCount),
    buyTxVolumeUsd: numOrNull(data.buyTxVolume),
    sellTxVolumeUsd: numOrNull(data.sellTxVolume),
    top3PnlTokenSumUsd: numOrNull(data.top3PnlTokenSumUsd),
    topPnlTokens: data.topPnlTokenList ?? null,
    source: "okx-web3",
  };
}

/** Recent per-token PnL rows from OKX Web3. */
export async function fetchOkxWalletRecentPnl(args: {
  wallet: string;
  chain?: string;
  limit?: number;
}): Promise<{
  chainIndex: string;
  wallet: string;
  cursor: string | null;
  tokens: unknown[];
  source: "okx-web3";
}> {
  const wallet = args.wallet.trim();
  if (!wallet) throw new Error("wallet address is required");
  const chainIndex = resolveChainIndex(args.chain ?? "ethereum");
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
  const path =
    `/api/v6/dex/market/portfolio/recent-pnl?walletAddress=${encodeURIComponent(wallet)}` +
    `&chainIndex=${encodeURIComponent(chainIndex)}&limit=${limit}`;
  const data = await okxGet<{ cursor?: string; pnlList?: unknown[] }>(path);
  return {
    chainIndex,
    wallet,
    cursor: data.cursor ?? null,
    tokens: Array.isArray(data.pnlList) ? data.pnlList : [],
    source: "okx-web3",
  };
}
