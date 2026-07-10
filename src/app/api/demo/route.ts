/**
 * GET /api/demo — free sample before pay.
 * Returns the response shape of a cheap seeded tool without charging USDC.
 * Allowlisted to avoid free abuse of OKX quota / external handlerUrl / heavy scrapers.
 */

import { NextResponse } from "next/server";
import { getTool, listTools } from "@/lib/registry/store";
import { executeTool, isExecutableTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { getFacilitator } from "@/lib/x402/facilitator";
import { bazaarExtensionForTool } from "@/lib/x402/bazaar";
import { requirementsForTool } from "@/lib/x402/requirements";

export const runtime = "nodejs";

const DEFAULT_TOOL = "crypto.price";

/** Cheap, deterministic, or low-cost public APIs only. */
const DEMO_ALLOWLIST = new Set([
  "crypto.price",
  "crypto.trending",
  "time.current",
  "utility.uuid",
  "finance.convert",
  "weather.current",
]);

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map<string, { n: number; reset: number }>();

function clientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.reset) {
    hits.set(key, { n: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.n >= RATE_MAX) return false;
  cur.n += 1;
  return true;
}

export async function GET(req: Request) {
  if (!rateLimit(clientKey(req))) {
    return NextResponse.json(
      { error: "rate_limited", hint: "Max 20 free samples per minute per IP" },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const toolId = url.searchParams.get("toolId") ?? DEFAULT_TOOL;
  const facilitator = getFacilitator();

  if (!DEMO_ALLOWLIST.has(toolId)) {
    return NextResponse.json(
      {
        error: "tool_not_in_demo_allowlist",
        toolId,
        allowlist: [...DEMO_ALLOWLIST],
        hint: "Free samples are limited to cheap seeded tools. Paid path: POST /api/call",
      },
      { status: 400 },
    );
  }

  const tool = await getTool(toolId);
  if (!tool) {
    const catalog = (await listTools())
      .filter((t) => DEMO_ALLOWLIST.has(t.id))
      .map((t) => ({ id: t.id, priceUsd: t.priceUsd, name: t.name }));
    return NextResponse.json(
      {
        error: "tool_not_found",
        hint: "Pass ?toolId=<id> from the allowlist",
        catalog,
      },
      { status: 404 },
    );
  }

  if (!isExecutableTool(tool) || tool.handlerUrl) {
    return NextResponse.json(
      {
        error: "tool_not_demoable",
        toolId: tool.id,
        hint: "External handlerUrl tools are not free-demoable.",
      },
      { status: 400 },
    );
  }

  let sampleResult: unknown;
  try {
    sampleResult = await executeTool(tool, tool.sampleArgs ?? {});
  } catch (err) {
    const detail = err instanceof Error ? err.message : "upstream_error";
    return NextResponse.json(
      {
        error: "sample_upstream_failed",
        detail,
        toolId: tool.id,
        note: "Free sample hit the live upstream and it failed. The paid path uses the same handler.",
      },
      { status: 502 },
    );
  }

  const quote = quoteCall(tool.priceUsd);
  const requirements = requirementsForTool(tool, origin);

  return NextResponse.json({
    free: true,
    note:
      "This is an unpaid sample. Paid calls use POST /api/call with X-PAYMENT after a 402.",
    facilitatorMode: facilitator.mode,
    tool: {
      id: tool.id,
      name: tool.name,
      summary: tool.summary,
      priceUsd: tool.priceUsd,
      sampleArgs: tool.sampleArgs,
      args: tool.args,
    },
    quote,
    sampleResult,
    paid: {
      endpoint: `${origin}/api/call`,
      method: "POST",
      body: { toolId: tool.id, args: tool.sampleArgs ?? {} },
      firstCall: "HTTP 402 with accepts[0] + root extensions.bazaar",
      retryHeader: "X-PAYMENT",
      requirementsPreview: requirements,
      extensions: {
        bazaar: bazaarExtensionForTool(tool),
      },
    },
    next: [
      `curl -i -X POST ${origin}/api/call -H 'content-type: application/json' -d '{"toolId":"${tool.id}","args":${JSON.stringify(tool.sampleArgs ?? {})}}'`,
      `${origin}/quickstart.ts`,
      `${origin}/quickstart.py`,
      `${origin}/.well-known/x402`,
    ],
  });
}
