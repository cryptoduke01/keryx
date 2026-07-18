import { defineChain, type Chain } from "viem";

/** Arc network selector for UI + settlement. */
export type ArcNetworkId = "testnet" | "mainnet";

export type ArcNetworkProfile = {
  id: ArcNetworkId;
  /** Human label for UI */
  label: string;
  /** viem chain */
  chain: Chain;
  /** CAIP-2 eip155:… */
  caip2: `eip155:${number}`;
  /** ERC-20 / native USDC contract used in x402 accepts */
  usdcAddress: `0x${string}`;
  usdcDecimals: number;
  explorerTx: (txHash: string) => string;
  explorerAddress: (addr: string) => string;
  /** Settlement can run against this network right now */
  ready: boolean;
  /** Why not ready (shown in UI) */
  notReadyReason?: string;
};

export const ARC_USDC_DECIMALS = 6;

/** Circle Arc testnet. USDC-native gas, chain ID 5042002. */
export const arcTestnet: Chain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ARC_RPC_URL ??
          process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL ??
          "https://rpc.testnet.arc.network",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/**
 * Arc mainnet (beta when Circle publishes).
 * Only enabled when NEXT_PUBLIC_ARC_MAINNET_READY=true and chain id + USDC are set.
 * Official public mainnet params were not published as of mid-2026 — keep env-driven.
 */
const mainnetChainId = Number(
  process.env.NEXT_PUBLIC_ARC_MAINNET_CHAIN_ID ?? "0",
);
const mainnetRpc =
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL?.trim() ||
  "https://rpc.mainnet.arc.network";
const mainnetExplorer =
  process.env.NEXT_PUBLIC_ARC_MAINNET_EXPLORER?.trim() ||
  "https://arcscan.app";
const mainnetUsdc = (process.env.NEXT_PUBLIC_ARC_MAINNET_USDC?.trim() ||
  "0x3600000000000000000000000000000000000000") as `0x${string}`;
const mainnetReadyFlag =
  process.env.NEXT_PUBLIC_ARC_MAINNET_READY === "true" ||
  process.env.NEXT_PUBLIC_ARC_MAINNET_READY === "1";

export const arcMainnet: Chain = defineChain({
  id: Number.isFinite(mainnetChainId) && mainnetChainId > 0 ? mainnetChainId : 1,
  name: "Arc Mainnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [mainnetRpc],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: mainnetExplorer,
    },
  },
  testnet: false,
});

/** ERC-20 USDC on Arc testnet (6 decimals). Native gas token address used by x402. */
export const ARC_TESTNET_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

/** @deprecated Prefer getActiveArcNetwork().usdcAddress */
export const ARC_USDC_ADDRESS = ARC_TESTNET_USDC_ADDRESS;

const TESTNET_PROFILE: ArcNetworkProfile = {
  id: "testnet",
  label: "Arc Testnet",
  chain: arcTestnet,
  caip2: "eip155:5042002",
  usdcAddress: ARC_TESTNET_USDC_ADDRESS,
  usdcDecimals: ARC_USDC_DECIMALS,
  explorerTx: (h) => `https://testnet.arcscan.app/tx/${h}`,
  explorerAddress: (a) => `https://testnet.arcscan.app/address/${a}`,
  ready: true,
};

const MAINNET_CONFIGURED =
  mainnetReadyFlag &&
  Number.isFinite(mainnetChainId) &&
  mainnetChainId > 0 &&
  Boolean(process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL?.trim());

const MAINNET_PROFILE: ArcNetworkProfile = {
  id: "mainnet",
  label: "Arc Mainnet",
  chain: arcMainnet,
  caip2: `eip155:${MAINNET_CONFIGURED ? mainnetChainId : 0}`,
  usdcAddress: mainnetUsdc,
  usdcDecimals: ARC_USDC_DECIMALS,
  explorerTx: (h) => `${mainnetExplorer.replace(/\/$/, "")}/tx/${h}`,
  explorerAddress: (a) =>
    `${mainnetExplorer.replace(/\/$/, "")}/address/${a}`,
  ready: MAINNET_CONFIGURED,
  notReadyReason: MAINNET_CONFIGURED
    ? undefined
    : "Arc mainnet not public yet — set NEXT_PUBLIC_ARC_MAINNET_READY + chain id + RPC when Circle publishes",
};

export function getArcNetworkProfile(id: ArcNetworkId): ArcNetworkProfile {
  return id === "mainnet" ? MAINNET_PROFILE : TESTNET_PROFILE;
}

export function listArcNetworks(): ArcNetworkProfile[] {
  return [TESTNET_PROFILE, MAINNET_PROFILE];
}

/**
 * Active settlement network.
 * Priority: explicit env NEXT_PUBLIC_ARC_NETWORK → default testnet.
 * Mainnet only if ready; otherwise falls back to testnet.
 */
export function getActiveArcNetwork(): ArcNetworkProfile {
  const raw = (
    process.env.NEXT_PUBLIC_ARC_NETWORK ??
    process.env.ARC_NETWORK ??
    "testnet"
  )
    .trim()
    .toLowerCase();
  if (raw === "mainnet") {
    if (MAINNET_PROFILE.ready) return MAINNET_PROFILE;
    return TESTNET_PROFILE;
  }
  return TESTNET_PROFILE;
}

/** Cookie / localStorage key for client preference (when mainnet is ready). */
export const ARC_NETWORK_STORAGE_KEY = "keryx.arc.network";

/** Treasury wallet — receives platform fees + seeds the demo. */
export const KERYX_TREASURY_ADDRESS =
  (process.env.NEXT_PUBLIC_KERYX_TREASURY_ADDRESS ??
    "0x8F47aE9eC148903C8535b9289ad8efA400e026B6") as `0x${string}`;

/** Platform take rate on every paid call, in basis points. */
export const PLATFORM_FEE_BPS = 500; // 5%

export function formatUsdc(units: bigint): string {
  const whole = units / BigInt(10) ** BigInt(ARC_USDC_DECIMALS);
  const frac = units % BigInt(10) ** BigInt(ARC_USDC_DECIMALS);
  const fracStr = frac.toString().padStart(ARC_USDC_DECIMALS, "0").slice(0, 6);
  return `${whole.toString()}.${fracStr}`;
}

export function parseUsdcPrice(dollars: number): bigint {
  return BigInt(Math.round(dollars * 10 ** ARC_USDC_DECIMALS));
}
