<div align="center">

# Keryx

**The toll booth for the agent economy.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Arc](https://img.shields.io/badge/Arc-Circle_L1-00C4B4?style=flat)](https://www.arc.network/)
[![x402](https://img.shields.io/badge/x402-micropayments-orange?style=flat)](https://github.com/coinbase/x402)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live:** [keryxhq.xyz](https://keryxhq.xyz) • **Judges:** [keryxhq.xyz/for-judges](https://keryxhq.xyz/for-judges) • **Docs:** [keryxhq.xyz/docs](https://keryxhq.xyz/docs) • **Ledger:** [keryxhq.xyz/live](https://keryxhq.xyz/live)

</div>

---

Keryx is the **paid tool registry for AI agents**.

Developers publish tools. Agents discover them, pay per call in sub-cent USDC on [Arc](https://www.arc.network/), and get results instantly. No accounts, no API keys, no subscriptions, no human gatekeepers.

### Live traction (Arc testnet)

Numbers from the public ledger — refresh [keryxhq.xyz/live](https://keryxhq.xyz/live) / `GET /api/ledger`:

| Metric | Live |
|--------|------|
| Paid calls settled | **~418** |
| Volume | **~$1.08 USDC** |
| Unique callers | **~122** |
| Publishers | **2** |
| Settlement | Local facilitator · Arcscan tx hashes |
| Receipt proof | `POST /api/receipt/verify` → **R5** (Arc `eth_getTransactionReceipt`) |

Example R5:

```bash
curl -sS -X POST https://keryxhq.xyz/api/receipt/verify \
  -H 'content-type: application/json' \
  -d '{"txHash":"0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1"}'
```

Autonomous buyer (wallet pays): [quickstart.ts](https://keryxhq.xyz/quickstart.ts) · Judge one-pager: [for-judges](https://keryxhq.xyz/for-judges)

---

## Why Keryx

Every API on the internet was designed for humans.

Agents are becoming the primary consumers of software — yet they still have to pretend to be people: sign up, generate keys, add cards, wait for webhooks.

**Keryx removes the human-shaped friction.**

- A tool is just an HTTP endpoint + price + wallet.
- An agent pays exactly once per call using x402 micropayments.
- Settlement is real USDC on Arc (local facilitator; Circle Gateway when preferred), fast, and auditable on a public ledger.

Payment + execution happen in the same round-trip.

---

## How it works

1. **Publish** — Register a tool with an id, price (in USD), and Arc wallet. It appears instantly in the public registry.
2. **Discover** — Any agent calls `GET /api/tools` and receives every tool with price, schema, and example call (machine-readable).
3. **Call & Pay** — `POST /api/call` with toolId + args. Keryx returns a 402 with payment details → agent signs (EIP-3009) → Keryx executes, settles USDC to the publisher `payTo` on Arc, and returns the result + ledger entry. (5% platform fee is ledger accounting today; onchain transfer is 100% to payTo until split settlement ships.)

Every call (success or failure) is written to the public ledger at [/live](https://keryxhq.xyz/live).

---

## Live Links

| What | Link |
|------|------|
| 🌐 Product | [keryxhq.xyz](https://keryxhq.xyz) |
| 📖 Integration Docs | [keryxhq.xyz/docs](https://keryxhq.xyz/docs) |
| 📊 Public Ledger | [keryxhq.xyz/live](https://keryxhq.xyz/live) |
| 🧪 Agent Playground | [keryxhq.xyz/ask](https://keryxhq.xyz/ask) |
| 📝 Publish a tool | [keryxhq.xyz/publish](https://keryxhq.xyz/publish) |
| 🗂️ Browse registry | [keryxhq.xyz/registry](https://keryxhq.xyz/registry) |
| ⚖️ For judges (Lepton) | [keryxhq.xyz/for-judges](https://keryxhq.xyz/for-judges) |
| 📊 Pitch deck | [keryxhq.xyz/pitch](https://keryxhq.xyz/pitch) |
| 📦 SDK | [keryxhq.xyz/sdk](https://keryxhq.xyz/sdk) · [@keryxhq/middleware](https://www.npmjs.com/package/@keryxhq/middleware) |
| 🤖 Agent discovery | [/.well-known/x402](https://keryxhq.xyz/.well-known/x402) · [/llms.txt](https://keryxhq.xyz/llms.txt) · [/api/demo](https://keryxhq.xyz/api/demo?toolId=crypto.price) · [/api/receipt/verify](https://keryxhq.xyz/api/receipt/verify) · [/quickstart.ts](https://keryxhq.xyz/quickstart.ts) · [/quickstart.py](https://keryxhq.xyz/quickstart.py) · [/keryx-openapi.json](https://keryxhq.xyz/keryx-openapi.json) |

---

## Try it right now

### As an agent (curl)

```bash
# 0. Agent front door (machine-readable)
curl https://keryxhq.xyz/.well-known/x402
curl https://keryxhq.xyz/llms.txt

# 0b. Free sample before pay (no USDC)
curl "https://keryxhq.xyz/api/demo?toolId=crypto.price"

# 1. Discover tools
curl https://keryxhq.xyz/api/tools

# 2. Call a tool (you will get a 402 first)
curl -X POST https://keryxhq.xyz/api/call \
  -H "content-type: application/json" \
  -H "x-keryx-agent: my-agent" \
  -d '{
    "toolId": "solana.token-activity",
    "args": { "mintOrSymbol": "BONK" }
  }'
```

The 402 response contains a machine-readable `accepts` block. Sign it and retry with the `X-PAYMENT` header.

### As a publisher

```bash
curl -X POST https://keryxhq.xyz/api/publishers/tools \
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

Full schemas and agent SDK snippets live in the [docs](https://keryxhq.xyz/docs).

---

## Seeded Tools (all real data, executable by Keryx)

| id | Source | Price |
|----|--------|-------|
| `solana.token-activity` | DexScreener | $0.005 |
| `solana.launches` | DexScreener | $0.003 |
| `solana.rug-check` | rugcheck.xyz | $0.002 |
| `search.web` | Wikipedia | $0.004 |
| `crypto.trending` | CoinGecko | $0.001 |
| `weather.current` / `weather.forecast` | Open-Meteo | $0.002–0.003 |
| `finance.exchange-rates` / `finance.convert` | Public currency APIs | $0.002 |
| `geo.ip-lookup` | ipapi.co | $0.002 |
| `dns.domain-whois` | Public RDAP/WHOIS | $0.003 |
| `web.hacker-news` | HN Firebase | $0.001 |
| `web.github-repo` | GitHub (public) | $0.002 |
| `crypto.price` | CoinGecko simple price | $0.002 |
| `utility.qr` | QR code generator | $0.001 |
| `geo.country` | RestCountries | $0.001 |

20 seeded executable tools (Solana research, weather, finance, geo, crypto market signals, search, utilities, time, uuid, etc.). More added regularly. Community tools can be published by anyone; only those with a handlerUrl are auto-executable by Keryx surfaces.

Additional community tools (with `verified: false`) can be published by anyone.
Keryx's goal is a large, always-on catalog (50–100+) of micro-tasks an average web2 or web3 user/agent reaches for daily: weather, rates, geo, domain info, HN, repo facts, prices, QR, country data, and many more. Seeded tools are implemented and maintained by the Keryx team against real public endpoints.

---

## Architecture

**Stack**
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Turbopack
- Arc testnet (chain id `5042002`) — USDC native, ultra-cheap
- x402 + Circle Gateway for real micropayments
- Upstash Redis (optional) or in-memory fallback
- Vercel AI SDK + OpenAI for the `/ask` playground agent
- wagmi + viem for wallet flows

**Key routes**

```
app/
├── api/
│   ├── call/                 # POST — paid execution + settlement
│   ├── tools/                # GET — full registry
│   ├── tools/[id]/           # GET — single tool schema
│   ├── publishers/tools/     # POST — register new tool (signed)
│   ├── ledger/               # GET — public history + stats
│   └── ask/                  # POST — agent playground
├── ask/                      # Chat UI that actually pays for tools
├── docs/                     # Human + agent integration guides
├── live/                     # Public settlement ledger
├── publish/                  # Publisher form
└── registry/                 # Browse tools
```

---

## Running locally

```bash
git clone https://github.com/cryptoduke01/keryx.git
cd keryx
pnpm install
cp .env.example .env.local   # sane defaults exist
pnpm dev
```

Open http://localhost:3000.

The playground at `/ask` works with just an `OPENAI_API_KEY`. Everything else gracefully falls back to in-memory mode.

```bash
pnpm build
pnpm typecheck
```

See `.env.example` for Redis, WalletConnect, and real Circle Gateway settlement.

---

## Status & Roadmap notes

v0.1. The payment rail is real.

- `POST /api/call` correctly returns HTTP 402 + machine-readable payment requirements.
- Publisher ownership is enforced with EIP-191 signatures.
- Real on-chain settlement via local Arc facilitator (`KERYX_FACILITATOR_PRIVATE_KEY`) or Circle Gateway (`CIRCLE_GATEWAY_PREFERRED=true` + `CIRCLE_GATEWAY_API_URL`).
- Community tools are accepted but flagged `verified: false` until reviewed.
- Next milestone on the [whitepaper](https://keryxhq.xyz/whitepaper): external handler hosting so publishers run their own endpoints.

---

## License

MIT

---

<div align="center">

**Built by duke.sol** • [keryxhq.xyz](https://keryxhq.xyz) • [@dukedotsol](https://x.com/dukedotsol)

</div>
