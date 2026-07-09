import Link from "next/link";
import ArtPanel from "@/components/ArtPanel";

export const metadata = {
  title: "Product note · Keryx Finance Copilot",
  description:
    "Why Keryx ships a Finance Copilot ASP on OKX.AI: pay-per-call market intel for agents on X Layer.",
};

export default function OkxAspWhitepaperPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 320px)",
          gap: 40,
          alignItems: "start",
        }}
        className="okx-wp-grid"
      >
        <article style={{ maxWidth: 640 }}>
          <div className="text-eyebrow" style={{ marginBottom: 12 }}>
            OKX.AI · Product note
          </div>
          <h1 className="text-headline" style={{ marginBottom: 16 }}>
            Market data should cost a call, not a subscription.
          </h1>
          <p style={p}>
            Agents do not need another dashboard. They need a few reliable
            answers, priced in the open, settled the moment they ask. That is
            what the Finance Copilot is.
          </p>

          <h2 style={h2}>The problem</h2>
          <p style={p}>
            Most market APIs assume a human with an API key and a monthly plan.
            Agents burn keys, share secrets, or scrape free endpoints that
            break under load. None of that fits a world where software pays for
            software.
          </p>

          <h2 style={h2}>The product</h2>
          <p style={p}>
            Keryx Finance Copilot is an A2MCP pack on OKX.AI. Eight tools cover
            the questions agents actually ask: price, trend, dominance, Solana
            activity, rug risk, new launches, FX convert, and rate tables. Each
            call is gated by x402. Unpaid requests get 402. Paid requests get
            JSON.
          </p>
          <p style={p}>
            Settlement runs on X Layer in USDT0 through OKX&apos;s payment
            stack. The agent never creates an account with us. Discovery lives
            on{" "}
            <a href="https://okx.ai" target="_blank" rel="noreferrer" style={a}>
              OKX.AI
            </a>
            .
          </p>

          <h2 style={h2}>Why this wins for builders</h2>
          <p style={p}>
            Publishers get a clear price per call. Agents get a clear bill per
            answer. The marketplace already has wallets, listings, and review.
            We bring the finance surface that agents keep asking for.
          </p>

          <h2 style={h2}>What ships today</h2>
          <ul style={{ ...p, paddingLeft: 18 }}>
            <li>Public HTTPS tools under /api/okxasp/tools/*</li>
            <li>Free catalog at /api/okxasp/catalog</li>
            <li>ASP #4759 listed for review on OKX.AI</li>
            <li>
              Docs at{" "}
              <Link href="/okxasp/docs" style={a}>
                /okxasp/docs
              </Link>
            </li>
          </ul>

          <p style={{ ...p, marginTop: 28 }}>
            <Link href="/okxasp" style={a}>
              Back to Finance Copilot
            </Link>
          </p>
        </article>

        <aside style={{ position: "sticky", top: 88 }} className="okx-wp-art">
          <ArtPanel
            src="/inspo/okx-note.png"
            alt=""
            aspectRatio="3 / 4"
            position="50% 40%"
            variant="raw"
            overlayText="PAY PER CALL. NO MONTHLY KEY."
          />
        </aside>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 900px) {
              .okx-wp-grid { grid-template-columns: 1fr !important; }
              .okx-wp-art { position: static !important; max-width: 360px; }
            }
          `,
        }}
      />
    </div>
  );
}

const p: React.CSSProperties = {
  fontSize: 15,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  margin: "0 0 16px",
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: "-0.015em",
  color: "var(--text-primary)",
  margin: "28px 0 12px",
};

const a: React.CSSProperties = {
  color: "var(--text-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
