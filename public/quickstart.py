#!/usr/bin/env python3
"""
Keryx buyer quickstart (Python)

Pays for one tool call on Arc testnet via x402, then prints the result.

  pip install x402 httpx eth-account
  export PRIVATE_KEY=0x…   # Arc testnet wallet with test USDC
  python3 quickstart.py

Free probe first (no wallet):
  curl https://keryxhq.xyz/api/demo?toolId=crypto.price
"""

from __future__ import annotations

import json
import os
import sys

import httpx
from eth_account import Account
from x402.client import x402ClientSync
from x402.http import x402HTTPClientSync
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact import register_exact_evm_client

ORIGIN = os.environ.get("KERYX_ORIGIN", "https://keryxhq.xyz")
TOOL_ID = os.environ.get("KERYX_TOOL_ID", "crypto.price")
ARGS = {"ids": "bitcoin,ethereum"}


def main() -> None:
    pk = os.environ.get("PRIVATE_KEY")
    if not pk or not pk.startswith("0x"):
        raise SystemExit("Set PRIVATE_KEY=0x… (Arc testnet wallet with USDC)")

    print("Free sample…")
    demo = httpx.get(f"{ORIGIN}/api/demo", params={"toolId": TOOL_ID}, timeout=20)
    print("demo", demo.status_code, demo.text[:500])

    account = Account.from_key(pk)
    signer = EthAccountSigner(account)
    client = x402ClientSync()
    register_exact_evm_client(client, signer)
    http_client = x402HTTPClientSync(client)

    url = f"{ORIGIN}/api/call"
    body = {"toolId": TOOL_ID, "args": ARGS}
    headers = {
        "content-type": "application/json",
        "x-keryx-agent": "quickstart-py",
    }

    print("Paid call (expect 402 then retry)…")
    r = httpx.post(url, headers=headers, json=body, timeout=30)
    if r.status_code != 402:
        print("unexpected", r.status_code, r.text)
        sys.exit(1)

    payment_headers, _payload = http_client.handle_402_response(dict(r.headers), r.content)
    r2 = httpx.post(
        url,
        headers={**headers, **dict(payment_headers)},
        json=body,
        timeout=60,
    )
    print("status", r2.status_code)
    data = r2.json()
    print(json.dumps(data, indent=2)[:2000])

    ledger_id = (data.get("ledgerEntry") or {}).get("id")
    if ledger_id:
        verify = httpx.post(
            f"{ORIGIN}/api/receipt/verify",
            json={"id": ledger_id},
            timeout=20,
        )
        print("receipt", verify.json())


if __name__ == "__main__":
    main()
