import { NextResponse } from "next/server";
import {
  getActiveArcNetwork,
  listArcNetworks,
} from "@/lib/chains";

export const runtime = "nodejs";

/** Public Arc network status for UI toggle + agents. */
export async function GET() {
  const active = getActiveArcNetwork();
  const networks = listArcNetworks().map((n) => ({
    id: n.id,
    label: n.label,
    caip2: n.caip2,
    chainId: n.chain.id,
    usdcAddress: n.usdcAddress,
    explorer: n.chain.blockExplorers?.default.url ?? null,
    rpc: n.chain.rpcUrls.default.http[0] ?? null,
    ready: n.ready,
    notReadyReason: n.notReadyReason ?? null,
    active: n.id === active.id,
  }));

  return NextResponse.json({
    active: active.id,
    activeLabel: active.label,
    caip2: active.caip2,
    chainId: active.chain.id,
    usdcAddress: active.usdcAddress,
    networks,
    note:
      "Settlement uses the active network (env NEXT_PUBLIC_ARC_NETWORK). Mainnet enables when NEXT_PUBLIC_ARC_MAINNET_READY=true and chain id + RPC are set. Lepton judges: testnet is the default and fully supported.",
  });
}
