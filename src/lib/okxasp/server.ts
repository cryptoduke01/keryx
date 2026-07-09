/**
 * Shared OKX x402 resource server for the Finance Copilot ASP.
 * Lazy singleton — Arc facilitator is never imported here.
 */

import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { x402ResourceServer } from "@okxweb3/x402-next";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { okxCredentialsReady, okxNetwork } from "@/lib/okxasp/config";

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
    new ExactEvmScheme(),
  );
  return cached;
}
