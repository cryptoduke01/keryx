import { NextResponse } from "next/server";
import {
  listOkxAspTools,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  slugForToolId,
  OKX_ASP_DISPLAY_NAME,
  OKX_ASP_ID,
  OKX_ASP_LISTING_URL,
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
    asp: OKX_ASP_DISPLAY_NAME,
    aspId: OKX_ASP_ID,
    listing: OKX_ASP_LISTING_URL,
    status: "LIVE",
    aspType: "A2MCP",
    marketplace: "OKX.AI",
    coexistence: {
      arcKeryx: "unchanged — USDC on Arc at / and /api/call",
      okxAsp: "parallel — USDT0 on X Layer at /okxasp and /api/okxasp/*",
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
      // HTTP sellers must declare both exact + charge (OKX Agent Payments Protocol).
      standard: "OKX Agent Payments Protocol",
      schemes: ["exact", "charge"],
      network: okxNetwork(),
      expectsMainnet: "eip155:196",
      aligned: okxNetwork() === "eip155:196",
      challengeTransport: ["PAYMENT-REQUIRED", "WWW-Authenticate: Payment"],
      htmlPaywall: false,
    },
    catalog: `${origin}/api/okxasp/catalog`,
    tools,
    docs: "/okxasp",
    hackathonDoc: "docs/hackathon/OKX_AI_GENESIS.md",
    deadline: "2026-07-17T00:00:00.000Z",
  });
}
