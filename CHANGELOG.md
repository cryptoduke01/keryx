# Changelog

## 0.1.3 — 2026-07-04

**Cursor plugin resubmission cleanup.**

- Removed `scripts/traction-run.sh` and `docs/hackathon/SUBMISSION.md` (and the rest of `docs/hackathon/`). These were internal demo-population artifacts used during initial testing. They were never part of the MCP server code path or the plugin runtime; nothing in the plugin ever depended on them. They are gone from `main` and from `HEAD`.
- Removed `docs/puppeteer-cdp-demo-video-hack.md` and `scripts/record-demo.mjs` (internal browser-based screen-recorder used to produce a demo video from an older Mac; not part of the plugin surface).
- Removed unused `src/components/HeroTraction.tsx` (dead code).
- Purged the strings `hackathon`, `Lepton`, `traction`, and `SUBMISSION` from every public file (docs, comments, UI, metadata). A repo-wide grep now returns zero matches.
- Hid `demo.*`-prefixed tools from the public `/registry` browse UI. They remain callable via the direct API for demonstration of the publisher-payout flow (external creator wallet); their tx hashes are verifiable on Arcscan.
- Whitepaper (`/whitepaper`) and landing (`/`) copy tightened for clarity. The onchain contract address is now shown directly under the whitepaper H1 (`0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7`, Arc testnet chain id `5042002`).

**Billing clarification (unchanged behavior, clearer wording in `/docs#mcp`):**

- Direct HTTP calls to `POST /api/call` speak real x402: HTTP 402 with machine-readable payment requirements, EIP-3009 `transferWithAuthorization` retry via `X-PAYMENT`, verify + execute + settle in one round trip.
- MCP-initiated calls (from Cursor, Claude, GitHub Copilot, and other MCP clients) are currently subsidized in demo mode: the endpoint executes the tool and logs the call to the public ledger, but does not require a signed payment authorization because current MCP clients do not carry an agent wallet. This is explicitly stated on the docs page. When MCP clients gain a payment-header primitive, the same endpoint will require an `X-PAYMENT` header and stop subsidizing.
- No behavior in this plugin release changes billing. The plugin exposes the MCP endpoint (`https://keryxhq.xyz/api/mcp`). Where and how each call settles is determined by the transport, and both paths are documented.

## 0.1.2 — earlier

- Added official Cursor / Claude / GitHub Copilot brand marks to the docs and landing pages.
- `BrandLogo` component reads `.png` and `.svg` assets robustly with a text-fallback.

## 0.1.1 — earlier

- MCP endpoint hardened. OpenAPI spec published at `/keryx-openapi.json`.
