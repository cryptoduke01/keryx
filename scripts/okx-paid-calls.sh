#!/usr/bin/env bash
# Seed paid volume on live OKX ASP endpoints via Agentic Wallet (onchainos).
# Usage: bash scripts/okx-paid-calls.sh
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"

if ! command -v onchainos >/dev/null 2>&1; then
  echo "onchainos not found in PATH"
  exit 1
fi

pay_call() {
  local name="$1"
  local url="$2"
  local http_code rcode
  echo ""
  echo "========== $name =========="

  curl -sS -D /tmp/h402.txt -o /tmp/b402.json "$url" \
    -H "Accept: application/json" \
    -H "User-Agent: OKX-A2MCP-Client/1.0" || true

  http_code=$(head -1 /tmp/h402.txt | awk '{print $2}')
  echo "HTTP $http_code"
  if [ "$http_code" != "402" ]; then
    echo "SKIP expected 402"; head -c 200 /tmp/b402.json; echo; return 1
  fi

  PR=$(awk -F': ' 'tolower($1)=="payment-required"{print $2}' /tmp/h402.txt | tr -d '\r')
  [ -n "$PR" ] || { echo "no PAYMENT-REQUIRED"; return 1; }

  PAY_OUT=$(onchainos payment pay --payload "$PR" --chain xlayer 2>&1) || {
    echo "PAY FAIL: $PAY_OUT"; return 1
  }
  AUTH=$(printf '%s' "$PAY_OUT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["authorization_header"])')
  HNAME=$(printf '%s' "$PAY_OUT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["header_name"])')

  sleep 1
  curl -sS -D /tmp/hreplay.txt -o /tmp/breplay.json "$url" \
    -H "Accept: application/json" \
    -H "$HNAME: $AUTH"

  rcode=$(head -1 /tmp/hreplay.txt | awk '{print $2}')
  echo "REPLAY HTTP $rcode"
  PRESP=$(awk -F': ' 'tolower($1)=="payment-response"{print $2}' /tmp/hreplay.txt | tr -d '\r' || true)
  if [ -n "${PRESP:-}" ]; then
    printf '%s' "$PRESP" | python3 -c '
import json,sys,base64
raw=sys.stdin.read().strip()
pad="="*((4-len(raw)%4)%4)
d=json.loads(base64.b64decode(raw.replace("-","+").replace("_","/")+pad))
print("SETTLE status=%s success=%s tx=%s" % (d.get("status"), d.get("success"), d.get("transaction")))
' 2>/dev/null || true
  fi
  head -c 260 /tmp/breplay.json; echo
  [ "$rcode" = "200" ] && echo ">>> OK $name" && return 0
  echo ">>> FAIL $name"; return 1
}

OKN=0; FAILN=0
pay_call "crypto-price" "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=bitcoin" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "okx-token-price" "https://keryxhq.xyz/api/okxasp/tools/okx-token-price?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "finance-exchange-rates" "https://keryxhq.xyz/api/okxasp/tools/finance-exchange-rates?base=usd" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "solana-launches" "https://keryxhq.xyz/api/okxasp/tools/solana-launches?limit=3" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "okx-token-market" "https://keryxhq.xyz/api/okxasp/tools/okx-token-market?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "solana-rug-check" "https://keryxhq.xyz/api/okxasp/tools/solana-rug-check?mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "crypto-price-2" "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=ethereum,solana" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))
pay_call "okx-wallet-pnl" "https://keryxhq.xyz/api/okxasp/tools/okx-wallet-pnl?wallet=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chain=ethereum" && OKN=$((OKN+1)) || FAILN=$((FAILN+1))

echo ""
echo "========== SUMMARY OK=$OKN FAIL=$FAILN =========="
onchainos wallet balance --chain xlayer --force 2>&1 | python3 -c 'import json,sys
d=json.load(sys.stdin)["data"]["details"][0]["tokenAssets"]
for t in d: print("%s: %s" % (t["symbol"], t["balance"]))'
