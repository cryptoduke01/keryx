/**
 * Shared OKX x402 resource server for the Finance Copilot ASP.
 * Lazy singleton — Arc facilitator is never imported here.
 */

import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { x402ResourceServer } from "@okxweb3/x402-next";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import type { PaymentRequirements } from "@okxweb3/x402-core/types";
import { okxCredentialsReady, okxNetwork } from "@/lib/okxasp/config";

/**
 * Exact scheme that keeps USDT0 `decimals` on the 402 challenge.
 * Marketplace / x402-check fail when the asset is outside their token list
 * and `extra.decimals` is missing. Stock ExactEvmScheme only writes name/version.
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
        extra: {
          ...(req.extra ?? {}),
          decimals: 6,
        },
      }));
  }
}

let cached: x402ResourceServer | null = null;

export function getOkxResourceServer(): x402ResourceServer {
  if (cached) return cached;
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
  cached = new x402ResourceServer(facilitatorClient).register(
    network,
    new OkxExactEvmScheme(),
  );
  return cached;
}
