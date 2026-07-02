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
  txHash?: string;
}

const HAS_REDIS =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = HAS_REDIS ? Redis.fromEnv() : null;
const KEY_LEDGER = "keryx:ledger";
const MAX_ENTRIES = 200;

const memoryLedger: LedgerEntry[] = [];

export async function recordEntry(
  entry: Omit<LedgerEntry, "id" | "ts">
): Promise<LedgerEntry> {
  const full: LedgerEntry = { ...entry, id: nanoid(12), ts: Date.now() };
  if (redis) {
    await redis.lpush(KEY_LEDGER, JSON.stringify(full));
    await redis.ltrim(KEY_LEDGER, 0, MAX_ENTRIES - 1);
  } else {
    memoryLedger.unshift(full);
    if (memoryLedger.length > MAX_ENTRIES) memoryLedger.length = MAX_ENTRIES;
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
  return {
    totalPaidUsd: Number(totalPaidUsd.toFixed(6)),
    callCount: entries.length,
    publisherCount: publishers.size,
  };
}
