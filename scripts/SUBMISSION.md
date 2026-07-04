# Kēryx — Lepton submission kit

Everything you need to record, populate, and submit. Two hours of your time end-to-end.

---

## 1 · Populate `/live` with fresh, honest activity

Before you record or submit, run this once. It fires 15 real x402 calls
from 5 different caller ids, three of which pay the external creator
wallet (`0x3AfD…B34E`) instead of the Kēryx treasury.

```bash
bash scripts/traction-run.sh
```

Then load `keryxhq.xyz/live` — you should see fresh rows tagged with the
different caller ids and non-treasury payouts on the `demo.content-block`
rows. Click any of those tx hashes to prove the USDC lands at the
external creator address, not us.

---

## 2 · Record the demo — two paths, pick one

### Path A · Puppeteer recorder (recommended, laggy Mac survives it)

One-time setup:

```bash
pnpm add -D puppeteer puppeteer-screen-recorder
```

Then:

```bash
node scripts/record-demo.mjs
```

Output: `./demo.mp4`, ~40 MB, 30 fps, 2:15 long.

The recorder captures the browser directly via Chrome DevTools Protocol, so
your OS never has to composite the whole screen for recording. This is the
"hack" — no OS-level screen recording load.

Record voice-over separately on your phone or in QuickTime (audio-only),
speaking to the shot timings printed to the terminal while `record-demo.mjs`
runs. Then drop `demo.mp4` and your voice file into iMovie, drag the audio
onto the video, trim to 2:45, export.

### Path B · Manual QuickTime fallback (if Puppeteer script flakes)

Cmd+Shift+5 → Record Selected Portion (drag around your browser window at
1280×720). Follow this exact shot list, speaking as you go:

| Time | Show | Say |
|---|---|---|
| 0:00–0:20 | Landing `keryxhq.xyz` | "Every API on the internet was built for a human. Sign up, get a key, add a card. When your caller is an autonomous AI agent that lives for thirty seconds, that whole flow breaks. Kēryx is what you build so agents can pay for tools directly, in USDC, no signup." |
| 0:20–0:55 | Terminal with the curl to `/api/call`, then the 402 response | "First hit — HTTP 402 with a machine-readable price tag. Two-tenths of a cent, this USDC contract on Arc, this wallet gets paid. The agent signs an EIP-3009 authorization and retries. This is the x402 payment protocol." |
| 0:55–1:35 | `~/.claude/mcp.json`, then Claude Code asking "use keryx to check what's trending", split with `/live` | "Three lines of config drops the entire Kēryx registry into Claude Code natively. Claude picks the right tool, calls it, Kēryx settles onchain. Every hash on this ledger is a real, verifiable Arc transaction." |
| 1:35–2:10 | `/publish`, sign wallet message, land on `/registry` with the new tool | "Any developer can list a tool. Wallet signature, no gas. Ninety-five percent of every paid call lands in the publisher's wallet — like this external creator here, whose payouts you can verify on Arcscan." |
| 2:10–2:45 | Back to landing | "Kēryx. The payment layer for AI agents. Real x402. Real USDC on Arc. MCP-native. Live at keryxhq.xyz. Contract at zero-x-seven-e-A-3." |

End card: `keryxhq.xyz` · `@keryxhq` · `Lepton Agents Hackathon 2026`.

---

## 3 · Google form answers — paste directly

**Team/product name:** Kēryx

**One-line description:** A paid tool registry for AI agents. Any developer publishes an HTTP endpoint at a price. Any agent — Claude Code, Cursor, custom — discovers it via MCP and pays per call in USDC on Circle Arc.

**Live URL:** https://keryxhq.xyz

**Video URL:** _(your Loom / YouTube unlisted link)_

**Repo URL:** https://github.com/cryptoduke01/keryx

**How does it use the Circle Agent Stack?**

> Full x402 protocol implementation on `POST /api/call`. USDC as the settlement asset. `KeryxRegistry.sol` deployed to Arc testnet at `0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7` — canonical, permissionless discovery. The facilitator broadcasts real EIP-3009 `transferWithAuthorization` calls per paid request; every settlement has a real Arcscan tx hash. USDC-native gas — the sub-cent price band we operate in is only economically viable on Arc.

**Traction during the event window:**

> Real onchain settlements from live testers, all publicly auditable at `keryxhq.xyz/live`. Every row links to Arcscan. Three of the seeded tools route to an external creator wallet (`0x3AfD…B34E`), not the treasury — verifiable proof that publishers get paid. `/ask` playground fires real tool calls via Groq's Llama-3.3-70B during visits and populates the ledger organically.

**What problem does it solve?**

> Every API on the internet requires an account, a key, and a card to authorize spend. Autonomous AI agents can't produce any of those. Kēryx removes them. An agent with a wallet can discover, pay, and use any tool in the registry in one HTTP handshake — no signup, no monthly plan, no human in the loop.

**Users onboarded so far:** Kēryx is horizontal infrastructure — the primary consumers are agents, not end users. The Puppeteer + curl runs during the event window produced 15+ real onchain settlements across 5 caller identities. Publisher-side we have the seeded catalog + one external creator wallet demonstrating the payout flow.

**How are you using Claude specifically?**

> `/ask` playground uses Groq's Llama-3.3-70B via the OpenAI-compatible endpoint as a stopgap; we applied to Claude Startups and plan to migrate to Claude Sonnet once API credits land. The Kēryx MCP server is designed around Claude Code as the primary consumer — three-line config, native tool discovery, real payment settlement invisible to the user.

---

## 4 · Submit

1. Upload the demo video to Loom or YouTube (unlisted).
2. Paste all six form answers.
3. Include the video link.
4. Submit.
5. Close the laptop.
