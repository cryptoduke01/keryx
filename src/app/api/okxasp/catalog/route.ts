import { NextResponse } from "next/server";
import {
  listOkxAspTools,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  priceUsdToOkxPrice,
  slugForToolId,
  isOkxNativeToolId,
  OKX_ASP_DISPLAY_NAME,
  OKX_ASP_ID,
  OKX_ASP_LISTING_URL,
  OKX_ASP_PRIMARY_SLUG,
} from "@/lib/okxasp/config";

export const runtime = "nodejs";

/**
 * Public catalog for the OKX Finance Copilot ASP.
 * Free to read — used for docs, listing copy, and agent discovery.
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const tools = listOkxAspTools().map((tool) => {
    const slug = slugForToolId(tool.id)!;
    const native = isOkxNativeToolId(tool.id);
    return {
      id: tool.id,
      slug,
      name: tool.name,
      summary: tool.summary,
      category: tool.category,
      priceUsd: tool.priceUsd,
      okxPrice: priceUsdToOkxPrice(tool.priceUsd),
      /** true = signed OKX Web3 APIs; false = public coverage feeds */
      native,
      sourceHint: native
        ? "okx-web3"
        : tool.id.startsWith("solana.")
          ? "dexscreener-or-rugcheck"
          : tool.id.startsWith("crypto.")
            ? "coingecko-class"
            : "public-api",
      args: tool.args,
      sampleArgs: tool.sampleArgs,
      endpoint: `${origin}/api/okxasp/tools/${slug}`,
      methods: ["GET", "POST"],
    };
  });

  const ready = okxCredentialsReady();
  const network = okxNetwork();
  const mainnet = network === "eip155:196";

  return NextResponse.json({
    asp: OKX_ASP_DISPLAY_NAME,
    aspId: OKX_ASP_ID,
    aspType: "A2MCP",
    marketplace: "OKX.AI",
    listing: OKX_ASP_LISTING_URL,
    /** Marketplace listing URL is source of truth for sold/reviews. */
    listingStatus: "listed",
    credentialsReady: ready,
    network,
    networkLabel: mainnet ? "X Layer mainnet" : network,
    payTo: okxPayTo(),
    asset: "USDT0",
    chain: "X Layer",
    /** Explicit so agents do not mix this catalog with Arc /api/tools. */
    settlement: "USDT0 on X Layer via OKX Agent Payments Protocol",
    buyerNote:
      "Seller payTo cannot pay its own ASP (platform payer_blocked). Use a different Agentic Wallet as buyer.",
    not: {
      arcRegistry: true,
      usdcOnArc: true,
      path: "/api/tools",
    },
    primaryEndpoint: `${origin}/api/okxasp/tools/${OKX_ASP_PRIMARY_SLUG}`,
    docs: `${origin}/okxasp/docs`,
    product: `${origin}/okxasp`,
    toolCount: tools.length,
    nativeToolCount: tools.filter((t) => t.native).length,
    tools,
  });
}
