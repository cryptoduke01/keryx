/**
 * Public payment ledger. Every paid tool call writes one entry.
 * Day 1: in-memory ring buffer + Redis list when configured.
 * The /live page tails this feed.
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

export async function recordEntry(
  entry: Omit<LedgerEntry, "id" | "ts">
): Promise<LedgerEntry> {
  const full: LedgerEntry = { ...entry, id: nanoid(12), ts: Date.now() };
  if (redis) {
    await redis.lpush(KEY_LEDGER, JSON.stringify(full));
    await redis.ltrim(KEY_LEDGER, 0, MAX_ENTRIES - 1);
    // Persistent total so the "Calls" stat keeps growing even across trims
    // and across deploys (as long as the same Upstash is used).
    await redis.incr(KEY_TOTAL_CALLS);
  } else {
    memoryLedger.unshift(full);
    if (memoryLedger.length > MAX_ENTRIES) memoryLedger.length = MAX_ENTRIES;
    // memory total is just the length of what we keep (best effort)
  }
  return full;
}

export async function readEntries(limit = 40): Promise<LedgerEntry[]> {
  if (redis) {
    const raw = await redis.lrange(KEY_LEDGER, 0, Math.min(limit, MAX_ENTRIES) - 1);
    return raw.map((r) =>
      typeof r === "string" ? (JSON.parse(r) as LedgerEntry) : (r as LedgerEntry)
    );
  }
  return memoryLedger.slice(0, limit);
}

export async function ledgerStats(): Promise<{
  totalPaidUsd: number;
  callCount: number;
  publisherCount: number;
}> {
  const entries = await readEntries(MAX_ENTRIES);
  const publishers = new Set(entries.map((e) => e.publisherWallet));
  const totalPaidUsd = entries.reduce((sum, e) => sum + e.priceUsd, 0);

  // Prefer a persistent counter (incr'd on every recordEntry) so the
  // displayed call volume keeps climbing instead of being capped by
  // the ring buffer size.
  let callCount = entries.length;
  if (redis) {
    try {
      const totalRaw = await redis.get<number | string>(KEY_TOTAL_CALLS);
      const n = typeof totalRaw === "number" ? totalRaw : Number(totalRaw ?? 0);
      if (n > 0) callCount = n;
    } catch {
      /* fall back to window length */
    }
  } else {
    // in-memory: at least report what we have kept
    callCount = Math.max(callCount, memoryLedger.length);
  }
  // Never report fewer calls than what is currently in the visible window.
  // This ensures that even if the counter was introduced after some entries
  // existed, the dashboard shows at least the real recent volume.
  callCount = Math.max(callCount, entries.length);

  return {
    totalPaidUsd: Number(totalPaidUsd.toFixed(6)),
    callCount,
    publisherCount: publishers.size,
  };
}
