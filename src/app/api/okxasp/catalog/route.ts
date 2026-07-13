import { NextResponse } from "next/server";
import {
  listOkxAspTools,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  priceUsdToOkxPrice,
  slugForToolId,
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
    return {
      id: tool.id,
      slug,
      name: tool.name,
      summary: tool.summary,
      category: tool.category,
      priceUsd: tool.priceUsd,
      okxPrice: priceUsdToOkxPrice(tool.priceUsd),
      args: tool.args,
      sampleArgs: tool.sampleArgs,
      endpoint: `${origin}/api/okxasp/tools/${slug}`,
      methods: ["GET", "POST"],
    };
  });

  return NextResponse.json({
    asp: OKX_ASP_DISPLAY_NAME,
    aspId: OKX_ASP_ID,
    aspType: "A2MCP",
    marketplace: "OKX.AI",
    listing: OKX_ASP_LISTING_URL,
    status: "LIVE",
    network: okxNetwork(),
    payTo: okxPayTo(),
    credentialsReady: okxCredentialsReady(),
    asset: "USDT0",
    chain: "X Layer",
    /** Explicit so agents do not mix this catalog with Arc /api/tools. */
    settlement: "USDT0 on X Layer via OKX Agent Payments Protocol",
    not: {
      arcRegistry: true,
      usdcOnArc: true,
      path: "/api/tools",
    },
    primaryEndpoint: `${origin}/api/okxasp/tools/${OKX_ASP_PRIMARY_SLUG}`,
    docs: `${origin}/okxasp/docs`,
    product: `${origin}/okxasp`,
    tools,
  });
}
