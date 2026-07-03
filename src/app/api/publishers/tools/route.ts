/**
 * POST /api/publishers/tools — register a new tool.
 *
 * Publisher must first request a nonce from POST /api/publishers/nonce,
 * sign the returned canonical message with the wallet address they claim,
 * and submit the base64 or hex signature here alongside the tool payload.
 * Server rebuilds the exact signed message, verifies it via viem, and
 * consumes the nonce so it can't be replayed.
 *
 * This enforces that only the wallet that owns publisherWallet can list
 * tools under it. Tools are stored with verified=false until Kēryx
 * manually promotes them; the signature only proves wallet control.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyMessage } from "viem";
import { getTool, upsertTool } from "@/lib/registry/store";
import type { ToolDefinition } from "@/lib/registry/seed";
import { buildMessage, consumeNonce } from "@/lib/publishers/nonce";

export const runtime = "nodejs";

const CATEGORY = z.enum(["solana", "search", "scrape", "memory", "compute", "social"]);

const PublishSchema = z.object({
  id: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/, {
      message:
        "id must be lower-case letters, numbers, dots, dashes, or underscores.",
    }),
  name: z.string().min(2).max(80),
  summary: z.string().min(10).max(300),
  category: CATEGORY,
  priceUsd: z.number().positive().max(10),
  publisherWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "publisherWallet must be a 0x address" }),
  publisherName: z.string().min(1).max(60),
  /** Optional but required for the tool to be executable by Kēryx agents.
   *  The public HTTPS URL of the publisher's handler. Kēryx will POST the
   *  args object to this URL after payment verification/settlement. */
  handlerUrl: z.string().url().optional(),
  /** Server-issued nonce from POST /api/publishers/nonce. */
  nonce: z.string().min(1).max(64),
  /** UTC timestamp the nonce was issued at (echoed back by the client). */
  issuedAt: z.string().datetime(),
  /** EIP-191 personal_sign signature over the canonical message. */
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, { message: "signature must be 0x-hex" }),
  /** Optional JSON-schema style arg spec from publisher. */
  args: z.record(z.any()).optional(),
  sampleArgs: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PublishSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const existing = await getTool(data.id);
  if (existing) {
    return NextResponse.json(
      { error: "tool_id_taken", id: data.id },
      { status: 409 },
    );
  }

  // Rebuild the exact message we told the client to sign.
  const message = buildMessage({
    wallet: data.publisherWallet,
    toolId: data.id,
    nonce: data.nonce,
    issuedAt: data.issuedAt,
  });

  let signatureValid = false;
  try {
    signatureValid = await verifyMessage({
      address: data.publisherWallet as `0x${string}`,
      message,
      signature: data.signature as `0x${string}`,
    });
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) {
    return NextResponse.json(
      { error: "signature_invalid" },
      { status: 401 },
    );
  }

  const nonceOk = await consumeNonce(data.publisherWallet, data.nonce);
  if (!nonceOk) {
    return NextResponse.json(
      { error: "nonce_invalid_or_expired" },
      { status: 401 },
    );
  }

  const tool: ToolDefinition = {
    id: data.id,
    name: data.name,
    summary: data.summary,
    category: data.category,
    priceUsd: data.priceUsd,
    publisherWallet: data.publisherWallet as `0x${string}`,
    publisherName: data.publisherName,
    args: (data as any).args ?? {},
    sampleArgs: (data as any).sampleArgs ?? {},
    verified: false,
    latencyMs: 1000,
    handlerUrl: data.handlerUrl,
  };

  try {
    await upsertTool(tool);
  } catch (err) {
    return NextResponse.json(
      {
        error: "upsert_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    tool: { id: tool.id, name: tool.name, verifiedWallet: tool.publisherWallet },
  });
}
