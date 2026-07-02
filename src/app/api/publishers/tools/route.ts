/**
 * POST /api/publishers/tools — register a new tool.
 *
 * Day 2 accepts the submission and stores it. Day 3 will verify the
 * publisher wallet by signature (EIP-191 personal_sign of a nonce) before
 * accepting listings. For the demo window this open flow is acceptable
 * because handler execution is Kēryx-controlled — externally-provided
 * handlers ship day 3.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getTool, upsertTool } from "@/lib/registry/store";
import type { ToolDefinition } from "@/lib/registry/seed";

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
      { status: 400 }
    );
  }

  const existing = await getTool(parsed.data.id);
  if (existing) {
    return NextResponse.json(
      { error: "tool_id_taken", id: parsed.data.id },
      { status: 409 }
    );
  }

  const tool: ToolDefinition = {
    ...parsed.data,
    publisherWallet: parsed.data.publisherWallet as `0x${string}`,
    args: {
      /** Community tools open with an empty arg map — publishers refine
       *  via the /publish flow's advanced tab (day 3). */
    },
    sampleArgs: {},
    verified: false,
    latencyMs: 1000,
  };

  try {
    await upsertTool(tool);
  } catch (err) {
    return NextResponse.json(
      {
        error: "upsert_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, tool: { id: tool.id, name: tool.name } });
}
