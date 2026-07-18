import { NextResponse } from "next/server";
import { clampLedgerLimit, ledgerStats, readEntries } from "@/lib/ledger";

export const runtime = "nodejs";

/**
 * Public ledger JSON. Never 500s the homepage/live — degrades to empty.
 * Query: ?limit=N (1–200). Duplicate params use the first value (URL API).
 * Malformed limit falls back to 40.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // get() returns the first value if duplicated — no HPP bypass of clamp.
    const rawLimit = url.searchParams.get("limit");
    const limit = clampLedgerLimit(rawLimit ?? 40, 40);
    // Cap API responses below MAX_ENTRIES for response size.
    const apiLimit = Math.min(limit, 200);

    const [entries, stats] = await Promise.all([
      readEntries(apiLimit),
      ledgerStats(),
    ]);

    return NextResponse.json({
      stats,
      entries,
      meta: {
        limit: apiLimit,
        count: entries.length,
      },
    });
  } catch (err) {
    console.error("[api/ledger] GET failed", err);
    return NextResponse.json(
      {
        stats: {
          totalPaidUsd: 0,
          callCount: 0,
          publisherCount: 0,
          callerCount: 0,
          toolCount: 0,
        },
        entries: [],
        error: "ledger_temporarily_unavailable",
      },
      { status: 200 },
    );
  }
}
