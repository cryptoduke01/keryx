# Lepton Agents Hackathon — Submission Copy

**Form is closed.** Keep this file as the source of truth for **X** (and Discord) redirects to judges.

**Where to post:** reply under **your Lepton submission on X** (that is the thread judges open). Discord is optional backup only if you also posted there.

**Judge one-pager (start here):** https://keryxhq.xyz/for-judges  
**Autonomous buyer:** https://keryxhq.xyz/quickstart.ts · https://keryxhq.xyz/quickstart.py  
**Receipt R5:** `POST https://keryxhq.xyz/api/receipt/verify`  
**Pitch deck:** https://keryxhq.xyz/pitch  
**SDK:** https://keryxhq.xyz/sdk · https://www.npmjs.com/package/@keryxhq/middleware  
**Live ledger:** https://keryxhq.xyz/live · cite **R5-proven** receipts (not raw call counts) · Arc USDC

---

## X redirect (paste as a reply under your submission)

> Video shows the sponsored `/ask` UX. **Score agency on Step 1 of https://keryxhq.xyz/for-judges** — wallet quickstart → `POST /api/call` → receipt verify (R5 via Arc RPC) → Arcscan.  
> Example R5 (paid onchain):  
> `curl -sS -X POST https://keryxhq.xyz/api/receipt/verify -H 'content-type: application/json' -d '{"txHash":"0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1"}'`  
> Arcscan: https://testnet.arcscan.app/tx/0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1  
> Lepton track = Arc + USDC. `/okxasp` is a separate OKX.AI Genesis surface — do not mix rails.

---

## Problem Statement

Every API on the internet was built for humans: sign up, add a card, store an API key. AI agents are becoming the primary consumers of software — but they can't pause mid-task to fill out a signup form or commit to a monthly subscription for a single call.

Micropayments were supposed to fix this, but there's no **discovery + payment + execution layer** built for agents. Developers who want to sell per-call access have to wire x402, wallets, and agent integrations themselves. Agents that want paid capabilities have no catalog to browse, no way to compare cost vs. value, and no standard to pay across tools.

Keryx solves the missing toll booth: a registry where publishers list tools at a price, agents discover them via MCP or HTTP, pay in USDC on Arc per call, and get results in one round trip — no accounts, no keys, no human gatekeepers.

---

## Project Description

**Keryx is the paid tool registry for AI agents** — Stripe for the moment an agent needs to use an API.

**What it does:**
- **Publishers** register HTTP tools with a price (USD) and Arc wallet at `/publish`. Paste an address to preview; sign with wallet to go live.
- **Agents (autonomous):** discover via `GET /api/tools`, `/.well-known/x402`, `/llms.txt`, then pay with `POST /api/call` (see `/quickstart.ts`).
- **Agents (sponsored UX):** `/ask` and MCP are cost-aware / discoverable but **Keryx-sponsored** (no wallet in the client) — useful demos, not the agency score.
- **Pay per call:** `POST /api/call` returns HTTP 402 with machine-readable x402 requirements + root-level `extensions.bazaar` → agent signs EIP-3009 `transferWithAuthorization` → Keryx verifies, executes, settles USDC to publisher `payTo` on Arc, writes `/live`. Prove with `POST /api/receipt/verify` (R5 = Arc `eth_getTransactionReceipt`). Onchain pay is 100% to `payTo`; 5% platform fee is ledger accounting until split settlement.

**Built during Lepton:**
- **@keryxhq/middleware** on npm — wrap Next.js/Express into a paid x402 endpoint in one line.
- MCP server for Cursor / Claude Code / Copilot (sponsored settlement).
- Cost-aware `/ask` agent (sponsored).
- 20+ seeded tools hitting real public APIs + free `/api/demo` samples.
- Agent discovery: `/.well-known/x402`, `/llms.txt`, bazaar extensions, receipt verify, buyer quickstarts.
- `KeryxRegistry.sol` on Arc testnet; facilitator: **local** (preferred, real Arcscan) → Gateway when `CIRCLE_GATEWAY_PREFERRED=true` + URL → demo fallback.

**RFB fit (honest):** RFB05 nanopayment tooling + agent↔API commerce. **Not** claiming RFB01 agent-to-agent networks yet.

**Stack:** Next.js 16, TypeScript, x402, USDC on Circle Arc (5042002), EIP-3009 + EIP-191, MCP, Vercel, `@keryxhq/middleware`.

**Try in 60 seconds (agency path):**  
https://keryxhq.xyz/for-judges → Step 1 · or `curl -O https://keryxhq.xyz/quickstart.ts && npx tsx quickstart.ts`  
Free sample: https://keryxhq.xyz/api/demo?toolId=crypto.price

---

## Traction

**How to cite volume (honest):**
- Do **not** lead with raw call counts (ledger includes demos / cheap utilities / self-tests).
- Lead with **agency proof**: `/quickstart.ts` → `POST /api/call` → `POST /api/receipt/verify` → **tier R5** + Arcscan.
- Prefer Arcscan-linked `local` rows and non-`web-*` callers on https://keryxhq.xyz/live
- **@keryxhq/middleware** on npm · public repo MIT
- X: [@keryxhq](https://x.com/keryxhq) · builder: [@dukedotsol](https://x.com/dukedotsol)

Judges: score **agency** on Step 1 of https://keryxhq.xyz/for-judges (wallet pays). Sponsored `/ask` is optional UX only — not the autonomy score.

**OKX.AI Genesis** (`/okxasp`, ASP #4759) is a **separate** rail (USDT0 · X Layer). Do not mix into Lepton scoring.

---

## Project Source Code

https://github.com/cryptoduke01/keryx

Public, MIT. Monorepo includes app, contracts, and `packages/keryx-middleware/`.

---

## Project Live

https://keryxhq.xyz

Judge shortcuts: https://keryxhq.xyz/for-judges · https://keryxhq.xyz/pitch · https://keryxhq.xyz/sdk

---

## Project Video Demo

**Locked in the Google Form** (~2:12): registry → `/ask` → ledger → publish → MCP.

**Important for async judges:** the video shows sponsored UX. Score **agency** on https://keryxhq.xyz/for-judges Step 1 (wallet quickstart), not the playground alone.

---

## (Arc OSS) Yes — apply

**Yes — I would love to apply for Arc OSS! I can commit to keeping my code open source!**

### Why choose Keryx for Arc OSS?

Circle's `circlefin/arc-*` repos cover wallets, samples, and primitives. Keryx adds an **end-to-end agent-commerce stack** other builders can fork:

| Primitive | What builders get |
|-----------|-------------------|
| **@keryxhq/middleware** | Drop-in x402 wrapper for Next.js / Express |
| **Facilitator abstraction** | Swap local / Circle Gateway / demo via env |
| **Registry + MCP + discovery** | Catalog, `/.well-known/x402`, bazaar extensions, receipt R5 |
| **KeryxRegistry.sol** | Onchain listing mirror on Arc |

---

## Separate track

**OKX.AI Genesis** (`/okxasp`) is X Layer + USDT0 + Agent Payments Protocol — same builder, **not** the Lepton/Arc submission.
