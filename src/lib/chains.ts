import { defineChain, type Chain } from "viem";

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

/** ERC-20 USDC on Arc testnet (6 decimals). */
export const ARC_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

export const ARC_USDC_DECIMALS = 6;

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
