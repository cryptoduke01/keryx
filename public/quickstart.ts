/**
 * Keryx buyer quickstart (TypeScript)
 *
 * Pays for one tool call on Arc testnet via x402, then prints the result.
 *
 *   npm install @x402/fetch @x402/evm viem tsx
 *   export PRIVATE_KEY=0x…          # Arc testnet wallet with test USDC
 *   npx tsx public/quickstart.ts    # or: curl -O https://keryxhq.xyz/quickstart.ts && npx tsx quickstart.ts
 *
 * Free probe first (no wallet):
 *   curl https://keryxhq.xyz/api/demo?toolId=crypto.price
 */

import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const ORIGIN = process.env.KERYX_ORIGIN ?? "https://keryxhq.xyz";
const TOOL_ID = process.env.KERYX_TOOL_ID ?? "crypto.price";
const AGENT = process.env.KERYX_AGENT ?? "quickstart-ts";
const ARGS = { ids: "bitcoin,ethereum" };

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk?.startsWith("0x")) {
    throw new Error("Set PRIVATE_KEY=0x… (Arc testnet wallet with USDC)");
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: "eip155:5042002",
        client: new ExactEvmScheme(account),
      },
    ],
  });

  console.log("Free sample…");
  const demo = await fetch(`${ORIGIN}/api/demo?toolId=${TOOL_ID}`);
  console.log("demo", demo.status, await demo.json());

  console.log("Paid call…");
  const res = await fetchWithPayment(`${ORIGIN}/api/call`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-keryx-agent": AGENT,
    },
    body: JSON.stringify({ toolId: TOOL_ID, args: ARGS }),
  });

  const body = await res.json();
  console.log("status", res.status);
  console.log(JSON.stringify(body, null, 2));

  if (body?.ledgerEntry?.id) {
    const verify = await fetch(`${ORIGIN}/api/receipt/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: body.ledgerEntry.id }),
    });
    console.log("receipt", await verify.json());
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
