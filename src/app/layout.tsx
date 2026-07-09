import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import ClientProviders from "@/providers/ClientProviders";
import Header from "@/components/Header";
import "./globals.css";

/** Body / nav / labels — the sans half of Obscura's actual pairing
 *  (Plus Jakarta Sans + Dirtyline 36 Days of Type). Free on Google Fonts. */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Headlines — one confident serif per page, non-italic, Vantage-direction. */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

/** Wordmark only — the swashy editorial italic seen in the Obscura lockup.
 *  Reserved for the logotype and rare single-word emphasis, never body text. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keryx · The toll booth for the agent economy",
  description:
    "Any developer publishes a tool. Any AI agent pays to use it. Sub-cent USDC settles on Arc in under half a second. Keryx is the toll booth for the agent economy.",
  metadataBase: new URL("https://keryxhq.xyz"),
  openGraph: {
    title: "Keryx · The toll booth for the agent economy",
    description:
      "Any developer publishes a tool. Any AI agent pays to use it. Sub-cent USDC on Arc.",
    url: "https://keryxhq.xyz",
    siteName: "Keryx",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@keryxhq",
    creator: "@keryxhq",
    title: "Keryx",
    description: "The paid tool registry for AI agents.",
  },
};

/** Runs before hydration to set data-theme without a flash of the wrong
 *  theme. Reads localStorage first, falls back to system preference. */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("keryx-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${fraunces.variable} ${instrumentSerif.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body style={{ minHeight: "100vh" }}>
        <ClientProviders>
          <Header />
          <main style={{ paddingTop: 56 }}>{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}
