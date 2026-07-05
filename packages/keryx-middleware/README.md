# @keryxhq/middleware

**Turn any HTTP handler into a paid tool for AI agents.** Speaks the [x402](https://www.x402.org) protocol. Settles USDC on Arc. One `npm install`, one wrapper, done.

```bash
pnpm add @keryxhq/middleware viem
```

## Next.js

```ts
// app/api/my-tool/route.ts
import { paidHandler } from "@keryxhq/middleware/next";

export const POST = paidHandler({
  price: 0.004,                                       // USD per call
  wallet: "0xYourArcWallet...",                       // where payment lands
  description: "Web search over indexed docs.",
  handler: async ({ query }: { query: string }) => {
    return { results: await mySearch(query) };
  },
});
```

That's it. First hit without a payment header returns HTTP 402 with machine-readable payment requirements. The agent signs an EIP-3009 USDC authorization and retries. Your `handler` runs only after the payment verifies.

## Express

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
    res.json({ results: mySearch(req.body.query) });
  },
);
```

## What it does

1. **No payment header** → returns HTTP 402 with a `PaymentRequirements` body: the exact USDC amount, asset address, your wallet, network, and expiry. Agents (and Claude Code, Cursor, GitHub Copilot via MCP) know how to read this.
2. **Payment header present** → three-tier verification:
   - **Structural**: amount, recipient, network, expiry.
   - **Cryptographic** (when `viem` is installed): recovers the EIP-3009 signer from the typed-data signature and compares to the authorization's `from` address.
   - **Settlement** (when `facilitatorUrl` is set): POSTs `{ payment, requirements }` to a facilitator that broadcasts the authorization onchain and returns a tx hash.
3. **Handler returns** → response body is `{ result, paid: { … } }` with the settlement mode and tx hash if available.

## Settlement modes

By default the SDK **verifies** the signature (structurally, and cryptographically when viem is installed) but does not broadcast the EIP-3009 authorization onchain. The publisher holds the signed authorization and can broadcast it later. To settle onchain automatically, point at a facilitator:

```ts
paidHandler({
  price: 0.004,
  wallet: "0x...",
  facilitatorUrl: "https://keryxhq.xyz/api/x402/facilitator", // when available
  handler: async (args) => { /* … */ },
});
```

Or set the env var: `KERYX_FACILITATOR_URL=https://…`.

You can also run your own facilitator: any endpoint that accepts `POST { payment, requirements }` and returns `{ txHash }` will work.

## Networks

| Network        | id            | USDC address                                 |
| -------------- | ------------- | -------------------------------------------- |
| `arc-testnet`  | `eip155:5042002` | `0x3600000000000000000000000000000000000000` |
| `arc-mainnet`  | `eip155:5042001` | `0x3600000000000000000000000000000000000000` |
| `base-sepolia` | `eip155:84532`   | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `base`         | `eip155:8453`    | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

Default: `arc-testnet`. Override with `network: "base-sepolia"` etc.

## Register your tool with Kēryx

Publishing to the Kēryx registry makes your tool discoverable by agents in Claude, Cursor, and any MCP client:

1. Deploy your endpoint (wrapped with `paidHandler`) at a public HTTPS URL.
2. Visit [keryxhq.xyz/publish](https://keryxhq.xyz/publish), connect your Arc wallet, and paste the URL as your handler URL.
3. Sign the publish message with your wallet. Your tool is live.

You keep 95% of every paid call. Kēryx takes 5% for discovery + payment routing.

## Primitives

If you're not using Next.js or Express, use the framework-agnostic primitives:

```ts
import {
  buildRequirements,
  decodePaymentHeader,
  verifyPayment,
  buildX402Body,
} from "@keryxhq/middleware";
```

## Why

Every API on the internet was built assuming a human logs in, gets a key, attaches a card. That flow doesn't work for an agent making one autonomous call. `@keryxhq/middleware` lets your existing HTTP handler accept payment inline, one call at a time, in a way agents already know how to speak.

## License

MIT. Copyright © Kēryx.
