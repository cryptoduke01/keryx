import { NextResponse } from "next/server";
import { listTools } from "@/lib/registry/store";

export const runtime = "nodejs";

export async function GET() {
  const tools = await listTools();
  return NextResponse.json(
    {
      count: tools.length,
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        summary: t.summary,
        category: t.category,
        priceUsd: t.priceUsd,
        publisherName: t.publisherName,
        publisherWallet: t.publisherWallet,
        verified: t.verified,
        latencyMs: t.latencyMs,
        args: t.args,
        sampleArgs: t.sampleArgs,
      })),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=10, stale-while-revalidate=60",
      },
    }
  );
}
