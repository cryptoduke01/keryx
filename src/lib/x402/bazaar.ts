/**
 * Bazaar discovery extension (x402 v2).
 * Spec: https://github.com/x402-foundation/x402/blob/main/specs/extensions/bazaar.md
 *
 * Attached on the **402 response root** as `extensions.bazaar` (not inside accepts[]).
 * Facilitators / CDP Bazaar index this after settle when paymentPayload.resource is set.
 */

import type { ToolDefinition } from "@/lib/registry/seed";

/** JSON Schema Draft 2020-12 fragment validating `info`. */
const BAZAAR_INFO_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["input"],
  properties: {
    input: {
      type: "object",
      required: ["type", "method", "bodyType", "body"],
      additionalProperties: false,
      properties: {
        type: { type: "string", const: "http" },
        method: { type: "string", enum: ["POST", "PUT", "PATCH"] },
        bodyType: { type: "string", enum: ["json", "form-data", "multipart"] },
        body: { type: "object" },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
        },
      },
    },
    output: {
      type: "object",
      required: ["type"],
      properties: {
        type: { type: "string" },
        example: { type: "object" },
      },
    },
  },
} as const;

export interface BazaarExtension {
  info: {
    input: {
      type: "http";
      method: "POST";
      bodyType: "json";
      body: { toolId: string; args: Record<string, unknown> };
    };
    output: {
      type: "json";
      example: Record<string, unknown>;
    };
  };
  schema: typeof BAZAAR_INFO_SCHEMA;
}

export function bazaarExtensionForTool(tool: ToolDefinition): BazaarExtension {
  return {
    info: {
      input: {
        type: "http",
        method: "POST",
        bodyType: "json",
        body: {
          toolId: tool.id,
          args: tool.sampleArgs ?? {},
        },
      },
      output: {
        type: "json",
        example: {
          ok: true,
          tool: {
            id: tool.id,
            name: tool.name,
            publisherName: tool.publisherName,
          },
          quote: {
            priceUsd: tool.priceUsd,
          },
          result: {
            _note: `Probe free sample: GET /api/demo?toolId=${tool.id}`,
          },
          settlement: {
            mode: "local|gateway|demo",
            txHash: "0x…",
            network: "eip155:5042002",
          },
        },
      },
    },
    schema: BAZAAR_INFO_SCHEMA,
  };
}
