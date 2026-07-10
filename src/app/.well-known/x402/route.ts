import { NextResponse } from "next/server";
import { buildX402Manifest } from "@/lib/discovery/agent-manifest";

export const runtime = "nodejs";

/**
 * Agent discovery: /.well-known/x402
 * Lists free surfaces + every registry tool as a paid /api/call resource.
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const manifest = await buildX402Manifest(origin);
  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
