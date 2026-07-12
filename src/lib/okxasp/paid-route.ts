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

    // Query aliases so marketplace / curl callers don't fail on naming
    if (typeof args.address === "string" && args.wallet == null) {
      args.wallet = args.address;
    }
    if (typeof args.mint === "string" && args.mintOrSymbol == null) {
      args.mintOrSymbol = args.mint;
    }
    if (typeof args.ids === "string" && args.coinIds == null) {
      // crypto.price accepts ids
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

    // OKX facilitator often returns 402 + PAYMENT-RESPONSE { success:true, status:"timeout", transaction }
    // when settle confirmation is slow — but the USDT0 transfer already landed.
    // Deliver the tool result instead of stranding a paid caller on empty {}.
    if (res.status === 402) {
      const settled = parseSettledPaymentResponse(res);
      if (settled) {
        const delivered = await business(forceJsonProtocolRequest(req));
        return attachPaymentResponse(delivered, res, settled);
      }
    }

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

type SettledPayment = {
  status: string;
  success: boolean;
  transaction: string;
  network?: string;
  payer?: string;
};

/**
 * Parse PAYMENT-RESPONSE. Treat success + tx as paid even when status is "timeout"
 * (facilitator confirmation lag on X Layer).
 */
function parseSettledPaymentResponse(res: Response): SettledPayment | null {
  const raw =
    res.headers.get("payment-response") ?? res.headers.get("PAYMENT-RESPONSE");
  if (!raw) return null;
  try {
    const pad = "=".repeat((4 - (raw.length % 4)) % 4);
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const data = JSON.parse(
      Buffer.from(b64, "base64").toString("utf8"),
    ) as Record<string, unknown>;
    const success = data.success === true;
    const tx =
      typeof data.transaction === "string" ? data.transaction.trim() : "";
    if (!success || !tx.startsWith("0x")) return null;
    return {
      status: typeof data.status === "string" ? data.status : "success",
      success: true,
      transaction: tx,
      network: typeof data.network === "string" ? data.network : undefined,
      payer: typeof data.payer === "string" ? data.payer : undefined,
    };
  } catch {
    return null;
  }
}

async function attachPaymentResponse(
  delivered: Response,
  settleRes: Response,
  settled: SettledPayment,
): Promise<NextResponse> {
  const pr =
    settleRes.headers.get("payment-response") ??
    settleRes.headers.get("PAYMENT-RESPONSE");
  const headers = new Headers(delivered.headers);
  if (pr) {
    headers.set("PAYMENT-RESPONSE", pr);
    const expose = headers.get("Access-Control-Expose-Headers") ?? "";
    if (!/PAYMENT-RESPONSE/i.test(expose)) {
      headers.set(
        "Access-Control-Expose-Headers",
        expose ? `${expose}, PAYMENT-RESPONSE` : "PAYMENT-RESPONSE",
      );
    }
  }

  const status = delivered.status;
  try {
    const data = (await delivered.json()) as Record<string, unknown>;
    return NextResponse.json(
      {
        ...data,
        payment: {
          status: settled.status,
          success: true,
          transaction: settled.transaction,
          network: settled.network ?? okxNetwork(),
          payer: settled.payer,
        },
      },
      { status: status === 502 ? 502 : 200, headers },
    );
  } catch {
    return new NextResponse(delivered.body, {
      status: status === 502 ? 502 : 200,
      statusText: delivered.statusText,
      headers,
    });
  }
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
    // Match OKX seller APIs — expose PAYMENT-REQUIRED for browser/agent clients.
    const expose = headers.get("Access-Control-Expose-Headers") ?? "";
    if (!/PAYMENT-REQUIRED/i.test(expose)) {
      headers.set(
        "Access-Control-Expose-Headers",
        expose
          ? `${expose}, PAYMENT-REQUIRED, WWW-Authenticate`
          : "PAYMENT-REQUIRED, WWW-Authenticate",
      );
    }
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
