/**
 * Agent-facing discovery helpers for Arc / Lepton Keryx.
 * Powers /.well-known/x402 and /llms.txt from the live registry.
 * Does not touch OKX ASP settlement paths.
 */

import { ARC_USDC_ADDRESS, KERYX_TREASURY_ADDRESS } from "@/lib/chains";
import { ARC_TESTNET_NETWORK } from "@/lib/x402/requirements";
import { listTools } from "@/lib/registry/store";
import type { ToolDefinition } from "@/lib/registry/seed";

export const KERYX_ORIGIN = "https://keryxhq.xyz";

function priceLabel(priceUsd: number): string {
  const fixed = priceUsd.toFixed(6).replace(/\.?0+$/, "");
  return `$${fixed || "0"}`;
}

function resourceUrl(toolId: string): string {
  return `${KERYX_ORIGIN}/api/call#${toolId}`;
}

function exampleUnpaidCurl(tool: ToolDefinition): string {
  const args = JSON.stringify(tool.sampleArgs ?? {});
  return `curl -i -X POST ${KERYX_ORIGIN}/api/call -H "content-type: application/json" -H "x-keryx-agent: my-agent" -d '{"toolId":"${tool.id}","args":${args}}'`;
}

export async function buildX402Manifest(origin = KERYX_ORIGIN) {
  const tools = await listTools();
  const paid_routes = tools.map((tool) => ({
    route_key: `POST /api/call#${tool.id}`,
    method: "POST" as const,
    path: "/api/call",
    toolId: tool.id,
    resource_path: `/api/call#${tool.id}`,
    resource_url: resourceUrl(tool.id).replace(KERYX_ORIGIN, origin),
    price: priceLabel(tool.priceUsd),
    priceUsd: tool.priceUsd,
    description: tool.summary,
    service_name: tool.name,
    category: tool.category,
    verified: tool.verified,
    tags: ["keryx", "arc", "x402", tool.category, tool.id],
    sampleArgs: tool.sampleArgs,
    example_unpaid_curl: exampleUnpaidCurl(tool).replaceAll(
      KERYX_ORIGIN,
      origin,
    ),
  }));

  const freeResources = [
    `${origin}/`,
    `${origin}/docs`,
    `${origin}/ask`,
    `${origin}/try`,
    `${origin}/registry`,
    `${origin}/live`,
    `${origin}/for-judges`,
    `${origin}/publish`,
    `${origin}/api/tools`,
    `${origin}/api/mcp`,
    `${origin}/keryx-openapi.json`,
    `${origin}/.well-known/x402`,
    `${origin}/llms.txt`,
  ];

  return {
    version: 1,
    name: "Keryx",
    description:
      "Paid tool registry for AI agents. Discover tools, pay per call in USDC on Arc via x402, get results in one round trip.",
    homepage: origin,
    network: ARC_TESTNET_NETWORK,
    chain: "arc-testnet",
    asset: "USDC",
    assetAddress: ARC_USDC_ADDRESS,
    callEndpoint: `${origin}/api/call`,
    discovery: `${origin}/api/tools`,
    mcp: `${origin}/api/mcp`,
    openapi: `${origin}/keryx-openapi.json`,
    llms: `${origin}/llms.txt`,
    ledger: `${origin}/live`,
    ownershipProofs: [KERYX_TREASURY_ADDRESS],
    resources: tools.map((t) => resourceUrl(t.id).replace(KERYX_ORIGIN, origin)),
    freeResources,
    paid_routes,
    how_to_pay: [
      "POST /api/call with toolId + args and no payment header → HTTP 402",
      "Sign EIP-3009 USDC transferWithAuthorization for accepts[0]",
      "Retry the same POST with X-PAYMENT (base64 payment payload)",
      "Receive tool result + settlement metadata on HTTP 200",
    ],
  };
}

export async function buildLlmsTxt(origin = KERYX_ORIGIN): Promise<string> {
  const tools = await listTools();
  const lines: string[] = [
    "# Keryx",
    "",
    `> The paid tool registry for AI agents at ${origin}`,
    "> Discover tools, pay per call in USDC on Arc (eip155:5042002) via x402. No API keys. No accounts.",
    "",
    "## Free endpoints (no payment required)",
    "",
    `- [${origin}/api/tools](${origin}/api/tools) — full registry (id, price, args schema, sampleArgs)`,
    `- [${origin}/.well-known/x402](${origin}/.well-known/x402) — machine-readable x402 discovery manifest`,
    `- [${origin}/llms.txt](${origin}/llms.txt) — this file`,
    `- [${origin}/keryx-openapi.json](${origin}/keryx-openapi.json) — OpenAPI 3.1`,
    `- [${origin}/api/mcp](${origin}/api/mcp) — MCP JSON-RPC (Claude Code, Cursor, Copilot)`,
    `- [${origin}/docs](${origin}/docs) — human + agent integration docs`,
    `- [${origin}/ask](${origin}/ask) — cost-aware agent playground`,
    `- [${origin}/try](${origin}/try) — minute-by-minute testing guide`,
    `- [${origin}/registry](${origin}/registry) — browse tools in the UI`,
    `- [${origin}/live](${origin}/live) — public settlement ledger`,
    `- [${origin}/for-judges](${origin}/for-judges) — Lepton judge one-pager`,
    `- [${origin}/publish](${origin}/publish) — list a tool (Arc wallet)`,
    "",
    "## Paid endpoint (x402 / USDC on Arc)",
    "",
    `All paid execution goes through **POST ${origin}/api/call**.`,
    "Body: `{ \"toolId\": \"<id>\", \"args\": { ... } }`.",
    "First call without `X-PAYMENT` → HTTP 402 with `accepts[]`.",
    "Retry with signed `X-PAYMENT` → HTTP 200 + result + settlement.",
    "",
    `Network: \`${ARC_TESTNET_NETWORK}\` · Asset: USDC (\`${ARC_USDC_ADDRESS}\`) · Pay to: tool publisher wallet (see 402 \`payTo\`)`,
    "",
    "## Catalog",
    "",
  ];

  for (const tool of tools) {
    lines.push(
      `- \`${tool.id}\` — ${priceLabel(tool.priceUsd)}: ${tool.summary}`,
    );
  }

  const sample = tools.find((t) => t.id === "solana.token-activity") ?? tools[0];
  if (sample) {
    lines.push(
      "",
      "## Quick unpaid probe",
      "",
      "```bash",
      exampleUnpaidCurl(sample).replaceAll(KERYX_ORIGIN, origin),
      "# → HTTP 402 with accepts[0] (scheme exact, network eip155:5042002, USDC amount)",
      "```",
      "",
    );
  }

  lines.push(
    "## How to pay",
    "",
    "1. `GET /api/tools` — pick a toolId and args.",
    "2. `POST /api/call` without payment → read `accepts[0]`.",
    "3. Sign EIP-3009 `transferWithAuthorization` for that amount/asset/payTo/network.",
    "4. Retry `POST /api/call` with header `X-PAYMENT: <base64 payload>`.",
    "5. Read result + settlement; audit on `/live`.",
    "",
    "## MCP (subsidized today)",
    "",
    "```json",
    `{`,
    `  "mcpServers": {`,
    `    "keryx": {`,
    `      "type": "http",`,
    `      "url": "${origin}/api/mcp"`,
    `    }`,
    `  }`,
    `}`,
    "```",
    "",
    "MCP calls are currently demo/subsidized (clients lack wallet headers). Real Arc settlement uses `/api/call`.",
    "",
    "## Publish",
    "",
    `Human form: ${origin}/publish`,
    `API: POST ${origin}/api/publishers/tools (EIP-191 signed ownership).`,
    "",
  );

  return lines.join("\n");
}
