# Lepton Agents Hackathon — Submission Copy

Paste these into the Google Form. Update the **video URL** after you upload your demo to YouTube (unlisted is fine).

**Judge one-pager:** https://keryxhq.xyz/for-judges  
**Pitch deck:** https://keryxhq.xyz/pitch  
**SDK:** https://keryxhq.xyz/sdk · https://www.npmjs.com/package/@keryxhq/middleware

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
- **Agents** discover tools via `GET /api/tools`, MCP (`/api/mcp`), or the `/ask` playground — a cost-aware agent that only spends when fresh data is worth the price.
- **Pay per call:** `POST /api/call` returns HTTP 402 with machine-readable x402 requirements → agent signs EIP-3009 `transferWithAuthorization` → Keryx verifies, executes the handler, splits 95% publisher / 5% platform, and writes every call to a public ledger at `/live`.

**Built during Lepton:**
- Shipped **@keryxhq/middleware** on npm — wrap any Next.js or Express handler into a paid x402 endpoint in one line.
- MCP server so Cursor, Claude Code, and Copilot discover the full catalog without custom integration.
- Cost-aware agent at `/ask` with economic reasoning before paid tool calls.
- 20+ seeded tools (Solana price, token activity, web search, etc.) hitting real public APIs.
- `KeryxRegistry.sol` deployed on Arc testnet; facilitator abstraction ready for Circle Gateway (`CIRCLE_GATEWAY_API_URL` flips prod from demo to real batched settlement).

**Stack:** Next.js 16, TypeScript, x402, USDC on Circle Arc (chain 5042002), EIP-3009 + EIP-191 publisher auth, MCP JSON-RPC, Vercel, `@keryxhq/middleware` (npm).

**Try in 60 seconds:** https://keryxhq.xyz/try · https://keryxhq.xyz/ask · MCP URL: `https://keryxhq.xyz/api/mcp`

---

## Traction

**Live product usage (as of submission):**
- **402 paid tool calls** settled through the registry (public ledger: https://keryxhq.xyz/live)
- **116 unique agent callers** (distinct `x-keryx-agent` identities)
- **$1.06+ USDC** volume on testnet
- **11 executable tools** in registry + publisher submissions

**Distribution & validation:**
- **@keryxhq/middleware** published on npm during the Lepton window
- MCP listing submitted to Cursor Directory (agent discovery path)
- Public repo: https://github.com/cryptoduke01/keryx (MIT)
- X: [@keryxhq](https://x.com/keryxhq) · builder: [@dukedotsol](https://x.com/dukedotsol)

Every call — success or failure — is auditable on `/live` with tool, price, caller, and settlement mode. Judges can reproduce a paid call in under a minute via `/try` or `/ask`.

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

**→ Upload `remotion/out/KeryxDemo-final.mp4` to YouTube (unlisted) and paste URL here.**

Suggested title: *Keryx — Paid tool registry for AI agents (Lepton demo)*

Video covers (~2:12): registry browse → cost-aware agent at /ask → public ledger → publish flow → MCP integration → close.

Subtitles are burned in.

---

## (Arc OSS) Yes — apply

**Yes — I would love to apply for Arc OSS! I can commit to keeping my code open source!**

### Why choose Keryx for Arc OSS?

Circle's `circlefin/arc-*` repos cover wallets, samples, and primitives. Keryx adds an **end-to-end agent-commerce stack** other builders can fork:

| Primitive | What builders get |
|-----------|-------------------|
| **@keryxhq/middleware** | Drop-in x402 wrapper for Next.js / Express — 402, verify, settle without reimplementing payment headers |
| **Facilitator abstraction** | Swap demo / local / Circle Gateway via env — same handler code |
| **MCP registry pattern** | One URL exposes your entire paid tool catalog to Claude, Cursor, Copilot |
| **Publisher flow** | EIP-191 signed listings + optional onchain mirror (`KeryxRegistry.sol`) |
| **Agent playground** | Reference cost-aware agent that evaluates price before spending |

A builder can: `npm i @keryxhq/middleware` → wrap their API → list on Keryx (or self-host the registry) → agents pay in USDC on Arc per call. That's a flow the Arc ecosystem doesn't have in one place today.

---

## Circle / Arc Feedback

**What worked:**
- Arc testnet finality (~<500ms) makes per-call micropayments feel real — agents don't wait on L1 confirmations.
- USDC-native gas at `0x3600` removes "fund wallet with ETH first" friction for agent wallets.
- x402 + EIP-3009 is the right shape for machine callers: one signed authorization, one retry, one result.
- Arcscan testnet explorer made demo verification easy for judges.

**Where Arc can improve:**
- **Gateway docs for agent builders:** The path from "I have a 402 endpoint" to "Circle Gateway settles batched USDC" could be one end-to-end tutorial with env vars and test vectors — we built a facilitator swap for this but it took reading multiple repos.
- **Testnet USDC faucet reliability:** Onboarding new agent wallets during demos sometimes stalled on faucet rate limits; a dedicated builder faucet or higher limits would help hackathon velocity.
- **MCP + x402 examples:** Most Arc samples assume human-initiated wallet flows; agent-initiated micropayment loops (402 → sign → retry) deserve a first-class sample alongside the wallet SDK demos.

---

## General Feedback (Canteen / Lepton)

**What worked:**
- Lepton's agentic focus pushed us to ship a *cost-aware* agent, not just a payment demo — that made the product sharper.
- Circle/Arc tooling was enough to get real USDC settlement on testnet without building our own chain infra.
- The judging dimensions (agentic sophistication, traction, Circle usage, innovation) were clear and shaped what we prioritized.

**What could improve:**
- Earlier clarity on **returning builder** vs. new submission expectations would help teams scope "build progress during Lepton" vs. full greenfield.
- A shared **demo video checklist** (length, subtitles, must-show flows) earlier in the sprint would reduce last-minute scramble.
- Optional **office hours slot** specifically for x402 + Gateway integration questions — several teams hit the same facilitator wiring issues.

---

## Quick checklist before submit

- [ ] Upload video to YouTube → paste URL in form
- [ ] Confirm repo is public: https://github.com/cryptoduke01/keryx
- [ ] Smoke test: https://keryxhq.xyz/ask and https://keryxhq.xyz/live
- [ ] Point judges to https://keryxhq.xyz/for-judges
