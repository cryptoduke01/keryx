/**
 * Factory: wrap a Keryx tool handler with OKX x402 (withX402).
 * Settlement only runs after a successful handler response.
 */

import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@okxweb3/x402-next";
import { executeTool } from "@/lib/registry/handlers";
import {
  getOkxAspTool,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  priceUsdToOkxPrice,
  type OkxAspToolId,
} from "@/lib/okxasp/config";
import { getOkxResourceServer } from "@/lib/okxasp/server";
import { keryxOkxPaywall } from "@/lib/okxasp/paywall";

export function createOkxPaidToolHandlers(toolId: OkxAspToolId) {
  const tool = getOkxAspTool(toolId);
  if (!tool) {
    throw new Error(`unknown_okx_tool:${toolId}`);
  }

  const handler = async (req: NextRequest): Promise<NextResponse> => {
    let args: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        const body = (await req.json()) as unknown;
        if (body && typeof body === "object" && !Array.isArray(body)) {
          const rec = body as Record<string, unknown>;
          args =
            rec.args && typeof rec.args === "object" && !Array.isArray(rec.args)
              ? (rec.args as Record<string, unknown>)
              : rec;
        }
      } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }
    } else {
      const sp = req.nextUrl.searchParams;
      for (const [k, v] of sp.entries()) {
        if (k === "limit" || k === "amount" || k === "days") {
          const n = Number(v);
          args[k] = Number.isFinite(n) ? n : v;
        } else {
          args[k] = v;
        }
      }
    }

    try {
      const result = await executeTool(tool, args);
      return NextResponse.json({
        toolId: tool.id,
        name: tool.name,
        result,
        settlement: "okx-xlayer",
        network: okxNetwork(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "handler_failed";
      return NextResponse.json({ error: message, toolId: tool.id }, { status: 502 });
    }
  };

  if (!okxCredentialsReady()) {
    const blocked = async () =>
      NextResponse.json(
        {
          error: "okx_credentials_missing",
          hint: "Set OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, OKX_PAY_TO_ADDRESS in .env.local",
          docs: "/okxasp",
        },
        { status: 503 },
      );
    return { GET: blocked, POST: blocked };
  }

  const payTo = okxPayTo()!;
  const routeConfig = {
    accepts: {
      scheme: "exact",
      price: priceUsdToOkxPrice(tool.priceUsd),
      network: okxNetwork() as `${string}:${string}`,
      payTo,
    },
    description: tool.summary,
    mimeType: "application/json",
  };

  const server = getOkxResourceServer();
  const paywallConfig = {
    appName: "Keryx Finance Copilot",
    testnet: okxNetwork().includes("1952"),
  };
  // Settlement only after successful response (status < 400)
  const paid = withX402(
    handler,
    routeConfig,
    server,
    paywallConfig,
    keryxOkxPaywall,
    true,
  );
  return { GET: paid, POST: paid };
}
