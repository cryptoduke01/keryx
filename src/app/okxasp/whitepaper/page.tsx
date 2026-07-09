import Link from "next/link";
import ArtPanel from "@/components/ArtPanel";

export const metadata = {
  title: "Product note · Keryx Finance Copilot",
  description:
    "Why Keryx ships a Finance Copilot ASP on OKX.AI: pay-per-call market intel for agents on X Layer, including OKX-native data.",
};

export default function OkxAspWhitepaperPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 40, width: "100%" }}>
        <ArtPanel
          src="/inspo/okx-note.png"
          alt=""
          aspectRatio="21 / 8"
          minHeight={240}
          position="50% 42%"
          variant="neon"
          headline="Market data should cost a call, not a subscription."
          overlayText="OKX.AI · Product note"
        />
      </div>

      {/* Single column, full container width — side art removed */}
      <article style={{ maxWidth: 820 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          OKX.AI · Product note
        </div>
        <h1 className="text-headline" style={{ marginBottom: 16 }}>
          Software that pays for answers.
        </h1>
        <p style={p}>
          Agents do not need another dashboard. They need a few reliable
          answers, priced in the open, settled the moment they ask. That is the
          Finance Copilot — an A2MCP pack on OKX.AI that sells market intel per
          call on X Layer.
        </p>

        <h2 style={h2}>The problem</h2>
        <p style={p}>
          Most market APIs assume a human with an API key and a monthly plan.
          Agents burn keys, share secrets, or scrape free endpoints that break
          under load. None of that fits a world where software pays for
          software.
        </p>
        <p style={p}>
          The other failure mode is thin wrappers: take CoinGecko, slap a 402
          on it, call it an ASP. Judges and buyers can smell that. Coverage
          without proprietary data is a commodity. Settlement without a clear
          finance story is noise.
        </p>

        <h2 style={h2}>The product</h2>
        <p style={p}>
          Keryx Finance Copilot is twelve tools in one pack. Four are
          OKX-native: token price, market snapshot, wallet PnL, and recent
          per-token PnL — pulled through OKX Web3 with our seller credentials.
          The rest cover the questions agents actually ask next: global price
          and trend, BTC dominance, Solana activity, rug risk, launches, and
          FX.
        </p>
        <p style={p}>
          Each call is gated by x402. Unpaid requests get 402 with a real USDT0
          amount. Paid requests get JSON. Settlement runs on X Layer through
          OKX&apos;s payment stack. Discovery lives on{" "}
          <a
            href="https://okx.ai"
            target="_blank"
            rel="noreferrer"
            className="okx-link"
          >
            OKX.AI
          </a>
          .
        </p>

        <h2 style={h2}>Why this is not a thin wrapper</h2>
        <p style={p}>
          Public feeds are the commodity layer. The product is the pack:
          coherent finance surface, pay-per-call settlement, marketplace
          listing, and OKX-native price / market / wallet PnL that other agents
          cannot get from CoinGecko alone.
        </p>
        <ul style={{ ...p, paddingLeft: 18 }}>
          <li>
            OKX Web3 market price and snapshot — not a public scrape of the
            same ticker.
          </li>
          <li>
            Wallet PnL and recent PnL — agent-usable portfolio signal, not a
            chart UI.
          </li>
          <li>
            One catalog, one settlement rail, one ASP — so the agent does not
            hop APIs mid-task.
          </li>
          <li>
            Browser paywall that shows the real USDT0 price, plus settle-timeout
            recovery so a successful authorize still returns JSON.
          </li>
        </ul>

        <h2 style={h2}>Who it is for</h2>
        <p style={p}>
          Builders shipping agents that need market context without standing up
          their own data stack. Trading bots that should pay only when they
          ask. Research agents that need Solana risk and FX in the same pack as
          OKX wallet PnL.
        </p>

        <h2 style={h2}>What ships today</h2>
        <ul style={{ ...p, paddingLeft: 18 }}>
          <li>Public HTTPS tools under /api/okxasp/tools/*</li>
          <li>
            Four OKX Web3 tools: price, market snapshot, wallet PnL, recent PnL
          </li>
          <li>Eight coverage tools: crypto, Solana, FX</li>
          <li>Free catalog at /api/okxasp/catalog</li>
          <li>ASP #4759 on OKX.AI (listing under review)</li>
          <li>
            Live agent loop on{" "}
            <Link href="/okxasp#agent-loop" className="okx-link">
              /okxasp
            </Link>
          </li>
          <li>
            Integration docs at{" "}
            <Link href="/okxasp/docs" className="okx-link">
              /okxasp/docs
            </Link>
          </li>
        </ul>

        <h2 style={h2}>What comes next</h2>
        <p style={p}>
          Marketplace approval, then a short #okxai demo with a paid settle on
          camera. Mainnet X Layer when the seller wallet is funded for
          production. More OKX-native surfaces if the Web3 APIs stay stable
          under agent load.
        </p>

        <div
          style={{
            marginTop: 40,
            padding: 24,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
          }}
        >
          <p style={{ ...p, marginBottom: 12 }}>
            Straight to the point does not mean empty. The Copilot is a product
            page, a docs surface, a settle proof, and a pack you can call today
            on testnet.
          </p>
          <p style={{ ...p, marginBottom: 0 }}>
            <Link href="/okxasp" className="okx-link">
              Back to Finance Copilot
            </Link>
            {" · "}
            <Link href="/okxasp/docs" className="okx-link">
              Integration docs
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}

const p: React.CSSProperties = {
  fontSize: 15.5,
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  margin: "0 0 16px",
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: "-0.015em",
  color: "var(--text-primary)",
  margin: "36px 0 14px",
};
