/**
 * Express middleware wrapper.
 *
 *   import express from "express";
 *   import { paidExpress } from "@keryxhq/middleware/express";
 *
 *   const app = express();
 *   app.use(express.json());
 *
 *   app.post(
 *     "/api/my-tool",
 *     paidExpress({
 *       price: 0.004,
 *       wallet: "0xPublisherWallet…",
 *       description: "Web search over indexed sources.",
 *     }),
 *     (req, res) => {
 *       // req.keryxPayment is the receipt object.
 *       res.json({ results: [/* … *\/] });
 *     },
 *   );
 */

import { handlePaymentCheck, type PaidRequestContext, type PaidToolConfig } from "./index.js";

// Minimal typing so we don't import from "express" and force a version.
type ExpressReq = {
  headers: Record<string, string | string[] | undefined>;
  protocol: string;
  get(name: string): string | undefined;
  originalUrl: string;
  keryxPayment?: PaidRequestContext;
};
type ExpressRes = {
  status(code: number): ExpressRes;
  json(body: unknown): ExpressRes;
  setHeader(name: string, value: string): void;
};
type NextFn = (err?: unknown) => void;

/**
 * Returns an Express middleware that enforces payment before letting the
 * request reach the next handler. Attaches the payment receipt to
 * `req.keryxPayment` so the downstream handler can inspect it.
 *
 * Note: the config omits `handler` — Express uses the next middleware for
 * business logic. Everything else is the same as the framework-agnostic config.
 */
export function paidExpress(
  config: Omit<PaidToolConfig, "handler">,
) {
  return async function middleware(
    req: ExpressReq,
    res: ExpressRes,
    next: NextFn,
  ) {
    const headerRaw = req.headers["x-payment"];
    const paymentHeader = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw ?? null;

    const host = req.get("host") ?? "localhost";
    const resource = `${req.protocol}://${host}${req.originalUrl}`;

    const check = await handlePaymentCheck(
      config as PaidToolConfig,
      resource,
      paymentHeader ?? null,
    );

    if (check.kind === "402") {
      res.status(402).json(check.body);
      return;
    }

    req.keryxPayment = {
      payment: check.payment,
      requirements: check.requirements,
      receipt: check.receipt,
    };
    res.setHeader("x-payment-response", check.receipt.txHash ?? "verified");
    next();
  };
}
