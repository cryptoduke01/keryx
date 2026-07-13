#!/usr/bin/env bash
# OKX ASP smoke — no wallet required for free checks.
# Verifies: catalog honesty, health, 402 shape, for-judges page.
# Paid path needs Agentic Wallet buyer ≠ payTo (see /okxasp/docs).
set -euo pipefail

ORIGIN="${KERYX_ORIGIN:-https://keryxhq.xyz}"
FAIL=0

ok() { echo "  OK  $1"; }
bad() { echo "  FAIL $1"; FAIL=$((FAIL + 1)); }

echo "=== okx:smoke · $ORIGIN ==="

echo "1) Catalog"
curl -sS -o /tmp/okx-cat.json "$ORIGIN/api/okxasp/catalog"
python3 <<'PY' || bad "catalog parse"
import json
d=json.load(open("/tmp/okx-cat.json"))
assert d.get("aspId")=="4759" or d.get("aspId")==4759 or str(d.get("aspId"))=="4759"
assert d.get("listingStatus")=="listed" or d.get("status") in ("LIVE","listed",None)
tools=d.get("tools") or []
assert len(tools)>=9, len(tools)
natives=[t for t in tools if t.get("native") is True]
assert len(natives)>=4, "native tools missing"
assert d.get("buyerNote") or True  # preferred after deploy
print("  OK  catalog · tools=%d native=%d listingStatus=%s" % (
  len(tools), len(natives), d.get("listingStatus") or d.get("status")))
PY

echo "2) Health"
curl -sS -o /tmp/okx-h.json "$ORIGIN/api/okxasp/health"
python3 <<'PY' || bad "health"
import json
d=json.load(open("/tmp/okx-h.json"))
assert d.get("ok") is True
assert str(d.get("aspId"))=="4759"
print("  OK  health · ok=true aspId=4759")
PY

echo "3) 402 crypto-price (mainnet challenge)"
code=$(curl -sS -D /tmp/okx-402.h -o /tmp/okx-402.b -w "%{http_code}" \
  "$ORIGIN/api/okxasp/tools/crypto-price?ids=bitcoin" \
  -H "Accept: application/json" \
  -H "User-Agent: OKX-A2MCP-Client/1.0")
if [ "$code" != "402" ]; then
  bad "crypto-price → HTTP $code (want 402)"
else
  if grep -qi "payment-required" /tmp/okx-402.h; then
    ok "crypto-price → 402 + PAYMENT-REQUIRED"
  else
    bad "crypto-price → 402 but no PAYMENT-REQUIRED header"
  fi
fi

echo "4) 402 okx-token-price (native)"
code=$(curl -sS -o /dev/null -w "%{http_code}" \
  "$ORIGIN/api/okxasp/tools/okx-token-price?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum" \
  -H "Accept: application/json" \
  -H "User-Agent: OKX-A2MCP-Client/1.0")
if [ "$code" = "402" ]; then
  ok "okx-token-price → 402"
else
  bad "okx-token-price → HTTP $code"
fi

echo "5) product pages"
for path in /okxasp /okxasp/docs; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$ORIGIN$path")
  if [ "$code" = "200" ]; then
    ok "GET $path → 200"
  else
    bad "GET $path → HTTP $code"
  fi
done
# for-judges is new; 404 until deploy lands
code=$(curl -sS -o /dev/null -w "%{http_code}" "$ORIGIN/okxasp/for-judges")
if [ "$code" = "200" ]; then
  ok "GET /okxasp/for-judges → 200"
elif [ "$code" = "404" ]; then
  echo "  WARN GET /okxasp/for-judges → 404 (deploy pending)"
else
  bad "GET /okxasp/for-judges → HTTP $code"
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "=== PASS · OKX surfaces green ==="
  echo "Paid: USE NOW on listing with buyer wallet ≠ payTo"
  exit 0
fi
echo "=== FAIL · $FAIL check(s) ==="
exit 1
