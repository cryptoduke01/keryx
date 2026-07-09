/**
 * Factory: wrap a Keryx tool handler with OKX x402 (withX402).
 * Settlement only runs after a successful handler response.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  withX402FromHTTPServer,
  x402HTTPResourceServer,
} from "@okxweb3/x402-next";
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
        if (k === "limit" || k === "amount" || k === "days" || k === "timeFrame") {
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
  // Match OKX seller SDK docs: accepts as an array of exact options on eip155:196.
  // Marketplace review crawls Payment-Required; keep the stock JSON 402 path
  // (no custom HTML paywall) so the protocol header is never stripped.
  const routeConfig = {
    accepts: [
      {
        scheme: "exact" as const,
        price: priceUsdToOkxPrice(tool.priceUsd),
        network: okxNetwork() as `${string}:${string}`,
        payTo,
        // Reviewer / x402-check need decimals when USDT0 is not in their token list.
        extra: { decimals: 6 },
      },
    ],
    description: tool.summary,
    mimeType: "application/json",
  };

  const server = getOkxResourceServer();
  const httpServer = new x402HTTPResourceServer(server, { "*": routeConfig })
    .setPollDeadline(25_000)
    .onSettlementTimeout(async (txHash) => {
      return { confirmed: Boolean(txHash) };
    });

  const paid = withX402FromHTTPServer(
    handler,
    httpServer,
    undefined,
    undefined,
    true,
  );

  // OKX listing QA / Agent Payments Protocol detectors look for either:
  //   1) PAYMENT-REQUIRED header (v2), or
  //   2) JSON body with x402Version (v1 / mock-merchant style).
  // Stock @okxweb3/x402-next serves an HTML paywall (and drops the
  // protocol header) when Accept includes text/html AND User-Agent
  // includes Mozilla — which is how browser-like reviewers hit us.
  // Force the JSON path and dual-write the challenge into the body.
  const protocolOnly = async (req: NextRequest): Promise<NextResponse> => {
    const res = await paid(forceJsonProtocolRequest(req));
    return ensureProtocolChallengeBody(res);
  };
  return { GET: protocolOnly, POST: protocolOnly };
}

/** Rewrite Accept/UA so x402-core never takes the HTML paywall branch. */
function forceJsonProtocolRequest(req: NextRequest): NextRequest {
  const headers = new Headers(req.headers);
  headers.set("Accept", "application/json");
  const ua = headers.get("User-Agent") ?? "";
  if (ua.includes("Mozilla")) {
    headers.set("User-Agent", "OKX-A2MCP-Client/1.0");
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  return new NextRequest(req.url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // Required by undici when forwarding a streaming body.
    ...(hasBody ? ({ duplex: "half" } as RequestInit) : {}),
  });
}

/**
 * Stock v2 402 returns `{}` + PAYMENT-REQUIRED. OKX's own mock merchant
 * and Priority-3 detectors also accept a body with `x402Version`. Emit both.
 */
function ensureProtocolChallengeBody(res: NextResponse): NextResponse {
  if (res.status !== 402 && res.status !== 412) return res;

  const pr =
    res.headers.get("payment-required") ??
    res.headers.get("PAYMENT-REQUIRED");
  if (!pr) return res;

  try {
    const pad = "=".repeat((4 - (pr.length % 4)) % 4);
    const b64 = pr.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const challenge = JSON.parse(
      Buffer.from(b64, "base64").toString("utf8"),
    ) as Record<string, unknown>;
    if (typeof challenge.x402Version !== "number") return res;

    const headers = new Headers(res.headers);
    headers.set("Content-Type", "application/json");
    return new NextResponse(JSON.stringify(challenge), {
      status: res.status,
      headers,
    });
  } catch {
    return res;
  }
}
