<div align="center">

# Keryx

**The toll booth for the agent economy.**

Paid tool registry for AI agents — **USDC on Circle Arc**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Arc](https://img.shields.io/badge/Arc-Circle_L1-00C4B4?style=flat)](https://www.arc.network/)
[![x402](https://img.shields.io/badge/x402-micropayments-orange?style=flat)](https://github.com/coinbase/x402)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Lepton / Arc judges — start here only

| | |
|--|--|
| **Judge one-pager** | [keryxhq.xyz/for-judges](https://keryxhq.xyz/for-judges) |
| **Agency path** | [quickstart.ts](https://keryxhq.xyz/quickstart.ts) → `POST /api/call` → [receipt R5](https://keryxhq.xyz/api/receipt/verify) |
| **Product** | [keryxhq.xyz](https://keryxhq.xyz) |
| **Ledger** | [keryxhq.xyz/live](https://keryxhq.xyz/live) |
| **Docs** | [keryxhq.xyz/docs](https://keryxhq.xyz/docs) |

</div>

> **Hard rule for Lepton judges:** Score **Arc + USDC + `/api/call` + R5** only.  
> **Ignore** `/okxasp`, OKX.AI ASP #4759, USDT0, and X Layer. That surface is a **separate** OKX.AI Genesis product (see [Appendix A](#appendix-a--okxai-genesis-surface--not-lepton) at the bottom). Mixing rails is a scoring error.

---

## Same monorepo, two products (do not blend)

| | **Lepton product (this README body)** | **OKX.AI Genesis (appendix only)** |
|--|---------------------------------------|-------------------------------------|
| **Name** | Keryx — paid tool registry | Keryx Finance Copilot (ASP) |
| **Chain / asset** | **Arc** · **USDC** | **X Layer** · **USDT0** |
| **APIs** | `/api/call` · `/api/tools` · `/api/receipt/verify` | `/api/okxasp/*` only |
| **UI** | `/` · `/for-judges` · `/live` · `/publish` · `/ask` | `/okxasp` · okx.ai/agents/4759 |
| **Hackathon** | Lepton Agents (Arc / x402) | OKX.AI Genesis |

Paths under `src/app/okxasp/` and `src/lib/okxasp/` are **out of scope** for Lepton scoring.

---

## What Keryx is (Arc)

Keryx is the **paid tool registry for AI agents**.

Developers publish HTTP tools at a price. Agents discover them, pay **per call in USDC on [Arc](https://www.arc.network/)**, and get results in one round trip. No accounts, no API keys, no human checkout forms.

### Prove agency (not the sponsored playground)

Judges score **wallet-equipped agents that pay**. Start at [for-judges](https://keryxhq.xyz/for-judges) **Step 1**:

1. Run [quickstart.ts](https://keryxhq.xyz/quickstart.ts) (or `.py`) with an Arc testnet key + test USDC  
2. Script hits `POST /api/call` → HTTP **402** → EIP-3009 pay → **200** + result  
3. Prove onchain: `POST /api/receipt/verify` → expect **`tier: "R5"`** + Arcscan  

`/ask` and MCP discovery can be **Keryx-sponsored** (no wallet in the browser). Useful demos — **not** the agency score.

### Settlement proof (R5)

```bash
curl -sS -X POST https://keryxhq.xyz/api/receipt/verify \
  -H 'content-type: application/json' \
  -d '{"txHash":"0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1"}'
# expect: "tier":"R5", "onchain":{"status":"success", ...}
```

Ledger (open): [keryxhq.xyz/live](https://keryxhq.xyz/live) · `GET /api/ledger`  

When citing volume: prefer **R5-proven** Arcscan-linked `local` rows over raw call totals (demos / cheap utilities / sponsored `web-*` traffic inflate counts).

---

## Why Keryx

Every API on the internet was designed for humans.

Agents are becoming primary consumers of software — yet they still pretend to be people: sign up, generate keys, add cards, wait for webhooks.

**Keryx removes that friction.**

- A tool is an HTTP endpoint + price + Arc wallet (`payTo`).
- An agent pays once per call with x402 micropayments.
- Settlement is real USDC on Arc (local facilitator; Circle Gateway when preferred), auditable on a public ledger.

Payment + execution happen in the same round-trip.

---

## How it works (Arc)

1. **Publish** — Register a tool with id, price (USD), and Arc wallet. It appears in the public registry.  
2. **Discover** — `GET /api/tools`, `/.well-known/x402`, `/llms.txt` (machine-readable).  
3. **Call & pay** — `POST /api/call` with `toolId` + args → **402** + requirements (+ bazaar extensions) → agent signs EIP-3009 → Keryx executes, settles **100% onchain to `payTo`**, returns result + ledger entry. (5% platform fee is ledger accounting until split settlement.)

Every paid settlement is on [/live](https://keryxhq.xyz/live).

---

## Live links (Lepton / Arc only)

| What | Link |
|------|------|
| Product | [keryxhq.xyz](https://keryxhq.xyz) |
| **For judges (Lepton)** | [keryxhq.xyz/for-judges](https://keryxhq.xyz/for-judges) · `pnpm judge:agency` |
| Integration docs | [keryxhq.xyz/docs](https://keryxhq.xyz/docs) |
| Public ledger | [keryxhq.xyz/live](https://keryxhq.xyz/live) |
| Publish a tool | [keryxhq.xyz/publish](https://keryxhq.xyz/publish) |
| Registry | [keryxhq.xyz/registry](https://keryxhq.xyz/registry) |
| Pitch deck | [keryxhq.xyz/pitch](https://keryxhq.xyz/pitch) |
| SDK | [keryxhq.xyz/sdk](https://keryxhq.xyz/sdk) · [@keryxhq/middleware](https://www.npmjs.com/package/@keryxhq/middleware) |
| Autonomous buyer | [/quickstart.ts](https://keryxhq.xyz/quickstart.ts) · [/quickstart.py](https://keryxhq.xyz/quickstart.py) |
| Receipt verify | [POST /api/receipt/verify](https://keryxhq.xyz/api/receipt/verify) |
| Free sample | [/api/demo?toolId=crypto.price](https://keryxhq.xyz/api/demo?toolId=crypto.price) |
| Agent discovery | [/.well-known/x402](https://keryxhq.xyz/.well-known/x402) · [/llms.txt](https://keryxhq.xyz/llms.txt) · [/keryx-openapi.json](https://keryxhq.xyz/keryx-openapi.json) |
| Sponsored playground (optional) | [keryxhq.xyz/ask](https://keryxhq.xyz/ask) |

---

## Try it (Arc)

```bash
# Discovery
curl https://keryxhq.xyz/.well-known/x402
curl https://keryxhq.xyz/llms.txt
curl https://keryxhq.xyz/api/tools

# Free sample (no USDC)
curl "https://keryxhq.xyz/api/demo?toolId=crypto.price"

# Paid path without a wallet → HTTP 402
curl -X POST https://keryxhq.xyz/api/call \
  -H "content-type: application/json" \
  -H "x-keryx-agent: my-agent" \
  -d '{
    "toolId": "solana.token-activity",
    "args": { "mintOrSymbol": "BONK" }
  }'

# Full agency (wallet pays):
#   curl -O https://keryxhq.xyz/quickstart.ts
#   export PRIVATE_KEY=0x…   # Arc testnet + test USDC
#   npx tsx quickstart.ts
```

### As a publisher (Arc wallet)

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

Schemas and SDK snippets: [docs](https://keryxhq.xyz/docs).

---

## Seeded tools (Arc registry)

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

Executable seeded tools hit real public APIs. Community tools can be published; only those with a `handlerUrl` / registered handler are auto-executable. Goal: a large catalog of micro-tasks agents reach for daily.

---

## Architecture (Arc core)

**Stack**
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Turbopack  
- Arc network (default **testnet** `5042002`; mainnet via env when Circle publishes) — USDC  
- Header **network dropdown** · `GET /api/arc-network` · settle with `NEXT_PUBLIC_ARC_NETWORK`
- x402 + local Arc facilitator and optional Circle Gateway  
- Upstash Redis (optional) or in-memory fallback  
- Vercel AI SDK + OpenAI for **sponsored** `/ask`  
- wagmi + viem for wallet flows  

**Key routes (Lepton-relevant)**

```
app/
├── api/
│   ├── call/                 # POST — paid execution + Arc settlement
│   ├── tools/                # GET — registry
│   ├── tools/[id]/
│   ├── publishers/tools/     # POST — register tool (signed)
│   ├── ledger/               # GET — public history + stats
│   ├── receipt/verify/       # POST — R5 Arc receipt proof
│   ├── demo/                 # GET — free unpaid sample
│   └── ask/                  # POST — sponsored playground (not agency)
├── for-judges/               # Lepton one-pager
├── live/                     # Public settlement ledger
├── publish/                  # Publisher form
├── registry/                 # Browse tools
├── docs/ · ask/ · pitch/ · sdk/
└── okxasp/                   # ⚠️ OKX Genesis only — NOT Lepton (see Appendix A)
```

Settlement for Arc lives under `src/lib/x402/` and `src/app/api/call/`.  
OKX settlement lives under `src/lib/okxasp/` — **do not use for Lepton review.**

---

## Running locally

```bash
git clone https://github.com/cryptoduke01/keryx.git
cd keryx
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

`/ask` needs `OPENAI_API_KEY`. Arc settle needs facilitator / wallet env (see `.env.example`).

```bash
pnpm build
pnpm typecheck
```

---

## Status

v0.1. Arc payment rail is real.

- `POST /api/call` returns HTTP 402 + machine-readable requirements.  
- Publisher ownership via EIP-191.  
- On-chain settle via local Arc facilitator (`KERYX_FACILITATOR_PRIVATE_KEY`) or Circle Gateway when preferred.  
- Receipt verify reaches **R5** against Arc RPC.  
- Community tools flagged `verified: false` until reviewed.  

---

## License

MIT

---

# Appendix A — OKX.AI Genesis surface (NOT Lepton)

> **Lepton judges: stop here.** Nothing below is part of the Arc / USDC / Lepton scorecard.

Same monorepo ships a **parallel** ASP for [OKX.AI Genesis](https://web3.okx.com/xlayer/build-x-series):

| | |
|--|--|
| **Product** | Keryx Finance Copilot |
| **Listing** | [okx.ai/agents/4759](https://okx.ai/agents/4759) |
| **Site** | [keryxhq.xyz/okxasp](https://keryxhq.xyz/okxasp) |
| **Docs** | [keryxhq.xyz/okxasp/docs](https://keryxhq.xyz/okxasp/docs) |
| **For judges (OKX only)** | [keryxhq.xyz/okxasp/for-judges](https://keryxhq.xyz/okxasp/for-judges) · `pnpm okx:smoke` |
| **Catalog** | [GET /api/okxasp/catalog](https://keryxhq.xyz/api/okxasp/catalog) |
| **Chain / asset** | X Layer (`eip155:196`) · USDT0 |
| **Protocol** | OKX Agent Payments Protocol (A2MCP, 402 → pay → JSON) |

```bash
# Free discovery (OKX rail only)
curl -sS https://keryxhq.xyz/api/okxasp/catalog | head
curl -sS https://keryxhq.xyz/api/okxasp/health

# Unpaid probe → HTTP 402 (buyer wallet must ≠ seller payTo)
curl -sS -D - -o /dev/null \
  "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=bitcoin" \
  -H "Accept: application/json" \
  -H "User-Agent: OKX-A2MCP-Client/1.0"
```

Code: `src/app/okxasp/**`, `src/lib/okxasp/**`, `src/app/api/okxasp/**`.  
Does **not** use Arc USDC or `POST /api/call`.

---

<div align="center">

**Built by duke.sol** • [keryxhq.xyz](https://keryxhq.xyz) • [@dukedotsol](https://x.com/dukedotsol)

Lepton: Arc + USDC · OKX Genesis: see Appendix A only

</div>
