/**
 * Day-1 storage: seeded in-memory plus a "user tools" list that persists
 * to Upstash Redis when configured, else falls back to a process-scoped
 * Map (fine for the demo, resets on cold start).
 *
 * Day 2 will move ledger events (every call + payment) to Redis too.
 */

import { Redis } from "@upstash/redis";
import { SEEDED_TOOLS, seedIndex, type ToolDefinition } from "./seed";

const HAS_REDIS =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = HAS_REDIS ? Redis.fromEnv() : null;

const memory = {
  userTools: new Map<string, ToolDefinition>(),
};

const KEY_TOOLS = "keryx:tools";

async function loadUserTools(): Promise<ToolDefinition[]> {
  if (redis) {
    const raw = await redis.hgetall(KEY_TOOLS);
    if (!raw) return [];
    return Object.values(raw).map((v) =>
      typeof v === "string" ? (JSON.parse(v) as ToolDefinition) : (v as ToolDefinition)
    );
  }
  return Array.from(memory.userTools.values());
}

async function saveUserTool(tool: ToolDefinition): Promise<void> {
  if (redis) {
    await redis.hset(KEY_TOOLS, { [tool.id]: JSON.stringify(tool) });
    return;
  }
  memory.userTools.set(tool.id, tool);
}

async function getUserTool(id: string): Promise<ToolDefinition | null> {
  if (redis) {
    const raw = await redis.hget<ToolDefinition | string>(KEY_TOOLS, id);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as ToolDefinition) : raw;
  }
  return memory.userTools.get(id) ?? null;
}

export async function listTools(): Promise<ToolDefinition[]> {
  const users = await loadUserTools();
  return [...SEEDED_TOOLS, ...users];
}

export async function getTool(id: string): Promise<ToolDefinition | null> {
  const seeded = seedIndex().get(id);
  if (seeded) return seeded;
  return getUserTool(id);
}

export async function upsertTool(tool: ToolDefinition): Promise<void> {
  if (seedIndex().has(tool.id)) {
    throw new Error(`Tool id "${tool.id}" is reserved by Kēryx seed.`);
  }
  await saveUserTool(tool);
}

export async function deleteUserTool(id: string): Promise<void> {
  if (seedIndex().has(id)) {
    throw new Error(`Tool id "${id}" is a Kēryx seed and cannot be deleted.`);
  }
  if (redis) {
    await redis.hdel(KEY_TOOLS, id);
    return;
  }
  memory.userTools.delete(id);
}
