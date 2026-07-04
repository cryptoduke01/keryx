/**
 * Next.js Route Handler wrapper.
 *
 *   // app/api/my-tool/route.ts
 *   import { paidHandler } from "@keryx/middleware/next";
 *
 *   export const POST = paidHandler({
 *     price: 0.004,
 *     wallet: "0xPublisherWallet…",
 *     description: "Web search over indexed sources.",
 *     handler: async ({ query }: { query: string }) => {
 *       return { results: [/* … *\/] };
 *     },
 *   });
 */

import { handlePaymentCheck, type PaidToolConfig, type PaidRequestContext } from "./index.js";

// Minimal Request/Response typing — we don't import from "next" so the SDK
// doesn't force a specific Next.js version on consumers.
type FetchRequest = {
  url: string;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
};

/**
 * Wrap a business-logic handler with x402 payment enforcement.
 * The returned function is a valid Next.js Route Handler for POST.
 */
export function paidHandler<TArgs = Record<string, unknown>, TResult = unknown>(
  config: PaidToolConfig<TArgs, TResult>,
) {
  return async function POST(req: FetchRequest): Promise<Response> {
    const paymentHeader = req.headers.get("x-payment");
    const resource = req.url;

    // The payment-check path only reads price/wallet/network/etc — the TArgs/TResult
    // generics are for the handler contract downstream. Cast is safe.
    const check = await handlePaymentCheck(
      config as unknown as PaidToolConfig,
      resource,
      paymentHeader,
    );
    if (check.kind === "402") {
      return new Response(JSON.stringify(check.body), {
        status: 402,
        headers: { "content-type": "application/json" },
      });
    }

    let args: TArgs;
    try {
      args = (await req.json()) as TArgs;
    } catch {
      args = {} as TArgs;
    }

    const ctx: PaidRequestContext = {
      payment: check.payment,
      requirements: check.requirements,
      receipt: check.receipt,
    };

    try {
      const result = await config.handler(args, ctx);
      return new Response(
        JSON.stringify({ result, paid: check.receipt }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-payment-response": check.receipt.txHash ?? "verified",
          },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "handler_failed",
          detail: err instanceof Error ? err.message : String(err),
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  };
}
