/**
 * Agent-fleet traction runner for Lepton judges.
 *
 * Generates N buyer wallets, funds them with test USDC from the Keryx
 * facilitator, then each wallet pays POST /api/call via manual EIP-3009
 * (matches our x402Version: 1 wire format).
 *
 *   npx tsx scripts/fleet-traction.ts
 *
 * Wallets → .local/fleet-wallets.json (gitignored)
 * Results → .local/fleet-results.json
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  bytesToHex,
  type Address,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import { arcTestnet, ARC_USDC_ADDRESS } from "../src/lib/chains";

const ORIGIN = process.env.KERYX_ORIGIN ?? "https://keryxhq.xyz";
const FLEET_SIZE = Math.max(1, Math.min(10, Number(process.env.FLEET_SIZE ?? 5)));
const FUND_USDC = Number(process.env.FLEET_FUND_USDC ?? 0.05);
const WALLET_PATH = resolve(process.cwd(), ".local/fleet-wallets.json");

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 value) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
]);

const DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: arcTestnet.id,
  verifyingContract: ARC_USDC_ADDRESS as Address,
} as const;

const TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

interface FleetWallet {
  id: string;
  address: Address;
  privateKey: Hex;
}

interface Accepts {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
}

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function loadOrCreateFleet(): FleetWallet[] {
  mkdirSync(resolve(process.cwd(), ".local"), { recursive: true });
  if (existsSync(WALLET_PATH)) {
    const existing = JSON.parse(readFileSync(WALLET_PATH, "utf8")) as FleetWallet[];
    if (existing.length >= FLEET_SIZE) return existing.slice(0, FLEET_SIZE);
  }
  const wallets: FleetWallet[] = [];
  for (let i = 1; i <= FLEET_SIZE; i++) {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    wallets.push({
      id: `fleet-agent-${String(i).padStart(2, "0")}`,
      address: account.address,
      privateKey,
    });
  }
  writeFileSync(WALLET_PATH, JSON.stringify(wallets, null, 2));
  console.log(`Wrote ${wallets.length} wallets → ${WALLET_PATH}`);
  return wallets;
}

async function fundWallets(funderPk: Hex, wallets: FleetWallet[]) {
  const funder = privateKeyToAccount(funderPk);
  const pub = createPublicClient({ chain: arcTestnet, transport: http() });
  const wallet = createWalletClient({
    account: funder,
    chain: arcTestnet,
    transport: http(),
  });
  const amount = BigInt(Math.round(FUND_USDC * 1_000_000));

  console.log(`Funder ${funder.address} → ${FUND_USDC} USDC each`);
  for (const w of wallets) {
    const bal = await pub.readContract({
      address: ARC_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [w.address],
    });
    if (bal >= amount) {
      console.log(`  ${w.id} already funded (${Number(bal) / 1e6} USDC)`);
      continue;
    }
    const hash = await wallet.writeContract({
      address: ARC_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [w.address, amount],
    });
    console.log(`  funded ${w.id} ${w.address} tx=${hash}`);
    await pub.waitForTransactionReceipt({ hash });
  }
}

async function signPayment(w: FleetWallet, accepts: Accepts) {
  const account = privateKeyToAccount(w.privateKey);
  const wallet = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });
  const now = Math.floor(Date.now() / 1000);
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const auth = {
    from: account.address,
    to: accepts.payTo as Address,
    value: BigInt(accepts.amount),
    validAfter: 0n,
    validBefore: BigInt(now + 3600),
    nonce,
  };
  const signature = await wallet.signTypedData({
    account,
    domain: DOMAIN,
    types: TYPES,
    primaryType: "TransferWithAuthorization",
    message: auth,
  });
  return {
    x402Version: 1,
    scheme: "exact",
    network: accepts.network,
    payload: {
      authorization: {
        from: auth.from,
        to: auth.to,
        value: auth.value.toString(),
        validAfter: auth.validAfter.toString(),
        validBefore: auth.validBefore.toString(),
        nonce: auth.nonce,
      },
      signature,
    },
  };
}

async function paidCall(w: FleetWallet, toolId: string, args: Record<string, unknown>) {
  const body = { toolId, args };
  const headersBase = {
    "content-type": "application/json",
    "x-keryx-agent": w.id,
  };

  const first = await fetch(`${ORIGIN}/api/call`, {
    method: "POST",
    headers: headersBase,
    body: JSON.stringify(body),
  });
  const challenge = (await first.json()) as {
    accepts?: Accepts[];
    error?: string;
  };
  if (first.status !== 402 || !challenge.accepts?.[0]) {
    return {
      agent: w.id,
      toolId,
      http: first.status,
      ok: false,
      error: `expected_402_got_${first.status}`,
    };
  }

  const payment = await signPayment(w, challenge.accepts[0]);
  const xPayment = encodePaymentSignatureHeader(payment);

  const res = await fetch(`${ORIGIN}/api/call`, {
    method: "POST",
    headers: {
      ...headersBase,
      "x-payment": xPayment,
    },
    body: JSON.stringify(body),
  });
  const result = (await res.json()) as {
    ok?: boolean;
    ledgerEntry?: { id: string };
    settlement?: { txHash?: string; mode?: string };
    error?: string;
    reason?: string;
  };

  let receipt: unknown = null;
  if (result.ledgerEntry?.id) {
    const v = await fetch(`${ORIGIN}/api/receipt/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: result.ledgerEntry.id }),
    });
    receipt = await v.json();
  }

  return {
    agent: w.id,
    toolId,
    http: res.status,
    ok: Boolean(result.ok),
    ledgerId: result.ledgerEntry?.id,
    txHash: result.settlement?.txHash,
    mode: result.settlement?.mode,
    error: result.error ?? result.reason,
    receipt,
  };
}

async function main() {
  loadEnvLocal();
  const raw = process.env.KERYX_FACILITATOR_PRIVATE_KEY;
  if (!raw) throw new Error("KERYX_FACILITATOR_PRIVATE_KEY missing in .env.local");
  const funderPk = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;

  const wallets = loadOrCreateFleet();
  await fundWallets(funderPk, wallets);

  const jobs: { toolId: string; args: Record<string, unknown> }[] = [
    { toolId: "crypto.price", args: { ids: "bitcoin,ethereum" } },
    { toolId: "time.current", args: {} },
    { toolId: "utility.uuid", args: {} },
    { toolId: "demo.content-block", args: { topic: "what is x402" } },
  ];

  const results: Awaited<ReturnType<typeof paidCall>>[] = [];
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < wallets.length; i++) {
      const job = jobs[(round + i) % jobs.length]!;
      const w = wallets[i]!;
      console.log(`\n→ ${w.id} pays ${job.toolId}`);
      try {
        const r = await paidCall(w, job.toolId, job.args);
        results.push(r);
        console.log(
          `  http=${r.http} ok=${r.ok} mode=${r.mode ?? "-"} tx=${r.txHash?.slice(0, 18) ?? r.error ?? "-"}`,
        );
        if (r.receipt && typeof r.receipt === "object" && "tier" in r.receipt) {
          console.log(`  receipt tier=${(r.receipt as { tier: string }).tier}`);
        }
      } catch (err) {
        console.error(`  FAIL`, err instanceof Error ? err.message : err);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  const summaryPath = resolve(process.cwd(), ".local/fleet-results.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  const paid = results.filter((r) => r.ok && r.txHash?.startsWith("0x"));
  console.log(`\n=== DONE ${paid.length}/${results.length} onchain paid ===`);
  console.log(`Results → ${summaryPath}`);
  for (const r of paid) {
    console.log(
      `- ${r.agent} ${r.toolId} https://testnet.arcscan.app/tx/${r.txHash}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
