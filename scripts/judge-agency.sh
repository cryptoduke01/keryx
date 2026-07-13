#!/usr/bin/env bash
# Lepton / Arc agency smoke — no wallet required.
# Verifies: demo free path, 402 on unpaid /api/call, R5 receipt verify.
# Full paid quickstart still needs PRIVATE_KEY + Arc USDC (see for-judges).
set -euo pipefail

ORIGIN="${KERYX_ORIGIN:-https://keryxhq.xyz}"
PROOF_TX="${KERYX_PROOF_TX:-0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1}"
FAIL=0

ok() { echo "  OK  $1"; }
bad() { echo "  FAIL $1"; FAIL=$((FAIL + 1)); }

echo "=== judge:agency · $ORIGIN ==="

echo "1) Free demo"
code=$(curl -sS -o /tmp/keryx-demo.json -w "%{http_code}" \
  "$ORIGIN/api/demo?toolId=crypto.price")
if [ "$code" = "200" ] && python3 -c 'import json; json.load(open("/tmp/keryx-demo.json"))' 2>/dev/null; then
  ok "GET /api/demo → 200 JSON"
else
  bad "GET /api/demo → HTTP $code"
fi

echo "2) Unpaid call expects 402"
code=$(curl -sS -o /tmp/keryx-402.json -w "%{http_code}" \
  -X POST "$ORIGIN/api/call" \
  -H "content-type: application/json" \
  -H "x-keryx-agent: judge-agency-smoke" \
  -d '{"toolId":"crypto.price","args":{"ids":"bitcoin"}}')
if [ "$code" = "402" ]; then
  ok "POST /api/call unpaid → 402"
else
  bad "POST /api/call unpaid → HTTP $code (want 402)"
fi

echo "3) Receipt verify R5"
code=$(curl -sS -o /tmp/keryx-r5.json -w "%{http_code}" \
  -X POST "$ORIGIN/api/receipt/verify" \
  -H "content-type: application/json" \
  -d "{\"txHash\":\"$PROOF_TX\"}")
tier=$(python3 -c 'import json; print(json.load(open("/tmp/keryx-r5.json")).get("tier",""))' 2>/dev/null || echo "")
if [ "$code" = "200" ] && [ "$tier" = "R5" ]; then
  ok "POST /api/receipt/verify → tier R5"
else
  bad "POST /api/receipt/verify → HTTP $code tier=$tier (want R5)"
fi

echo "4) for-judges page"
code=$(curl -sS -o /dev/null -w "%{http_code}" "$ORIGIN/for-judges")
if [ "$code" = "200" ]; then
  ok "GET /for-judges → 200"
else
  bad "GET /for-judges → HTTP $code"
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "=== PASS · agency surfaces green ==="
  echo "Full wallet pay: curl -O $ORIGIN/quickstart.ts && npx tsx quickstart.ts"
  exit 0
fi
echo "=== FAIL · $FAIL check(s) ==="
exit 1
