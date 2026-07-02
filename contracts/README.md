# KeryxRegistry

The onchain source of truth for who owns which tool id on Kēryx.

- **File:** [`src/KeryxRegistry.sol`](./src/KeryxRegistry.sol)
- **Tests:** [`test/KeryxRegistry.t.sol`](./test/KeryxRegistry.t.sol) (13 passing)
- **Deploy script:** [`script/Deploy.s.sol`](./script/Deploy.s.sol)
- **Target chain:** Arc testnet (`eip155:5042002`), RPC `https://rpc.testnet.arc.network`

## Live deployment

- **Address:** [`0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7`](https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7)
- **Owner:** `0x8F47aE9eC148903C8535b9289ad8efA400e026B6` (Kēryx treasury)
- **Deploy tx:** `0x3b4b18c4a38d8ad77da82b4669e4d03bb6e1ca84f7e15ccb7c31a319792ce34c`
- **All 5 seeded tools published onchain:** `solana.token-activity`, `solana.launches`, `solana.rug-check`, `search.web`, `crypto.trending`.

Broadcast records archived in `broadcast/Deploy.s.sol/5042002/`.

## What it stores

For each tool id (hashed as `keccak256(bytes(id))`):

- `publisher` — the wallet that first published it. Only wallet allowed to update.
- `priceAtomicUsdc` — per-call price in USDC atomic units (6 decimals).
- `active` — publisher-controlled kill switch.
- `verified` — Kēryx-controlled trust flag.
- `metadataUri` — free-form IPFS / HTTPS URL pointing at the offchain schema, summary, etc.
- `createdAt` / `updatedAt` — block timestamps.

The contract **never holds funds**. Payment happens in the x402 flow against the USDC contract directly; the registry only records who gets paid.

## Ownership rules

| Action | Who |
|---|---|
| `publish(id, price, uri)` | Anyone (writes msg.sender as publisher) |
| `updatePrice`, `updateMetadata`, `setActive`, `transferListing` | The publisher recorded onchain, and only them |
| `setVerified` | Contract owner (Kēryx) |
| `setPaused`, `transferOwner` | Contract owner |

Kēryx as owner **cannot** rewrite a publisher's state — verified in `test_owner_cannot_hijack_publisher_state`.

## Local development

```bash
cd contracts
forge build
forge test -vv
```

All 13 tests should pass.

## Deploy to Arc testnet

You need:

- A funded deployer wallet on Arc testnet (USDC for gas — Arc uses USDC-as-native-gas).
- The deployer's private key in `DEPLOYER_PRIVATE_KEY`.
- Optionally, `KERYX_OWNER` set to a different address if you want ownership split from the deployer.

```bash
cd contracts
DEPLOYER_PRIVATE_KEY=0x... \
KERYX_OWNER=0x8F47aE9eC148903C8535b9289ad8efA400e026B6 \
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast
```

The script prints the deployed address. Grab it, then:

```
Vercel → keryx project → Settings → Environment Variables
  NEXT_PUBLIC_REGISTRY_ADDRESS = 0x...   (add to Production)
```

Redeploy the site. `/registry` now shows the contract address at the top and an **On Arc** badge on every listing that resolves to a live record. The whitepaper's Trust section already documents it.

## Publishing an onchain listing

For our five seeded tools, run one publish per tool from the Kēryx treasury:

```bash
cast send $REGISTRY_ADDRESS \
  "publish(string,uint256,string)" \
  "solana.token-activity" 5000 "https://keryxhq.xyz/api/tools/solana.token-activity" \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Repeat for each of `solana.launches`, `solana.rug-check`, `search.web`, `crypto.trending` with their respective prices in atomic USDC (3000, 2000, 4000, 1000). After all five, `/registry` shows the **On Arc** badge on every card.
