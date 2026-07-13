/**
 * SEO / social metadata for the OKX.AI Finance Copilot surface only.
 * Deliberately separate from root Arc/USDC registry metadata so shares
 * of /okxasp never read as the main Keryx toll-booth product.
 */

import type { Metadata } from "next";

export const OKX_ASP_ID = "4759";
export const OKX_ASP_NAME = "Keryx Finance Copilot";
export const OKX_ASP_TYPE = "A2MCP";
export const OKX_ASP_MARKETPLACE = "OKX.AI";
export const OKX_ASP_ASSET = "USDT0";
export const OKX_ASP_CHAIN_LABEL = "X Layer";
export const OKX_ASP_PATH = "/okxasp";
export const OKX_ASP_SITE_ORIGIN = "https://keryxhq.xyz";
export const OKX_ASP_CANONICAL = `${OKX_ASP_SITE_ORIGIN}${OKX_ASP_PATH}`;
export const OKX_ASP_LISTING_URL = `https://okx.ai/agents/${OKX_ASP_ID}`;
export const OKX_ASP_TWITTER = "@keryxhq";

/** Browser tab + default OG title — product, ASP id, marketplace. */
export const OKX_ASP_TITLE =
  "Keryx Finance Copilot · ASP #4759 · LIVE on OKX.AI";

/**
 * Share / meta description. No Arc, no USDC, no registry publish story.
 * Agents + pay-per-call + USDT0 + X Layer only.
 */
export const OKX_ASP_DESCRIPTION =
  "Finance Copilot for AI agents on OKX.AI (ASP #4759). Nine tools: OKX Web3 prices, market snapshot, wallet PnL, Solana risk, FX. Pay per call in USDT0 on X Layer — 402 → pay → JSON.";

export const OKX_ASP_KEYWORDS = [
  "Keryx Finance Copilot",
  "OKX.AI",
  "ASP 4759",
  "A2MCP",
  "X Layer",
  "USDT0",
  "x402",
  "OKX Agent Payments Protocol",
  "agent finance",
  "pay per call",
] as const;

type OkxAspMetaOpts = {
  /** Full title string, or short segment merged via default template. */
  title?: string;
  description?: string;
  /** Path under site origin, e.g. /okxasp/docs */
  path?: string;
  /** openGraph type */
  ogType?: "website" | "article";
};

/**
 * Full Next.js Metadata for /okxasp and child routes.
 * Always points canonical + OG url at the OKX surface, not keryxhq.xyz root.
 */
export function okxAspMetadata(opts: OkxAspMetaOpts = {}): Metadata {
  const path = opts.path ?? OKX_ASP_PATH;
  const url = `${OKX_ASP_SITE_ORIGIN}${path}`;
  const title = opts.title ?? OKX_ASP_TITLE;
  const description = opts.description ?? OKX_ASP_DESCRIPTION;

  return {
    title,
    description,
    keywords: [...OKX_ASP_KEYWORDS],
    applicationName: OKX_ASP_NAME,
    authors: [{ name: "Keryx", url: OKX_ASP_SITE_ORIGIN }],
    creator: "Keryx",
    publisher: "Keryx",
    category: "technology",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: `${OKX_ASP_NAME} · OKX.AI`,
      locale: "en_US",
      type: opts.ogType ?? "website",
      // File convention opengraph-image.tsx under /okxasp supplies the card.
    },
    twitter: {
      card: "summary_large_image",
      site: OKX_ASP_TWITTER,
      creator: OKX_ASP_TWITTER,
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "okx:asp-id": OKX_ASP_ID,
      "okx:marketplace": OKX_ASP_MARKETPLACE,
      "okx:settlement": `${OKX_ASP_ASSET} · ${OKX_ASP_CHAIN_LABEL}`,
      "okx:listing": OKX_ASP_LISTING_URL,
    },
  };
}
