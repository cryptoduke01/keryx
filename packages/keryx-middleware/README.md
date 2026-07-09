# @keryxhq/middleware

> Turn any HTTP endpoint into a paid tool for AI agents. Speaks [x402](https://www.x402.org), verifies EIP-3009 USDC authorizations, settles on **Arc** (Circle's stablecoin-native L1). One wrapper. One npm install.

[![npm](https://img.shields.io/npm/v/@keryxhq/middleware.svg?color=cb3837)](https://www.npmjs.com/package/@keryxhq/middleware)
[![license: MIT](https://img.shields.io/badge/license-MIT-black.svg)](./LICENSE)
[![Keryx](https://img.shields.io/badge/Keryx-keryxhq.xyz-000)](https://keryxhq.xyz)

---

## Why this exists

Every API on the internet was built assuming a human is present: sign up, get a key, attach a card, wait for approval. When an agent needs to answer one question with fresh data, none of that flow works. It can't fill out forms, doesn't have a card, doesn't want a $50/mo subscription for one call.

**`@keryxhq/middleware` lets your existing HTTP handler accept per-call payment inline**, one call at a time, in a way agents already know how to speak. First hit returns HTTP 402 with a machine-readable price tag. Agent signs an EIP-3009 USDC authorization, retries. Your handler runs only after payment verifies. You keep 95% of every call.

---

## Install

```bash
pnpm add @keryxhq/middleware viem
# or npm install @keryxhq/middleware viem
# or yarn add @keryxhq/middleware viem
```

Node 18+. `viem` is a peer dependency — required only for cryptographic signature verification. The SDK works without it (structural verification only).

---

## Next.js (App Router)

```ts
// app/api/my-tool/route.ts
import { paidHandler } from "@keryxhq/middleware/next";

export const POST = paidHandler({
  price: 0.004,                                // USD per call
  wallet: "0xYourArcWallet...",                // where payment lands
  description: "Web search over indexed docs.",
  handler: async ({ query }: { query: string }) => {
    return { results: await mySearch(query) };
  },
});
```

That's the whole integration. The response body is `{ result, paid }` where `paid` is a receipt object:

```json
{
  "result": { "results": [/* … */] },
  "paid": {
    "settlementMode": "verified",
    "from": "0xAgentWallet…",
    "amount": "4000"
  }
}
```

---

## Express (and Fastify, Hono, connect-style)

```ts
import express from "express";
import { paidExpress } from "@keryxhq/middleware/express";

const app = express();
app.use(express.json());

app.post(
  "/api/my-tool",
  paidExpress({
    price: 0.004,
    wallet: "0xYourArcWallet...",
    description: "Web search over indexed docs.",
  }),
  (req, res) => {
    // req.keryxPayment holds the verified receipt
    res.json({ results: mySearch(req.body.query) });
  },
);
```

---

## Framework-agnostic primitives

If you're on Cloudflare Workers, Deno, bare Node `http.Server`, or anywhere else — build your own wrapper from the primitives:

```ts
import {
  buildRequirements,
  buildX402Body,
  decodePaymentHeader,
  verifyPayment,
  handlePaymentCheck,
} from "@keryxhq/middleware";

// Everything above is available with typed signatures.
```

The single `handlePaymentCheck({ config, resource, paymentHeader })` primitive is what both the Next and Express wrappers use internally. Give it your request URL and the `x-payment` header value; it returns either a 402 body to send back, or a verified receipt to hand to your handler.

---

## What actually happens on each call

`@keryxhq/middleware` runs **three verification tiers**, in order. Any tier failing throws with a machine-readable error string.

**1. Structural (always on, no I/O).** Amount ≥ requirement, recipient matches your wallet, network matches, authorization not expired.

**2. Cryptographic (auto-enabled when `viem` is installed).** Recovers the EIP-3009 typed-data signer using the USDC contract's EIP-712 domain per network, compares to the authorization's `from` field. Skips silently if `viem` is not installed — publishers who want strong verification install it.

**3. Settlement (opt-in).** Set `facilitatorUrl` on the config (or the `KERYX_FACILITATOR_URL` env var) and the SDK POSTs `{ payment, requirements }` to that URL. The facilitator broadcasts the EIP-3009 authorization onchain and returns `{ txHash }`. The receipt then carries `settlementMode: "settled"` and the tx hash. Without a facilitator, the receipt is `settlementMode: "verified"` — the publisher holds the signed authorization and can broadcast it later.

Run your own facilitator: any endpoint that accepts `POST { payment, requirements }` and returns `{ txHash }` will work. See the Keryx repo for a reference implementation on Arc testnet.

---

## Networks

| Network         | CAIP-2             | Chain id  | USDC address                                 |
| --------------- | ------------------ | --------- | -------------------------------------------- |
| `arc-testnet` (default) | `eip155:5042002`   | `5042002` | `0x3600000000000000000000000000000000000000` |
| `arc-mainnet`   | `eip155:5042001`   | `5042001` | `0x3600000000000000000000000000000000000000` |

Arc is a stablecoin-native L1 built by Circle where **USDC is the native gas token** (asset address `0x3600…0000`). This is the only price band where sub-cent per-call payments are economically viable — settlement on any other L1 would cost more in gas than the call itself.

Override with `network: "arc-mainnet"` when you're ready.

---

## Publishing your tool to the Keryx registry

Wrapping your endpoint is step 1. Step 2 is making it discoverable to every agent on Claude, Cursor, and GitHub Copilot:

1. Deploy your wrapped handler at a public HTTPS URL.
2. Visit **[keryxhq.xyz/publish](https://keryxhq.xyz/publish)**, connect your Arc wallet (must match the `wallet` field in the SDK config), and paste your handler URL.
3. Sign the publish message with your wallet. Your tool is live in the registry immediately.
4. Every MCP-enabled agent (Cursor, Claude Code, GitHub Copilot, custom) can now discover and call your tool by capability. You keep **95%** of every paid call. Keryx takes 5%.

---

## Configuration reference

```ts
paidHandler({
  // required
  price: 0.004,                        // USD per call. Fractions allowed.
  wallet: "0x...",                     // Arc wallet that receives payments.
  handler: async (args, ctx) => { … }, // Your business logic.

  // optional
  network: "arc-testnet",              // Default. Also: "arc-mainnet".
  description: "…",                    // Shown in the 402 body + docs.
  facilitatorUrl: "https://…",         // Or set KERYX_FACILITATOR_URL env.
  maxTimeoutSeconds: 60,               // Authorization validity window.
});
```

The `ctx` passed to your handler:

```ts
interface PaidRequestContext {
  payment: DecodedPayment;         // The decoded X-PAYMENT header.
  requirements: PaymentRequirements;
  receipt: PaymentReceipt;         // { settlementMode, txHash?, from, amount }
}
```

Full types are exported from the main entrypoint:

```ts
import type {
  Network,
  PaidToolConfig,
  PaidRequestContext,
  PaymentRequirements,
  PaymentReceipt,
  DecodedPayment,
  X402Response,
} from "@keryxhq/middleware";
```

---

## Error handling

`verifyPayment()` throws with these error strings — surface them to callers so agents can retry with a corrected payment:

| Error                             | Meaning                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `payment_missing_authorization`   | The X-PAYMENT header decoded but has no authorization payload. |
| `payment_network_mismatch`        | The payment's network doesn't match your `network`.            |
| `payment_wrong_recipient`         | The `to` address is not your `wallet`.                         |
| `payment_underpaid`               | The authorized `value` is less than the required amount.       |
| `payment_expired`                 | The authorization's `validBefore` is in the past.              |
| `payment_signature_invalid`       | Cryptographic recovery failed or recovered address ≠ `from`.   |
| `payment_decode_failed`           | The X-PAYMENT header wasn't valid base64 JSON.                 |
| `facilitator_rejected`            | The facilitator returned a non-2xx response.                   |

The Next.js and Express wrappers automatically convert these into HTTP 402 responses with the reason in the `error` field of the body, so agents can read and retry.

---

## Frequently asked

**Do I need to run a facilitator?**
No. Default mode verifies the signature but doesn't broadcast. You hold the signed EIP-3009 authorization and can broadcast it whenever you want, or delegate to any facilitator later.

**Does this work outside Next.js and Express?**
Yes. Use the framework-agnostic primitives (`handlePaymentCheck` is the main one) and wire it into whatever framework you're on. See [Framework-agnostic primitives](#framework-agnostic-primitives) above.

**What's the difference between MCP and direct API calls?**
MCP is how Claude, Cursor, and Copilot **discover** your tool. Direct API is how any HTTP client calls it. Both surfaces read the same tool listing. The SDK you install here handles the direct API side with real x402. Keryx runs the MCP endpoint separately at `keryxhq.xyz/api/mcp`.

**Is Keryx custody?**
No. The SDK verifies and (optionally) settles directly to your wallet. Keryx never holds a balance for you. The 5% platform fee splits at settlement time via the same EIP-3009 authorization.

---

## Links

- **Keryx** — [keryxhq.xyz](https://keryxhq.xyz)
- **Live SDK page** — [keryxhq.xyz/sdk](https://keryxhq.xyz/sdk)
- **Registry** (browse tools) — [keryxhq.xyz/registry](https://keryxhq.xyz/registry)
- **Publish your tool** — [keryxhq.xyz/publish](https://keryxhq.xyz/publish)
- **Whitepaper** — [keryxhq.xyz/whitepaper](https://keryxhq.xyz/whitepaper)
- **npm** — [npmjs.com/package/@keryxhq/middleware](https://www.npmjs.com/package/@keryxhq/middleware)
- **Source** — [github.com/cryptoduke01/keryx](https://github.com/cryptoduke01/keryx/tree/main/packages/keryx-middleware)
- **Issues** — [github.com/cryptoduke01/keryx/issues](https://github.com/cryptoduke01/keryx/issues)
- **x402 protocol** — [x402.org](https://www.x402.org)
- **Arc network** — [arc.network](https://www.arc.network)

---

## License

MIT © Keryx
