import { NextResponse } from "next/server";
import {
  listOkxAspTools,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  priceUsdToOkxPrice,
  slugForToolId,
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
    asp: "Kēryx Finance Copilot",
    aspType: "A2MCP",
    marketplace: "OKX.AI",
    network: okxNetwork(),
    payTo: okxPayTo(),
    credentialsReady: okxCredentialsReady(),
    asset: "USDT0",
    docs: `${origin}/okxasp/docs`,
    product: `${origin}/okxasp`,
    tools,
  });
}
