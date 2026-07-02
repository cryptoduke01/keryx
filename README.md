# Kēryx

**The toll booth for the agent economy.**

Kēryx is a paid-tool registry for AI agents. Any developer publishes a tool. Any agent pays to use it. Settlement runs in USDC on [Arc](https://www.arc.network/), Circle's stablecoin-native L1, so a single call can cost fractions of a cent and clear in under half a second. No subscriptions, no API keys, no human in the loop.

Built for the Lepton Agents Hackathon (Canteen × Circle × Arc).

- **Live:** [keryx-ashy.vercel.app](https://keryx-ashy.vercel.app)
- **Docs:** [/docs](https://keryx-ashy.vercel.app/docs)
- **Ledger:** [/live](https://keryx-ashy.vercel.app/live)

## Why

Agents are becoming the primary consumers of software, not just people using software through a chat window. But the tools an agent might want to call, live signals, scraped data, search, compute, are still gated behind human-shaped friction: sign up, generate an API key, add a card, wait for a webhook. None of that works when the caller is a stateless agent that wants to make one call and pay for exactly that one call.

Kēryx removes the account. A publisher lists a tool with a price. An agent calls the tool with USDC already in hand. Payment and execution happen in the same round trip. That's the whole product.

## How it works

1. **Publish.** A developer registers an HTTP endpoint with an id, a price in USD, and a wallet address. Kēryx lists it in the public registry.
2. **Discover.** Any agent hits `GET /api/tools` to see every available tool, its price, its argument schema, and a sample call, no docs page required.
3. **Call and pay.** The agent calls `POST /api/call` with the tool id and its arguments. Kēryx quotes the price, executes the tool, splits the payment (95% to the publisher, 5% platform fee), and returns the result plus a ledger entry in one response.

Every call, successful or failed, is written to a public ledger visible at [/live](https://keryx-ashy.vercel.app/live), so the flow of money between agents and publishers is auditable in real time.

## Architecture

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind v4, Turbopack
- **Settlement chain:** [Arc testnet](https://testnet.arcscan.app) (chain id `5042002`), USDC-native gas, ERC-20 USDC at `0x3600…0000`
- **Payment rail:** [x402](https://github.com/coinbase/x402) request-level micropayments, batched through Circle Gateway
- **Persistence:** [Upstash Redis](https://upstash.com) when configured, falls back to in-memory storage for local/demo use (see `src/lib/registry/store.ts` and `src/lib/ledger.ts`)
- **Playground agent:** [Vercel AI SDK](https://sdk.vercel.ai) + OpenAI function-calling, so `/ask` can call registry tools live and show its work
- **Wallet:** wagmi + viem, WalletConnect optional

```
src/
  app/
    api/
      call/                 POST — the paid tool call
      tools/                GET  — list every published tool
      tools/[id]/           GET  — fetch one tool's schema
      publishers/tools/     POST — register a new tool
      ledger/               GET  — recent ledger entries + stats
      ask/                  POST — the playground agent (function-calling over the registry)
    ask/                     /ask   — chat playground, pays real tools to answer
    docs/                    /docs  — integration docs for agents and publishers
    live/                    /live  — public settlement ledger
    publish/                 /publish — publisher-facing tool submission form
    registry/                /registry — browse published tools
  components/                Header, theme toggle, wordmark, motion primitives
  lib/
    chains.ts                Arc chain definition, USDC constants, fee split
    x402-price.ts            quote math (price → platform fee → publisher net)
    ledger.ts                ledger read/write, Redis-or-memory
    registry/                tool store, seed data, tool execution handlers
```

## Try it

**As an agent, call a tool directly:**

```bash
curl -X POST https://keryx-ashy.vercel.app/api/call \
  -H "content-type: application/json" \
  -H "x-keryx-agent: my-agent" \
  -d '{
    "toolId": "solana.whales",
    "args": { "token": "BONK", "limit": 5 }
  }'
```

**Discover what's available first:**

```bash
curl https://keryx-ashy.vercel.app/api/tools
```

**As a publisher, list your own endpoint:**

```bash
curl -X POST https://keryx-ashy.vercel.app/api/publishers/tools \
  -H "content-type: application/json" \
  -d '{
    "id": "search.web",
    "name": "Grounded Web Search",
    "summary": "Web search that returns clean snippets and source URLs.",
    "category": "search",
    "priceUsd": 0.004,
    "publisherWallet": "0xYourArcWallet",
    "publisherName": "Your handle"
  }'
```

Full request/response shapes, argument schemas, and the coding-agent SDK snippet are on the [docs page](https://keryx-ashy.vercel.app/docs).

## Seeded tools

The registry ships with five verified tools to demo against, no publisher setup required:

| id | summary | price |
|---|---|---|
| `solana.whales` | Top Solana wallets trading a token in the last 24h | $0.005 |
| `solana.launches` | Recently launched Solana tokens above a volume threshold | $0.003 |
| `solana.rug-check` | Heuristic risk score for a Solana token mint | $0.002 |
| `search.web` | Web search with clean snippets and source URLs | $0.004 |
| `scrape.tweet-trends` | Trending topics or a user's recent posts on X | $0.006 |

## Running locally

```bash
git clone https://github.com/cryptoduke01/keryx.git
cd keryx
pnpm install
cp .env.example .env.local   # fill in what you need, everything has a sane fallback
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Without any env vars set, the registry and ledger run entirely in memory and the `/ask` playground works if you supply `OPENAI_API_KEY`. See `.env.example` for what each variable unlocks (Redis persistence, WalletConnect, Circle Gateway settlement).

```bash
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
```

## Status

This is a hackathon build, but the x402 protocol path is real. `POST /api/call` returns a genuine `402 Payment Required` with a machine-readable `accepts` array when the `X-PAYMENT` header is missing, and executes only after a signed payload verifies. Which facilitator runs the verify + settle is picked by env:

- **`gateway`** — set `CIRCLE_GATEWAY_API_URL` (defaults to Circle's testnet endpoint) and Kēryx routes verify/settle through Circle Gateway. Real onchain USDC on Arc, batched.
- **`demo`** — the default when no facilitator is configured. Accepts well-formed `X-PAYMENT` payloads, records a synthetic tx hash, and labels the ledger entry `demo` so `/live` never misrepresents onchain state.

Publisher wallet signature verification (EIP-191) is not yet enforced, so treat community-submitted tools as unverified until that ships. The full protocol design and the settlement roadmap live in the [whitepaper](https://keryx-ashy.vercel.app/whitepaper).

## License

MIT
