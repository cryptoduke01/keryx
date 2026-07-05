# Changelog

All notable changes to `@keryxhq/middleware` are documented here. The package
follows [semver](https://semver.org).

## 0.1.0 — 2026-07-04

Initial public release.

### Added

- `paidHandler({ price, wallet, network?, description?, facilitatorUrl?, handler })`
  for Next.js Route Handlers. Wraps a business-logic handler with x402 payment
  enforcement.
- `paidExpress({ price, wallet, network?, description?, facilitatorUrl? })` as
  a connect-style middleware for Express, Fastify, Hono, and any framework
  that speaks the same middleware shape.
- Framework-agnostic primitives: `buildRequirements`, `decodePaymentHeader`,
  `verifyPayment`, `buildX402Body`, `handlePaymentCheck`, `priceToAtomicUsdc`.
- Optional EIP-3009 signature verification via `viem` (peer dependency). When
  `viem` is installed and a chain domain is provided, the SDK recovers the
  signer address and compares it to the authorization's `from`. Falls back to
  structural verification (amount + recipient + network + expiry) otherwise.
- Networks: `arc-testnet` (default), `arc-mainnet`, `base-sepolia`, `base`.
- Optional `facilitatorUrl` (or `KERYX_FACILITATOR_URL` env var) delegates
  verify + settle to a facilitator that broadcasts the authorization onchain
  and returns a tx hash.
- Full TypeScript declarations, source maps, ESM output. `sideEffects: false`
  for tree-shaking. Node 18+.
