/**
 * Short-lived nonces for EIP-191 publisher wallet verification.
 *
 * Flow:
 *   1. Publisher POSTs to /api/publishers/nonce with their wallet address.
 *   2. Server issues a nonce, stores it keyed by wallet, TTL 5 minutes.
 *   3. Publisher signs the canonical message (see buildMessage) with their
 *      wallet and POSTs to /api/publishers/tools with the signature.
 *   4. Server rebuilds the exact message, verifies signature via viem, and
 *      deletes the nonce so it can't be replayed.
 *
 * Persistence follows the same Redis-when-configured / in-memory-otherwise
 * pattern used by the rest of the codebase, so a serverless cold-start
 * on Vercel doesn't lose nonces mid-flow when Upstash is configured.
 */

import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

const HAS_REDIS =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = HAS_REDIS ? Redis.fromEnv() : null;

const TTL_SECONDS = 300;
const memoryStore = new Map<string, { nonce: string; expiresAt: number }>();

function keyFor(wallet: string): string {
  return `keryx:pub-nonce:${wallet.toLowerCase()}`;
}

export async function issueNonce(wallet: string): Promise<string> {
  const nonce = nanoid(24);
  if (redis) {
    await redis.set(keyFor(wallet), nonce, { ex: TTL_SECONDS });
  } else {
    memoryStore.set(keyFor(wallet), {
      nonce,
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    });
  }
  return nonce;
}

export async function consumeNonce(wallet: string, presented: string): Promise<boolean> {
  const key = keyFor(wallet);
  if (redis) {
    const stored = await redis.get<string>(key);
    if (!stored || stored !== presented) return false;
    await redis.del(key);
    return true;
  }
  const entry = memoryStore.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return false;
  }
  if (entry.nonce !== presented) return false;
  memoryStore.delete(key);
  return true;
}

export type PublisherAction = "register" | "update" | "delete";

/**
 * The canonical message a publisher signs. This is exactly what viem will
 * verify against, so any change here breaks existing sessions. Both sides
 * (nonce issuer + verifier) construct the message via this function.
 */
export function buildMessage(params: {
  wallet: string;
  toolId: string;
  nonce: string;
  issuedAt: string;
  action?: PublisherAction;
}): string {
  const action = params.action ?? "register";
  const actionLine =
    action === "register"
      ? "Signing this message proves you control the wallet and authorizes Kēryx to list this tool under it."
      : action === "update"
        ? "Signing this message proves you control the wallet and authorizes Kēryx to update the listing for this tool."
        : "Signing this message proves you control the wallet and authorizes Kēryx to delete this tool listing.";

  return [
    "Kēryx publisher action",
    "",
    `Action: ${action.toUpperCase()}`,
    `Wallet: ${params.wallet}`,
    `Tool:   ${params.toolId}`,
    `Nonce:  ${params.nonce}`,
    `Issued: ${params.issuedAt}`,
    "",
    actionLine,
  ].join("\n");
}
