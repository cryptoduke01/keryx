import { NextResponse } from "next/server";
import {
  listOkxAspTools,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  slugForToolId,
} from "@/lib/okxasp/config";

/**
 * OKX ASP health — does not touch Arc settlement.
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const payTo = okxPayTo();
  const ready = okxCredentialsReady();
  const tools = listOkxAspTools().map((t) => ({
    id: t.id,
    endpoint: `${origin}/api/okxasp/tools/${slugForToolId(t.id)}`,
  }));

  return NextResponse.json({
    ok: true,
    feature: "keryx-finance-copilot",
    aspType: "A2MCP",
    marketplace: "OKX.AI",
    coexistence: {
      arcKeryx: "unchanged",
      okxAsp: "parallel",
    },
    xlayer: {
      network: okxNetwork(),
      mainnet: "eip155:196",
      testnet: "eip155:1952",
    },
    credentials: {
      OKX_API_KEY: Boolean(process.env.OKX_API_KEY?.trim()),
      OKX_SECRET_KEY: Boolean(process.env.OKX_SECRET_KEY?.trim()),
      OKX_PASSPHRASE: Boolean(process.env.OKX_PASSPHRASE?.trim()),
      OKX_PAY_TO_ADDRESS: Boolean(payTo),
      ready,
    },
    settlement: ready ? "okx_x402_wired" : "pending_credentials",
    protocol: {
      standard: "OKX Agent Payments Protocol / x402 exact",
      network: okxNetwork(),
      expectsMainnet: "eip155:196",
      aligned: okxNetwork() === "eip155:196",
    },
    catalog: `${origin}/api/okxasp/catalog`,
    tools,
    docs: "/okxasp",
    hackathonDoc: "docs/hackathon/OKX_AI_GENESIS.md",
    deadline: "2026-07-17T00:00:00.000Z",
  });
}
