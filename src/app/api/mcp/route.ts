/**
 * POST /api/mcp — Model Context Protocol server for Kēryx.
 *
 * Speaks MCP's JSON-RPC 2.0 dialect so a Claude Code, Cursor, or Anthropic
 * MCP-compatible client can list Kēryx's registry tools and call them by
 * name, no separate HTTP integration required.
 *
 * Transport is the streamable-HTTP flavor from the 2025-03-26 revision of the
 * MCP spec, in its simplest form: each POST is one JSON-RPC message, the
 * response body is one JSON-RPC message. No SSE, no sessions. That's enough
 * for tools/list + tools/call, which are the two verbs that matter.
 *
 * Payment: MCP callers don't carry wallets today, so this route bypasses
 * x402 and executes tools directly. The demo is subsidized by Kēryx and the
 * ledger tags calls as mode="demo" (see settlementMode on LedgerEntry). When
 * MCP grows a wallet primitive, this route will start routing through
 * /api/call with a signed X-PAYMENT header instead.
 */

import { NextResponse, type NextRequest } from "next/server";
import { listTools, getTool } from "@/lib/registry/store";
import { executeTool } from "@/lib/registry/handlers";
import { quoteCall } from "@/lib/x402-price";
import { recordEntry } from "@/lib/ledger";
import type { ToolDefinition } from "@/lib/registry/seed";

export const runtime = "nodejs";

const PROTOCOL_VERSION = "2025-03-26";
const SERVER_NAME = "keryx";
const SERVER_VERSION = "0.1.0";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcResponse =
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      result: unknown;
    }
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      error: { code: number; message: string; data?: unknown };
    };

const ERROR_PARSE = -32700;
const ERROR_INVALID_REQUEST = -32600;
const ERROR_METHOD_NOT_FOUND = -32601;
const ERROR_INVALID_PARAMS = -32602;
const ERROR_INTERNAL = -32603;

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({
      jsonrpc: "2.0",
      id: null,
      error: { code: ERROR_PARSE, message: "invalid JSON" },
    });
  }

  if (
    !raw ||
    typeof raw !== "object" ||
    (raw as { jsonrpc?: unknown }).jsonrpc !== "2.0" ||
    typeof (raw as { method?: unknown }).method !== "string"
  ) {
    return json({
      jsonrpc: "2.0",
      id: null,
      error: { code: ERROR_INVALID_REQUEST, message: "invalid JSON-RPC request" },
    });
  }

  const msg = raw as JsonRpcRequest;

  // Notifications (no `id`) get a 204. `notifications/initialized` is the one
  // we actually see; we don't need to do anything with it beyond not erroring.
  if (msg.id === undefined) {
    return new Response(null, { status: 204 });
  }

  try {
    const result = await dispatch(msg, req);
    return json({ jsonrpc: "2.0", id: msg.id, result });
  } catch (err) {
    if (err instanceof RpcError) {
      return json({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: err.code, message: err.message, data: err.data },
      });
    }
    return json({
      jsonrpc: "2.0",
      id: msg.id,
      error: {
        code: ERROR_INTERNAL,
        message: err instanceof Error ? err.message : "internal error",
      },
    });
  }
}

/** GET returns a short human-readable pointer at the endpoint. */
export function GET() {
  return NextResponse.json({
    name: SERVER_NAME,
    protocolVersion: PROTOCOL_VERSION,
    transport: "streamable-http",
    docs: "https://keryxhq.xyz/docs#mcp",
    message:
      "Kēryx MCP endpoint. POST JSON-RPC 2.0 messages here. See /docs for the config snippet Claude Code and Cursor expect.",
  });
}

class RpcError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

async function dispatch(msg: JsonRpcRequest, req: NextRequest): Promise<unknown> {
  switch (msg.method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions:
          "Kēryx exposes a registry of paid tools for AI agents. Every tool in tools/list can be called via tools/call. Payment is sponsored in demo mode; the /live ledger records each call.",
      };

    case "tools/list": {
      const tools = await listTools();
      return { tools: tools.map(toMcpTool) };
    }

    case "tools/call": {
      const params = (msg.params ?? {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      if (typeof params.name !== "string") {
        throw new RpcError(ERROR_INVALID_PARAMS, "params.name is required");
      }
      const tool = await getTool(params.name);
      if (!tool) {
        throw new RpcError(ERROR_INVALID_PARAMS, `unknown tool: ${params.name}`);
      }
      return callTool(tool, params.arguments ?? {}, req);
    }

    default:
      throw new RpcError(
        ERROR_METHOD_NOT_FOUND,
        `method not supported: ${msg.method}`,
      );
  }
}

function toMcpTool(tool: ToolDefinition) {
  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];
  for (const [name, spec] of Object.entries(tool.args)) {
    properties[name] = { type: spec.type, description: spec.description };
    if (spec.required) required.push(name);
  }
  return {
    name: tool.id,
    description: `${tool.summary} (paid tool from ${tool.publisherName}, $${tool.priceUsd.toFixed(4)} per call, sponsored in demo mode)`,
    inputSchema: {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false,
    },
  };
}

async function callTool(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  req: NextRequest,
) {
  const callerId =
    req.headers.get("mcp-client-name") ??
    req.headers.get("user-agent")?.split("/")[0] ??
    "mcp-client";

  let output: unknown;
  try {
    output = await executeTool(tool, args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "handler_failed";
    return {
      isError: true,
      content: [{ type: "text", text: `Tool "${tool.id}" failed: ${msg}` }],
    };
  }

  const quote = quoteCall(tool.priceUsd);
  await recordEntry({
    toolId: tool.id,
    toolName: tool.name,
    publisherName: tool.publisherName,
    publisherWallet: tool.publisherWallet,
    callerId,
    priceUsd: quote.priceUsd,
    platformFeeUsd: quote.platformFeeUsd,
    netToPublisherUsd: quote.netToPublisherUsd,
    status: "paid",
    settlementMode: "demo",
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(output, null, 2),
      },
    ],
  };
}

function json(payload: JsonRpcResponse): Response {
  return NextResponse.json(payload);
}
