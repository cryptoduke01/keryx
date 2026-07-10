import { buildLlmsTxt } from "@/lib/discovery/agent-manifest";

export const runtime = "nodejs";

/**
 * Agent-readable site map: /llms.txt
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const body = await buildLlmsTxt(origin);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
