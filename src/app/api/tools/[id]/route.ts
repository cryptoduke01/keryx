import { NextResponse } from "next/server";
import { getTool } from "@/lib/registry/store";
import { quoteCall } from "@/lib/x402-price";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = await getTool(id);
  if (!tool) {
    return NextResponse.json({ error: "tool_not_found", id }, { status: 404 });
  }
  const quote = quoteCall(tool.priceUsd);
  // Never leak internal handlerUrl to callers.
  const { handlerUrl: _h, ...safeTool } = tool as any;
  return NextResponse.json({ tool: safeTool, quote });
}
