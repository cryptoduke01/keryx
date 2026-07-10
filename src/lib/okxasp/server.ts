/**
 * Shared OKX payment stack for the Finance Copilot ASP.
 * Emits both Agent Payments Protocol challenges on unpaid calls:
 *   - x402 `exact` → PAYMENT-REQUIRED
 *   - MPP `charge` → WWW-Authenticate: Payment
 * Arc facilitator is never imported here.
 */

import { createHash } from "crypto";
import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import {
  x402HTTPResourceServer,
  x402ResourceServer,
} from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import type { PaymentRequirements } from "@okxweb3/x402-core/types";
import { Mppx } from "@okxweb3/mpp";
import { charge as mppCharge } from "@okxweb3/mpp/evm/server";
import { SaApiClient } from "@okxweb3/mpp/evm";
import {
  MppAdapter,
  X402Adapter,
  paymentRouter,
} from "@okxweb3/payment-router";
import {
  OKX_ASP_TOOL_IDS,
  getOkxAspTool,
  okxCredentialsReady,
  okxNetwork,
  okxPayTo,
  priceUsdToOkxPrice,
  slugForToolId,
} from "@/lib/okxasp/config";

/**
 * USDT0 on X Layer mainnet (6 decimals).
 * EIP-55 checksum matches OKX docs / xlayer-tokenlist.
 */
export const OKX_USDT0 =
  "0x779Ded0c9e1022225f8E0630b35a9b54bE713736" as const;

/**
 * Match OKX's own 402 `extra` shape (see web3.okx.com dex market APIs):
 * `{ version, symbol, name, transferMethod: "eip3009" }`.
 * Missing `symbol` / `transferMethod` makes `onchainos x402-check` report
 * `tokenSymbol: "UNKNOWN"` and marketplace listing QA can reject as
 * "x402 standard validation" failed.
 */
class OkxExactEvmScheme extends ExactEvmScheme {
  override enhancePaymentRequirements(
    paymentRequirements: PaymentRequirements,
    supportedKind: {
      x402Version: number;
      scheme: string;
      network: `${string}:${string}`;
      extra?: Record<string, unknown>;
    },
    extensionKeys: string[],
  ): Promise<PaymentRequirements> {
    return super
      .enhancePaymentRequirements(paymentRequirements, supportedKind, extensionKeys)
      .then((req) => ({
        ...req,
        asset: OKX_USDT0,
        extra: {
          ...(req.extra ?? {}),
          version: "1",
          symbol: "USD₮0",
          name: "USD₮0",
          transferMethod: "eip3009",
          decimals: 6,
        },
      }));
  }
}

type ProtectFn = (
  inner: (req: Request) => Promise<Response> | Response,
) => (req: Request) => Promise<Response> | Response;

let cachedResourceServer: x402ResourceServer | null = null;
let cachedProtect: ProtectFn | null = null;

function mppSecretKey(): string {
  const explicit =
    process.env.MPP_SECRET_KEY?.trim() || process.env.MPPX_SECRET_KEY?.trim();
  if (explicit) return explicit;
  const seed = process.env.OKX_SECRET_KEY?.trim();
  if (!seed) throw new Error("okx_credentials_missing");
  // Stable 32-byte hex so charge challenges work without a separate env var.
  return createHash("sha256").update(`keryx-mpp:${seed}`).digest("hex");
}

export function priceUsdToMinimalUnits(priceUsd: number): string {
  return String(Math.round(priceUsd * 1_000_000));
}

export function getOkxResourceServer(): x402ResourceServer {
  if (cachedResourceServer) return cachedResourceServer;
  if (!okxCredentialsReady()) {
    throw new Error("okx_credentials_missing");
  }

  const facilitatorClient = new OKXFacilitatorClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    passphrase: process.env.OKX_PASSPHRASE!,
    syncSettle: true,
  });

  const network = okxNetwork() as `${string}:${string}`;
  cachedResourceServer = new x402ResourceServer(facilitatorClient).register(
    network,
    new OkxExactEvmScheme(),
  );
  return cachedResourceServer;
}

/**
 * Unified protect() that declares both `exact` and `charge` on every ASP tool
 * route — required by OKX Agent Payments Protocol for HTTP sellers.
 */
export function getOkxPaymentProtect(): ProtectFn {
  if (cachedProtect) return cachedProtect;
  if (!okxCredentialsReady()) {
    throw new Error("okx_credentials_missing");
  }

  const payTo = okxPayTo()!;
  const network = okxNetwork() as `${string}:${string}`;
  const chainId = network.includes("1952") ? 1952 : 196;

  const saClient = new SaApiClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    passphrase: process.env.OKX_PASSPHRASE!,
  });

  const mppx = Mppx.create({
    methods: [mppCharge({ saClient })],
    realm: "keryxhq.xyz",
    secretKey: mppSecretKey(),
  });

  const resourceServer = getOkxResourceServer();
  const routes: Record<
    string,
    {
      description: string;
      adapterConfigs: {
        mpp: Record<string, unknown>;
        x402: Record<string, unknown>;
      };
    }
  > = {};

  for (const toolId of OKX_ASP_TOOL_IDS) {
    const tool = getOkxAspTool(toolId);
    const slug = slugForToolId(toolId);
    if (!tool || !slug) continue;

    const path = `/api/okxasp/tools/${slug}`;
    const amount = priceUsdToMinimalUnits(tool.priceUsd);
    const route = {
      description: tool.summary,
      adapterConfigs: {
        mpp: {
          intent: "charge",
          amount,
          currency: OKX_USDT0,
          recipient: payTo,
          methodDetails: { chainId, feePayer: true },
        },
        x402: {
          scheme: "exact",
          network,
          payTo,
          price: priceUsdToOkxPrice(tool.priceUsd),
          maxTimeoutSeconds: 300,
          extra: {
            version: "1",
            symbol: "USD₮0",
            name: "USD₮0",
            transferMethod: "eip3009",
            decimals: 6,
          },
          description: tool.summary,
          mimeType: "application/json",
        },
      },
    };
    // Any method on this path (GET + POST from Next route handlers).
    routes[path] = route;
  }

  const protect = paymentRouter({
    adapters: [
      new MppAdapter({ mppx }),
      new X402Adapter({
        resourceServer,
        httpResourceServerCtor: x402HTTPResourceServer,
      }),
    ],
    routes,
    onError: (err, protocol) => {
      console.error(`[okxasp] ${protocol} challenge failed`, err);
    },
  });
  cachedProtect = protect;
  return protect;
}
