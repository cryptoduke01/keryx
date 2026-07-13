# Agents that pay for answers

**Keryx · OKX.AI Genesis · X Layer**  
Banner: `/inspo/okx-article-banner.png`  
Product: [https://keryxhq.xyz/okxasp](https://keryxhq.xyz/okxasp) · ASP #4759

---

Most market APIs assume a human with a key and a monthly plan. Agents do not fit that model. They need a few reliable answers, priced in the open, settled the moment they ask.

We built **Keryx Finance Copilot** for that gap: an A2MCP pack on [OKX.AI](https://okx.ai) where agents pay per call in USDT0 on [X Layer](https://web3.okx.com/xlayer), then get JSON back. No shared secrets. No dashboard scrape.

This note covers the thesis, what ships today, what we learned building it for the [OKX.AI Genesis](https://web3.okx.com/xlayer/build-x-series) campaign, and what to expect next.

## Why we are building this

Keryx started as a paid tool registry for AI agents. Publishers list an HTTPS endpoint and a price. Agents discover tools, hit a 402, settle, and read the result. The core product settles USDC on Arc. That path stays intact.

OKX.AI asked for something adjacent and sharper: Agent Service Providers that agents can find and pay inside their marketplace. We did not rewire Arc into X Layer. We shipped a parallel surface under `/okxasp` and `/api/okxasp/*` that speaks OKX’s x402 payment stack.

The product bet is narrow. Agents that trade, research, or size risk need market context mid-task. They should spend a few cents when the answer is worth it, then move on. A Finance Copilot that lives on OKX.AI puts that spend where discovery already happens.

## The thesis

Software should pay for software the way humans pay for APIs: one call, one price, one receipt.

Public scrapes and free tiers break under agent load. Monthly keys force agents to hold secrets they should not hold. Thin wrappers that slap a 402 on CoinGecko and call it an ASP fail the smell test.

Our answer is a coherent pack:

- Four **OKX Web3** tools (token price, market snapshot, wallet PnL, recent per-token PnL) using our seller credentials.
- Five coverage tools (global price, Solana activity, rug risk, launches, FX) so the agent stays inside one ASP.

Primary endpoint: `https://keryxhq.xyz/api/okxasp/tools/okx-token-price`. Catalog: `https://keryxhq.xyz/api/okxasp/catalog`.

Settlement runs on X Layer in USDT0 through OKX’s Payment SDK. Unpaid requests return HTTP 402 with a real amount. Paid requests return JSON.

## What to expect on the product page

Open [keryxhq.xyz/okxasp](https://keryxhq.xyz/okxasp). You get a Finance Copilot surface with its own nav, neon OKX branding, and a live **agent loop**. The loop probes a tool, shows the 402 price, and walks the settle path without burying you in docs first.

Below that: the nine-tool pack with OKX-native tools first, a sticky settle proof, integration docs, and a short product note. Docs walk catalog → 402 → pay → retry. The note states the problem and why this is not a wrapper farm.

If you call an endpoint from a browser with a normal Accept header, you see a paywall with the USDT0 price. Agents and curl get the machine-readable Payment-Required header.

## Lessons from the build

**Parallel paths beat rewrites.** Arc and OKX share handlers where useful. They do not share settlement. Judges on OKX.AI never need Arc. Arc users never need OKX keys.

**402 UX matters for humans and agents.** A blank 402 fails demos. Showing the USDT0 amount in the browser, and recovering from settle timeouts, turned “it paid but we got nothing” into a usable loop.

**Marketplace copy is part of the product.** Category stayed `SOFTWARE_SERVICES` because the CLI has no retag. The profile description leads with Finance Copilot, OKX Web3 prices, wallet PnL, and X Layer. Primary service text marks `okx-token-price` as the main endpoint.

**Coverage has a ceiling.** Enough tools to finish a task. Not enough to look like a free-API mirror with a paywall.

**Social and form come after live.** The Genesis rules require the ASP to pass review and go live, then an X post with `#OKXAI` and a demo under 90 seconds, then the [Google form](https://forms.gle/mddEUagmDbyV37ws8) before Jul 17, 23:59 UTC. A form without a live listing voids the entry.

## Progress so far

We registered **ASP #4759** (*Keryx Finance Copilot*) on OKX.AI. It is **live** at https://okx.ai/agents/4759 (A2MCP, USDT0 on X Layer).

Shipped on our side:

- Nine A2MCP services live at public HTTPS URLs (localhost listings get rejected).
- Custom browser 402 paywall with the real amount.
- Settle-timeout recovery so a successful authorize can still return tool JSON when the facilitator is slow.
- First paid authorize on X Layer testnet with a facilitator success tx: `0x20a15b12c65d4813f6af197257555a0ad0e284b2d81752b581b5cb34f3369273`.
- Vercel env wired for Production, Preview, and Development.

We trimmed the pack from twelve tools to nine. Trending, BTC dominance, and a redundant FX converter made the list look like a commodity dump. Judges skim. Leading with OKX Web3 tools fixes that skim.

We kept settlement on X Layer testnet (`eip155:1952`) until the listing goes live and the seller wallet holds mainnet USDT0 and OKB. Entry does not require mainnet. Revenue Rocket does, after approval.



## What comes next

When approval hits:

1. Confirm ASP #4759 is listed on [okx.ai](https://okx.ai).
2. Smoke one paid call through Agentic Wallet.
3. Post from [@keryxhq](https://x.com/keryxhq) with `#OKXAI`, the use case, and a ≤90s walkthrough (problem → 402 → pay → JSON → marketplace card).
4. Submit the Google form with ASP details and that post.
5. Drive real calls for Revenue Rocket. Flip to mainnet (`eip155:196`) once the seller wallet holds USDT0 and OKB.

Until then we keep the product page sharp, the endpoints green, and Arc untouched.

## Where to look


| Link                                                                                     | What                 |
| ---------------------------------------------------------------------------------------- | -------------------- |
| [https://keryxhq.xyz/okxasp](https://keryxhq.xyz/okxasp)                                 | Product + agent loop |
| [https://keryxhq.xyz/okxasp/docs](https://keryxhq.xyz/okxasp/docs)                       | Integration          |
| [https://keryxhq.xyz/okxasp/whitepaper](https://keryxhq.xyz/okxasp/whitepaper)           | Product note         |
| [https://keryxhq.xyz/api/okxasp/catalog](https://keryxhq.xyz/api/okxasp/catalog)         | Free catalog         |
| [https://okx.ai/tutorial/asp](https://okx.ai/tutorial/asp)                               | ASP listing guide    |
| [https://web3.okx.com/xlayer/build-x-series](https://web3.okx.com/xlayer/build-x-series) | Genesis rules        |


Agents need answers they can buy. We are selling those answers on OKX.AI, one call at a time, on X Layer.