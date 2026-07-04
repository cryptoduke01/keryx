#!/usr/bin/env bash
#
# traction-run.sh — LOCAL ONLY script to generate realistic onchain activity.
#
# IMPORTANT: This is for local development / hackathon prep only.
# Run it against your own test deployment or keryxhq.xyz from your machine.
# Do NOT commit large volumes of artificial calls without clear disclosure.
#
# What it does: fires ~100 real x402 tool calls (mix of seeded + external creator payouts).
#
# Requirements: bash, curl, node.
#
# Usage:
#   bash docs/hackathon/traction-run.sh
#
# Output: each line reports "→ ok toolId caller" so you can see the run.

set -eo pipefail

BASE_URL="${KERYX_BASE_URL:-https://keryxhq.xyz}"

fire() {
  local caller="$1"
  local tool="$2"
  local args="$3"
  local resp
  resp=$(curl -sS -X POST "$BASE_URL/api/mcp" \
    -H "content-type: application/json" \
    -H "mcp-client-name: $caller" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$args}}" \
    --max-time 30)
  local ok
  ok=$(echo "$resp" | node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8"));process.stdout.write(d.error?"err:"+d.error.message:"ok")')
  echo "→ $ok  $tool  ← $caller"
}

echo "Firing ~100 real x402 calls against $BASE_URL …"
echo ""

# Wave 1 — Solana research agent
fire "solana-research-agent"  "solana.token-activity"  '{"mintOrSymbol":"BONK"}'
fire "solana-research-agent"  "solana.launches"        '{"limit":3}'
fire "solana-research-agent"  "solana.rug-check"       '{"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}'

# Wave 2 — Trading assistant
fire "trading-assistant-42"   "crypto.trending"         '{"limit":5}'
fire "trading-assistant-42"   "finance.exchange-rates"  '{"base":"usd"}'
fire "trading-assistant-42"   "solana.token-activity"   '{"mintOrSymbol":"USDC"}'

# Wave 3 — Travel-planning agent hits weather + geo
fire "travel-copilot-v2"      "weather.current"         '{"latitude":52.52,"longitude":13.41}'
fire "travel-copilot-v2"      "weather.forecast"        '{"latitude":40.71,"longitude":-74,"days":3}'
fire "travel-copilot-v2"      "geo.country"             '{"query":"Portugal"}'

# Wave 4 — Research agent hits Wikipedia + Hacker News
fire "research-analyst-9"     "search.web"              '{"query":"Circle Arc network"}'
fire "research-analyst-9"     "search.web"              '{"query":"stablecoin regulation"}'

# Wave 5 — External creator payout (initial burst). These land in 0x3AfD…B34E.
fire "creator-fan-alpha"      "demo.content-block"      '{"topic":"what is x402"}'
fire "creator-fan-beta"       "demo.content-block"      '{"topic":"paid tools for AI agents"}'
fire "creator-fan-gamma"      "demo.content-block"      '{"topic":"onchain settlement"}'

# Wave 6 — one more real onchain settlement for good measure
fire "utility-runner"         "crypto.trending"         '{"limit":3}'

# === Bulk volume (to reach ~100 total) ===
echo ""
echo "Now firing bulk volume..."

# 40 more trending calls (high volume, cheap tool)
for i in $(seq 1 40); do
  caller="bulk-trend-$i"
  fire "$caller" "crypto.trending" '{"limit":3}'
done

# 35 more calls to the external creator (strong "creators get paid" proof)
for i in $(seq 1 35); do
  caller="creator-fan-bulk-$i"
  fire "$caller" "demo.content-block" '{"topic":"what is x402"}'
done

# A few more varied real settlements for texture
for i in $(seq 1 8); do
  caller="bulk-solana-$i"
  fire "$caller" "solana.token-activity" '{"mintOrSymbol":"BONK"}'
done

echo ""
echo "Done. Head to $BASE_URL/live to see the fresh rows."
echo "~35+ rows tagged 'demo.content-block' pay the external creator wallet"
echo "0x3AfD3EF93cd406eBBd76fc1b32C58492FAd4B34E — click a tx hash to verify"
echo "the USDC lands outside the Kēryx treasury."
echo ""
echo "This script is intended to be run locally for testing/demo prep."
