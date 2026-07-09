/**
 * Factory: wrap a Keryx tool handler with OKX Agent Payments Protocol.
 * Declares both x402 `exact` and MPP `charge` on every unpaid call.
 * Settlement only runs after a successful handler response.
 */

import { NextRequest, NextResponse } from "next/server";
import { executeTool } from "@/lib/registry/handlers";
import {
  getOkxAspTool,
  okxCredentialsReady,
  okxNetwork,
  type OkxAspToolId,
} from "@/lib/okxasp/config";
import { getOkxPaymentProtect } from "@/lib/okxasp/server";

export function createOkxPaidToolHandlers(toolId: OkxAspToolId) {
  const tool = getOkxAspTool(toolId);
  if (!tool) {
    throw new Error(`unknown_okx_tool:${toolId}`);
  }

  const business = async (req: Request): Promise<Response> => {
    let args: Record<string, unknown> = {};
    const method = req.method.toUpperCase();

    if (method === "POST") {
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
        return Response.json({ error: "invalid_json" }, { status: 400 });
      }
    } else {
      const sp = new URL(req.url).searchParams;
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
      return Response.json({
        toolId: tool.id,
        name: tool.name,
        result,
        settlement: "okx-xlayer",
        network: okxNetwork(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "handler_failed";
      return Response.json({ error: message, toolId: tool.id }, { status: 502 });
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

  const protect = getOkxPaymentProtect();
  const paid = protect(business);

  const protocolOnly = async (req: NextRequest): Promise<NextResponse> => {
    // Force JSON Accept so x402 never takes the HTML paywall branch
    // (Mozilla + text/html drops PAYMENT-REQUIRED).
    const res = await paid(forceJsonProtocolRequest(req));
    return toNextResponse(await ensureProtocolChallengeBody(res));
  };
  return { GET: protocolOnly, POST: protocolOnly };
}

/** Rewrite Accept/UA so x402-core never takes the HTML paywall branch. */
function forceJsonProtocolRequest(req: NextRequest): Request {
  const headers = new Headers(req.headers);
  headers.set("Accept", "application/json");
  const ua = headers.get("User-Agent") ?? "";
  if (ua.includes("Mozilla")) {
    headers.set("User-Agent", "OKX-A2MCP-Client/1.0");
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && req.body != null;
  const init: {
    method: string;
    headers: Headers;
    body?: BodyInit;
    duplex?: "half";
  } = { method: req.method, headers };
  if (hasBody) {
    init.body = req.body as BodyInit;
    init.duplex = "half";
  }
  return new Request(req.url, init);
}

/**
 * Stock v2 x402 returns `{}` + PAYMENT-REQUIRED. Dual-write the decoded
 * challenge into the body so Priority-3 detectors (body x402Version) also pass.
 * Keep WWW-Authenticate (MPP charge) intact.
 */
async function ensureProtocolChallengeBody(res: Response): Promise<Response> {
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
    return new Response(JSON.stringify(challenge), {
      status: res.status,
      headers,
    });
  } catch {
    return res;
  }
}

function toNextResponse(res: Response): NextResponse {
  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
