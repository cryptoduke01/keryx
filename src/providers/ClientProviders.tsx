"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";
import { arcTestnet } from "@/lib/chains";

const chains = [arcTestnet] as const;

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
      })
    );
  }
  return list;
}

const wagmiConfig = createConfig({
  chains,
  connectors: makeConnectors(),
  transports: { [arcTestnet.id]: http() },
  storage: createStorage({
    key: "keryx.arc.v1",
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
