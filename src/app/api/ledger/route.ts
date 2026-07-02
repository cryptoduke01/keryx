import { NextResponse } from "next/server";
import { ledgerStats, readEntries } from "@/lib/ledger";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 40)));
  const [entries, stats] = await Promise.all([readEntries(limit), ledgerStats()]);
  return NextResponse.json({
    stats,
    entries,
  });
}
