import type { Metadata } from "next";
import { Geist, Fraunces, JetBrains_Mono } from "next/font/google";
import ClientProviders from "@/providers/ClientProviders";
import Header from "@/components/Header";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kēryx — the paid tool registry for AI agents",
  description:
    "Any developer publishes a tool. Any AI agent pays to use it. Sub-cent USDC payments settle on Arc in under half a second. Kēryx is the herald for agent-payable software.",
  metadataBase: new URL("https://keryx.dev"),
  openGraph: {
    title: "Kēryx — the paid tool registry for AI agents",
    description:
      "Any developer publishes a tool. Any AI agent pays to use it. Sub-cent USDC on Arc.",
    url: "https://keryx.dev",
    siteName: "Kēryx",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kēryx",
    description: "The paid tool registry for AI agents.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${jetbrains.variable}`}
    >
      <body style={{ minHeight: "100vh" }}>
        <ClientProviders>
          <Header />
          <main style={{ paddingTop: 56 }}>{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
