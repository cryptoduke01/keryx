# OKX.AI Genesis Hackathon — Keryx coexistence plan

**Deadline:** Google form before **Jul 17, 00:00 UTC** (also listed as Jul 17, 23:59 UTC / Jul 18 08:00 UTC+8)  
**Form:** https://forms.gle/mddEUagmDbyV37ws8  
**HackQuest listing:** https://hackquest.io/en/hackathons  
**Listing guide:** https://okx.ai/tutorial/asp  
**Register / Build X:** https://web3.okx.com/xlayer/build-x-series  
**X demo:** ≤ 90 seconds · hashtag **`#okxai`** / **`#OKXAI`**

Review: OKX says ASP listing review is typically **within 24 hours** (email + agent chat).

---

## Coexistence (do not rewire Lepton / Arc)

| Surface | Chain | Payment | Status |
|---------|-------|---------|--------|
| **Keryx core** (`/ask`, `/api/call`, MCP, registry) | Arc (`5042002`) | Circle / local / demo facilitator | **Untouched** — Lepton product |
| **OKX ASP feature** (`/okxasp`, `/api/okxasp/*`) | X Layer (`eip155:196` / testnet `1952`) | OKX Payment SDK + `OKXFacilitatorClient` | **New parallel feature** |

Same repo, same handlers where useful, **separate settlement path**. Judges on OKX.AI never need Arc. Arc users never need OKX keys.

```
Agent on OKX.AI
    → A2MCP call to keryxhq.xyz/api/okxasp/...
    → HTTP 402 (OKX x402)
    → Agentic Wallet pays USDT0 on X Layer
    → Handler reuses Keryx tool logic (finance/crypto)
    → 200 + result

Agent on Arc / Claude / Cursor
    → existing /api/call + Arc USDC  (unchanged)
```

---

## What is an ASP (reminder)

**Agent Service Provider** = seller on OKX.AI marketplace.

- **A2MCP** — pay-per-call MCP/API (our path). Fixed price. Instant settle via OKX Payment SDK. Endpoint must speak x402.
- **A2A** — negotiated tasks + escrow. Skip for v1.

We ship: **Keryx Finance Copilot** as an **A2MCP ASP** (Best Product + Finance Copilot + Software Utility + Social Buzz).

---

## Entry script (do not miss)

1. **Build** ASP with clear real-world use case (finance / market intel for agents).
2. **Submit for listing** via Onchain OS → https://okx.ai/tutorial/asp  
   ASP must **pass review and go live** or the hackathon entry is invalid.
3. **Google form** before Jul 17, 00:00 UTC → https://forms.gle/mddEUagmDbyV37ws8  
   Include ASP details + link to X post.
4. **X post** with `#okxai`, explain problem + ASP, demo **≤ 90 seconds**.

### Prize tracks we aim for

| Track | Why we fit |
|-------|------------|
| **Best Product** ($10k / $6k / $4k) | Polished A2MCP, real tools, clear demo, reliability |
| **Business Potential** | Registry + middleware story; marketplace-native |
| **Revenue Rocket** | Drive paid calls on OKX.AI during campaign |
| **Finance Copilot** ($2.5k × 3) | Primary category — prices, token intel, FX |
| **Software Utility** ($2.5k × 3) | Secondary — paid tools / MCP |
| **Social Buzz** ($1k × 10) | Strong X demo + #okxai |

Judging: product quality, use case, marketplace fit, innovation, reliability, long-term potential, **social traction**.

---

## How to get OKX credentials

You need **three strings** for the seller SDK:

- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`

### A) Developer Portal API keys (required for settlement)

Docs: https://web3.okx.com/onchainos/dev-docs/home/developer-portal

1. Open **OKX Developer Portal** (from Onchain OS docs → Developer Portal).
2. **Connect Wallet** (OKX Wallet recommended) → **Verify** signature.
3. **Link email + phone** (Get started → verify codes). Some regions are restricted.
4. On Home → **Create API key**.
5. Enter a **name** and a **passphrase you invent** (save it — you cannot recover it).
6. Click **Create**. Copy **API key**.
7. **View details** → copy **Secret key**.
8. Put all three in `.env.local` (never commit):

```bash
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
OKX_PAY_TO_ADDRESS=0x...   # Agentic Wallet or any EVM wallet that receives fees
OKX_X402_NETWORK=eip155:1952   # testnet first; switch to eip155:196 for mainnet
```

Limits: up to **3 projects**, **3 API keys per project**.

### B) Agentic Wallet + Onchain OS (required to register / list ASP)

Guide: https://okx.ai/tutorial/asp

**OTP is a second command.** `wallet login` only sends the email. Then:

```bash
export PATH="$HOME/.local/bin:$PATH"
onchainos wallet login your@email.com
# Wait for the email code, then:
onchainos wallet verify 123456
onchainos wallet status          # loggedIn should be true
onchainos wallet addresses       # copy X Layer / EVM address → OKX_PAY_TO_ADDRESS if needed
```

Do **not** paste the OTP into chat. If the code expired, run `wallet login` again to resend.

Then register A2MCP:

```text
Help me register an A2MCP ASP on OKX.AI using OKX Agent Identity from Onchain OS
```

Provide: name, description, **price per call**, **public https endpoint** (e.g. `https://keryxhq.xyz/api/okxasp/tools/crypto-price`).

List on marketplace:

```text
Help me list my ASP on OKX.AI using Onchain OS
```

Review ~24h–2 business days → email + agent chat. **Must be approved/live** for the form.

### C) Testnet funds (before mainnet)

- Network testnet: `eip155:1952`
- Claim test **OKB** (gas) + test **USD₮0** from X Layer faucet
- Mock merchant to learn the 402 loop:  
  `https://www.okx.com/api/v1/pay/mock-merchant/resource`

Seller SDK: https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk

---

## Build order (Best Product, not a thin wrapper)

1. **API keys** — done (`.env.local`).
2. **Scaffold + x402 wire** — done: `/okxasp`, catalog, 10 paid tools via `@okxweb3/x402-next` (includes OKX Web3 market endpoints).
3. **Install `onchainos` CLI** — done (`~/.local/bin/onchainos`). Skills install OK for Cursor; PromptScript failures are harmless.
4. **Agentic Wallet login** (you — OTP to email):
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   onchainos wallet login your@email.com
   ```
5. **Deploy** so endpoints are public `https://keryxhq.xyz/api/okxasp/tools/...` (listing rejects localhost).
6. **Register + list** A2MCP on OKX.AI (Onchain OS prompts).
7. **Drive usage** (Revenue Rocket) — friends, X, agents calling paid tools.
8. **≤90s demo** + form + `#okxai` post before deadline.

### Primary listing endpoint (suggested)

`https://keryxhq.xyz/api/okxasp/tools/crypto-price`  
Catalog: `https://keryxhq.xyz/api/okxasp/catalog`

### What “Best Product” looks like vs average entries

| Average ASP | Winning ASP |
|-------------|-------------|
| One joke endpoint | Coherent **Finance Copilot** with 3–5 real tools |
| Broken 402 / demo-only | Real settle on X Layer testnet → mainnet |
| No listing | **Listed** on OKX.AI before form |
| Vague pitch | Problem → pay-per-call → demo in 90s |
| Zero usage | Ledger of paid calls during campaign |

---

## Checklist before Jul 17

- [x] OKX API key + secret + passphrase in `.env.local` + Vercel production
- [x] Agentic Wallet logged in (`0x6adab0c9c761c3459208bfa90ef2f924f986833c`)
- [x] Deployed: https://keryxhq.xyz/okxasp + `/api/okxasp/*` (402 confirmed)
- [x] ASP **#4759** registered — *Keryx Finance Copilot* · **10** A2MCP services (incl. OKX Web3 market) · category SOFTWARE_SERVICES
- [x] Custom browser 402 paywall (shows real USDT0 amount)
- [x] Listing submitted — status: **Listing under review** (AI quality review suggested pass)
- [x] Funded Agentic Wallet (~0.2 OKB + 10 USDT) for paid-call smoke tests
- [ ] Wait for marketplace approval / go live on OKX.AI
- [ ] Google form before Jul 17, 00:00 UTC: https://forms.gle/mddEUagmDbyV37ws8
- [ ] X post with `#okxai` + ≤90s demo
- [ ] Arc/Keryx Lepton paths still green (no regressions)

### ASP #4759 quick refs

| Field | Value |
|-------|-------|
| Name | Keryx Finance Copilot |
| Primary endpoint | https://keryxhq.xyz/api/okxasp/tools/crypto-price |
| Catalog | https://keryxhq.xyz/api/okxasp/catalog |
| Owner / payTo | `0x6adab0c9c761c3459208bfa90ef2f924f986833c` |
| Network (test) | `eip155:1952` |

---

## Links (quick)

- Product feature page: https://keryxhq.xyz/okxasp  
- ASP tutorial: https://okx.ai/tutorial/asp  
- Seller SDK: https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk  
- Dev portal: https://web3.okx.com/onchainos/dev-docs/home/developer-portal  
- Form: https://forms.gle/mddEUagmDbyV37ws8


---

## After listing approval (~24h)

1. Confirm ASP #4759 shows **listed / live** on https://okx.ai (search "Keryx").
2. Smoke a **real paid call** with Agentic Wallet (0.2 OKB + 10 USDT is enough).
3. Switch network to mainnet only if judges expect mainnet settle (`OKX_X402_NETWORK=eip155:196`) and you have mainnet USDT0/OKB.
4. Film ≤90s demo: problem → 402 → pay → JSON → marketplace card. Post on X with `#okxai`.
5. Submit Google form: https://forms.gle/mddEUagmDbyV37ws8 (ASP id, links, X post).
6. Drive usage for Revenue Rocket / Social Buzz (friends, agents, thread replies).

## Grand prize audit (honest)

### Edge
- Real product, not a one-endpoint joke: 8 coherent finance tools + polished `/okxasp`.
- Correct OKX stack: `@okxweb3/x402-*`, 402 confirmed, ASP already in review.
- Dual-rail story (Arc + X Layer) without breaking Lepton.
- Brand + docs surface ready for judges.

### Gaps / losses if we do nothing
- **Zero paid usage yet** → weak Revenue Rocket.
- **Not live on marketplace yet** → form invalid until approved.
- **No demo video / #okxai post yet**.
- Tools wrap public data (CoinGecko etc.) → judges may call it thin vs proprietary finance agents.
- Category is SOFTWARE_SERVICES; Finance Copilot track needs the pitch to scream finance, not generic software.
- Browser 402 HTML shows `$0.00 USDC` (SDK chrome). Agents see correct amount; still looks bad in screenshots.

### What to ship next (priority)
1. Live listing + one successful paid settle (screen-record it).
2. 90s X demo + form.
3. Optional: one "wow" proprietary or OKX-native signal (e.g. OKX market endpoint) so we are not only CoinGecko wrappers.
4. Optional: mainnet settle before deadline if review allows.
