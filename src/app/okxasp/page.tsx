import Link from "next/link";
import Image from "next/image";
import ArtPanel from "@/components/ArtPanel";
import Reveal from "@/components/motion/Reveal";
import {
  listOkxAspTools,
  priceUsdToOkxPrice,
  slugForToolId,
} from "@/lib/okxasp/config";

export const metadata = {
  title: "Finance Copilot · Kēryx on OKX.AI",
  description:
    "Pay-per-call market intel for AI agents on OKX.AI. Live prices, token risk, and FX on X Layer.",
};

/** Short consumer copy. Registry summaries stay agent-oriented. */
const BLURBS: Record<string, string> = {
  "crypto.price": "Live price, market cap, and 24h change for any coin.",
  "crypto.trending": "What the market is searching right now.",
  "crypto.btc-dominance": "BTC and ETH dominance plus total market cap.",
  "solana.token-activity": "DEX volume, liquidity, and buy/sell flow for a Solana token.",
  "solana.rug-check": "Risk score, LP lock, and flagged issues from rugcheck.xyz.",
  "solana.launches": "Fresh Solana token profiles as they hit the board.",
  "finance.convert": "Convert an amount between currencies at live rates.",
  "finance.exchange-rates": "Full rate table for any base currency.",
};

const ASP_ID = "4759";

export default function OkxAspPage() {
  const tools = listOkxAspTools();

  return (
    <>
      <section
        style={{
          position: "relative",
          height: "min(72vh, 680px)",
          minHeight: 440,
          overflow: "hidden",
        }}
      >
        <Image
          src="/inspo/ask-hero.png"
          alt=""
          fill
          priority
          className="art-photo"
          sizes="100vw"
        />
        <div className="art-photo-tint" />
        <div className="art-grain" />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,11,12,0.2) 0%, rgba(11,11,12,0.55) 50%, rgba(11,11,12,0.96) 96%), linear-gradient(100deg, rgba(11,11,12,0.75) 0%, rgba(11,11,12,0.4) 42%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 76,
            left: 0,
            right: 0,
            zIndex: 2,
          }}
        >
          <div className="container-page" style={{ padding: "0 20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(11,11,12,0.5)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <span
                className="animate-gold-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                }}
              />
              OKX.AI · ASP #{ASP_ID}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            paddingBottom: 48,
          }}
        >
          <div className="container-page">
            <Reveal immediate>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                  fontWeight: 500,
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                  color: "#f5f4f0",
                  marginBottom: 16,
                  maxWidth: 640,
                  textShadow:
                    "0 2px 24px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                Finance Copilot for agents.
              </h1>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "rgba(245,244,240,0.78)",
                  maxWidth: 480,
                  marginBottom: 24,
                  textShadow: "0 1px 12px rgba(0,0,0,0.7)",
                }}
              >
                Live prices, token risk, and FX. Agents pay per call on X Layer
                and get the answer in one shot.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <a href="https://okx.ai" target="_blank" rel="noreferrer" style={btnHeroPrimary}>
                  Browse on OKX.AI
                </a>
                <Link href="/okxasp/docs" style={btnHeroGhost}>
                  Docs
                </Link>
                <a href="/api/okxasp/catalog" style={btnHeroGhost}>
                  Catalog API
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div
        className="container-page"
        style={{ paddingTop: 40, paddingBottom: 96 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 1,
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 56,
          }}
        >
          <Stat label="Type" value="A2MCP" />
          <Stat label="Tools" value={String(tools.length)} />
          <Stat label="Settlement" value="X Layer" />
          <Stat label="Asset" value="USDT0" />
        </div>

        <div
          className="okxasp-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.88fr)",
            gap: 40,
            marginBottom: 64,
            alignItems: "start",
          }}
        >
          <section>
            <div className="text-eyebrow" style={{ marginBottom: 12 }}>
              The pack
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 2.5vw, 1.85rem)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                margin: "0 0 12px",
              }}
            >
              Eight tools. Pay only when you call.
            </h2>
            <p style={{ ...body, marginBottom: 28 }}>
              Each endpoint returns HTTP 402 until the agent pays. After
              settlement on X Layer, the data comes back as JSON.
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tools.map((tool) => {
                const slug = slugForToolId(tool.id)!;
                return (
                  <a
                    key={tool.id}
                    href={`/api/okxasp/tools/${slug}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 16,
                      padding: "18px 0",
                      borderBottom: "1px solid var(--border)",
                      alignItems: "start",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: 4,
                          fontFamily: "var(--font-display)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {tool.name}
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          color: "var(--text-secondary)",
                          lineHeight: 1.55,
                        }}
                      >
                        {BLURBS[tool.id] ?? tool.summary}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {priceUsdToOkxPrice(tool.priceUsd)}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <aside>
            <div style={{ position: "sticky", top: 88 }} className="okxasp-aside">
              <ArtPanel
                src="/inspo/pitch-cover.jpg"
                alt="Kēryx market atmosphere"
                aspectRatio="4 / 5"
                position="50% 30%"
                variant="raw"
                overlayText="MARKET INTEL AT MACHINE SPEED."
              />
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <Link href="/okxasp/docs" style={btnSoft}>
                  Integration docs
                </Link>
                <Link href="/okxasp/whitepaper" style={btnSoft}>
                  Product note
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <section
          style={{
            paddingTop: 40,
            borderTop: "1px solid var(--border)",
            maxWidth: 560,
          }}
        >
          <div className="text-eyebrow" style={{ marginBottom: 12 }}>
            How it works
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.35rem, 2vw, 1.6rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Call. Pay. Read.
          </h2>
          <ol style={{ ...body, paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 10 }}>
              Point your agent at a tool URL or the{" "}
              <a href="/api/okxasp/catalog" style={link}>
                catalog
              </a>
              .
            </li>
            <li style={{ marginBottom: 10 }}>
              First hit returns 402 with the price in USDT0 on X Layer.
            </li>
            <li>
              Agentic Wallet pays. Retry. You get the JSON result.
            </li>
          </ol>
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 960px) {
              .okxasp-split { grid-template-columns: 1fr !important; }
              .okxasp-aside { position: static !important; }
            }
          `,
        }}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "16px 18px", background: "var(--surface-1)" }}>
      <div
        className="text-eyebrow"
        style={{ marginBottom: 6, color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const body: React.CSSProperties = {
  fontSize: 14.5,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  margin: 0,
};

const link: React.CSSProperties = {
  color: "var(--text-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

const btnHeroPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  padding: "0 18px",
  borderRadius: 8,
  background: "#f5f4f0",
  color: "#0b0b0c",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const btnHeroGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 40,
  padding: "0 18px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(11,11,12,0.35)",
  backdropFilter: "blur(6px)",
  color: "#f5f4f0",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const btnSoft: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  padding: "0 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};
