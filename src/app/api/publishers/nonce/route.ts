/**
 * POST /api/publishers/nonce — issue a signable nonce for a wallet.
 *
 * Response includes the exact message the caller must sign. The wire
 * shape stays stable so a UI can round-trip it without knowing the
 * server's internal message format.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { issueNonce, buildMessage } from "@/lib/publishers/nonce";

export const runtime = "nodejs";

const Body = z.object({
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "wallet must be a 0x address" }),
  toolId: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/),
  action: z.enum(["register", "update", "delete"]).optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { wallet, toolId, action = "register" } = parsed.data;
  const nonce = await issueNonce(wallet);
  const issuedAt = new Date().toISOString();
  const message = buildMessage({ wallet, toolId, nonce, issuedAt, action });
  return NextResponse.json({
    ok: true,
    wallet,
    toolId,
    action,
    nonce,
    issuedAt,
    ttlSeconds: 300,
    message,
  });
}
