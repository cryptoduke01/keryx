/**
 * Public payment ledger. Every paid tool call writes one entry.
 * Day 1: in-memory ring buffer + Redis list when configured.
 * The /live page tails this feed.
 *
 * Resilience: Redis / parse failures never throw to page renderers —
 * homepage and /live stay up with empty/partial data.
 */

import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

export interface LedgerEntry {
  id: string;
  ts: number;
  toolId: string;
  toolName: string;
  publisherName: string;
  publisherWallet: string;
  callerId: string; // an anonymous agent handle for the demo
  priceUsd: number;
  platformFeeUsd: number;
  netToPublisherUsd: number;
  status: "paid" | "pending" | "failed";
  /** Onchain tx hash if a real facilitator settled the payment. */
  txHash?: string;
  /** Which facilitator settled this — surfaces on /live as a badge. */
  settlementMode?: "gateway" | "local" | "demo";
}

const HAS_REDIS =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = HAS_REDIS ? Redis.fromEnv() : null;
const KEY_LEDGER = "keryx:ledger";
const KEY_TOTAL_CALLS = "keryx:ledger:total";
/**
 * Ring buffer size for the visible live list.
 * Raised from 200 so real usage can accumulate a convincing volume
 * before eviction. Stats "Calls" below prefers the persistent total
 * when available.
 */
const MAX_ENTRIES = 2000;

const memoryLedger: LedgerEntry[] = [];

const EMPTY_STATS = {
  totalPaidUsd: 0,
  callCount: 0,
  publisherCount: 0,
  callerCount: 0,
  toolCount: 0,
};

/** Clamp limit for lrange; never returns NaN. */
export function clampLedgerLimit(raw: unknown, fallback = 40): number {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw.trim())
        : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(MAX_ENTRIES, Math.floor(n)));
}

function parseEntry(r: unknown): LedgerEntry | null {
  try {
    const obj =
      typeof r === "string" ? (JSON.parse(r) as unknown) : (r as unknown);
    if (!obj || typeof obj !== "object") return null;
    const e = obj as Partial<LedgerEntry>;
    if (typeof e.id !== "string" || typeof e.toolId !== "string") return null;
    return {
      id: e.id,
      ts: typeof e.ts === "number" ? e.ts : Date.now(),
      toolId: e.toolId,
      toolName: typeof e.toolName === "string" ? e.toolName : e.toolId,
      publisherName:
        typeof e.publisherName === "string" ? e.publisherName : "unknown",
      publisherWallet:
        typeof e.publisherWallet === "string" ? e.publisherWallet : "",
      callerId: typeof e.callerId === "string" ? e.callerId : "",
      priceUsd: typeof e.priceUsd === "number" ? e.priceUsd : 0,
      platformFeeUsd:
        typeof e.platformFeeUsd === "number" ? e.platformFeeUsd : 0,
      netToPublisherUsd:
        typeof e.netToPublisherUsd === "number" ? e.netToPublisherUsd : 0,
      status:
        e.status === "paid" || e.status === "pending" || e.status === "failed"
          ? e.status
          : "paid",
      txHash: typeof e.txHash === "string" ? e.txHash : undefined,
      settlementMode:
        e.settlementMode === "gateway" ||
        e.settlementMode === "local" ||
        e.settlementMode === "demo"
          ? e.settlementMode
          : undefined,
    };
  } catch {
    return null;
  }
}

export async function recordEntry(
  entry: Omit<LedgerEntry, "id" | "ts">,
): Promise<LedgerEntry> {
  const full: LedgerEntry = { ...entry, id: nanoid(12), ts: Date.now() };
  if (redis) {
    try {
      await redis.lpush(KEY_LEDGER, JSON.stringify(full));
      await redis.ltrim(KEY_LEDGER, 0, MAX_ENTRIES - 1);
      await redis.incr(KEY_TOTAL_CALLS);
    } catch (err) {
      console.error("[ledger] redis write failed, using memory", err);
      memoryLedger.unshift(full);
      if (memoryLedger.length > MAX_ENTRIES) memoryLedger.length = MAX_ENTRIES;
    }
  } else {
    memoryLedger.unshift(full);
    if (memoryLedger.length > MAX_ENTRIES) memoryLedger.length = MAX_ENTRIES;
  }
  return full;
}

export async function readEntries(limit = 40): Promise<LedgerEntry[]> {
  const n = clampLedgerLimit(limit, 40);
  if (redis) {
    try {
      const raw = await redis.lrange(KEY_LEDGER, 0, n - 1);
      if (!Array.isArray(raw)) return memoryLedger.slice(0, n);
      const out: LedgerEntry[] = [];
      for (const r of raw) {
        const e = parseEntry(r);
        if (e) out.push(e);
      }
      return out;
    } catch (err) {
      console.error("[ledger] redis read failed", err);
      return memoryLedger.slice(0, n);
    }
  }
  return memoryLedger.slice(0, n);
}

/** Look up a single ledger row by id or onchain tx hash (for receipt verify). */
export async function findLedgerEntry(opts: {
  id?: string;
  txHash?: string;
}): Promise<LedgerEntry | null> {
  const id = opts.id?.trim();
  const txHash = opts.txHash?.trim().toLowerCase();
  if (!id && !txHash) return null;

  try {
    const window = await readEntries(MAX_ENTRIES);
    for (const entry of window) {
      if (id && entry.id === id) return entry;
      if (txHash && entry.txHash?.toLowerCase() === txHash) return entry;
    }
  } catch (err) {
    console.error("[ledger] find failed", err);
  }
  return null;
}

export async function ledgerStats(): Promise<{
  totalPaidUsd: number;
  callCount: number;
  publisherCount: number;
  callerCount: number;
  toolCount: number;
}> {
  try {
    const entries = await readEntries(MAX_ENTRIES);
    const publishers = new Set(
      entries.map((e) => e.publisherWallet).filter(Boolean),
    );
    const callers = new Set(
      entries.map((e) => e.callerId).filter((id): id is string => Boolean(id)),
    );
    const tools = new Set(entries.map((e) => e.toolId));
    const totalPaidUsd = entries.reduce(
      (sum, e) => sum + (Number.isFinite(e.priceUsd) ? e.priceUsd : 0),
      0,
    );

    let callCount = entries.length;
    if (redis) {
      try {
        const totalRaw = await redis.get<number | string>(KEY_TOTAL_CALLS);
        const n =
          typeof totalRaw === "number" ? totalRaw : Number(totalRaw ?? 0);
        if (Number.isFinite(n) && n > 0) callCount = n;
      } catch {
        /* fall back to window length */
      }
    } else {
      callCount = Math.max(callCount, memoryLedger.length);
    }
    callCount = Math.max(callCount, entries.length);

    return {
      totalPaidUsd: Number(totalPaidUsd.toFixed(6)),
      callCount,
      publisherCount: publishers.size,
      callerCount: callers.size,
      toolCount: tools.size,
    };
  } catch (err) {
    console.error("[ledger] stats failed", err);
    return { ...EMPTY_STATS };
  }
}
