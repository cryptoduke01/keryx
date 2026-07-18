"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";
import { arcTestnet, listArcNetworks } from "@/lib/chains";

const readyChains = listArcNetworks()
  .filter((n) => n.ready)
  .map((n) => n.chain);
const chains =
  readyChains.length > 0
    ? (readyChains as [typeof arcTestnet, ...typeof readyChains])
    : ([arcTestnet] as const);

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

function makeConnectors() {
  const list = [
    metaMask(),
    injected({ target: "rabby" }),
    injected({ target: "okxWallet" }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Keryx" }),
  ];
  if (walletConnectProjectId) {
    list.push(
      walletConnect({
        projectId: walletConnectProjectId,
        metadata: {
          name: "Keryx",
          description: "The paid tool registry for AI agents",
          url: "https://keryxhq.xyz",
          icons: ["https://keryxhq.xyz/logo.png"],
        },
        showQrModal: true,
      }),
    );
  }
  return list;
}

const transports = Object.fromEntries(
  chains.map((c) => [
    c.id,
    http(c.rpcUrls.default.http[0] ?? "https://rpc.testnet.arc.network"),
  ]),
) as Record<number, ReturnType<typeof http>>;

const wagmiConfig = createConfig({
  chains,
  connectors: makeConnectors(),
  transports,
  storage: createStorage({
    key: "keryx.arc.v2",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
