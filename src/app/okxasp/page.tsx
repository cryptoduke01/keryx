import Link from "next/link";
import Image from "next/image";
import ArtPanel from "@/components/ArtPanel";
import Reveal from "@/components/motion/Reveal";
import OkxAgentLoop from "./OkxAgentLoop";
import {
  listOkxAspTools,
  priceUsdToOkxPrice,
  slugForToolId,
} from "@/lib/okxasp/config";

export const metadata = {
  title: "Finance Copilot · Keryx on OKX.AI",
  description:
    "Pay-per-call finance for AI agents on OKX.AI. OKX Web3 prices, wallet PnL, token risk, and FX on X Layer.",
};

/** Short consumer copy. Registry summaries stay agent-oriented. */
const BLURBS: Record<string, string> = {
  "crypto.price": "Live price, market cap, and 24h change for any coin.",
  "solana.token-activity":
    "DEX volume, liquidity, and buy/sell flow for a Solana token.",
  "solana.rug-check":
    "Risk score, LP lock, and flagged issues from rugcheck.xyz.",
  "solana.launches": "Fresh Solana token profiles as they hit the board.",
  "finance.exchange-rates": "Full rate table for any base currency.",
  "okx.token-price": "OKX Web3 USD price for any token contract.",
  "okx.token-market":
    "OKX Web3 snapshot: price, market cap, liquidity, holders.",
  "okx.wallet-pnl":
    "OKX Web3 wallet PnL: realized PnL, win rate, buy/sell flow.",
  "okx.wallet-recent-pnl": "OKX Web3 recent per-token PnL for a wallet.",
};

const ASP_ID = "4759";
/** First successful X Layer settle (facilitator returned success + tx). */
const PROOF_TX =
  "0x20a15b12c65d4813f6af197257555a0ad0e284b2d81752b581b5cb34f3369273";

const SAMPLE_JSON = `{
  "toolId": "okx.token-price",
  "result": {
    "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "chain": "ethereum",
    "priceUsd": 3241.18,
    "source": "okx-web3"
  }
}`;

export default function OkxAspPage() {
  const tools = listOkxAspTools();
  const loopTools = tools.map((t) => ({
    id: t.id,
    name: t.name,
    slug: slugForToolId(t.id)!,
    price: priceUsdToOkxPrice(t.priceUsd),
    sampleArgs: t.sampleArgs,
  }));
  const okxNative = tools.filter((t) => t.id.startsWith("okx.")).length;

  return (
    <>
      <section
        style={{
          position: "relative",
          height: "100dvh",
          minHeight: 560,
          overflow: "hidden",
        }}
      >
        <Image
          src="/inspo/okx-hero.png"
          alt=""
          fill
          priority
          className="art-photo art-photo-neon"
          sizes="100vw"
          style={{ objectPosition: "50% 42%" }}
        />
        <div className="art-photo-tint-neon" />
        <div className="art-grain" />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,11,12,0.25) 0%, rgba(11,11,12,0.5) 45%, rgba(11,11,12,0.94) 92%), linear-gradient(105deg, rgba(11,11,12,0.72) 0%, rgba(11,11,12,0.35) 40%, transparent 68%)",
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
              Finance Copilot · ASP #{ASP_ID} · LIVE on OKX.AI
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "38%",
            transform: "translateY(-18%)",
            zIndex: 2,
            paddingBottom: 32,
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
                  maxWidth: 680,
                  textShadow:
                    "0 2px 24px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                Finance Copilot for agents.<br />Live on OKX.AI.
              </h1>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "rgba(245,244,240,0.78)",
                  maxWidth: 520,
                  marginBottom: 24,
                  textShadow: "0 1px 12px rgba(0,0,0,0.7)",
                }}
              >
                OKX Web3 prices, wallet PnL, token risk, and FX. Agents pay per
                call on X Layer and get the answer in one shot.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <a href="#agent-loop" style={btnHeroPrimary}>
                  Try the agent loop
                </a>
                <Link href="/okxasp/docs" style={btnHeroGhost}>
                  Docs
                </Link>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 1,
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 56,
          }}
        >
          <Stat label="Track" value="Finance" />
          <Stat label="Type" value="A2MCP" />
          <Stat label="Tools" value={String(tools.length)} />
          <Stat label="OKX-native" value={String(okxNative)} />
          <Stat label="Settlement" value="X Layer" />
          <Stat label="Asset" value="USDT0" />
        </div>

        <div style={{
          margin: "0 0 40px",
          padding: "14px 18px",
          background: "rgba(184,255,60,0.08)",
          border: "1px solid rgba(184,255,60,0.3)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <span style={{fontWeight: 700, color: "#b8ff3c"}}>● NOW LIVE</span>
          <span>Search "Keryx Finance Copilot" on OKX.AI or go to</span>
          <a href="https://okx.ai/agents/4759" target="_blank" rel="noopener noreferrer" style={{color: "#b8ff3c", fontWeight: 600, textDecoration: "underline"}}>okx.ai/agents/4759</a>
        </div>

        <div id="agent-loop" style={{ marginBottom: 40 }}>
          <OkxAgentLoop tools={loopTools} />
        </div>

        <section
          style={{
            marginBottom: 64,
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
          }}
        >
          <div className="text-eyebrow" style={{ marginBottom: 10 }}>
            What you get back
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Paid call → JSON. No dashboard scrape.
          </h2>
          <p style={{ ...body, marginBottom: 14, maxWidth: 640 }}>
            Example response from{" "}
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                color: "var(--text-primary)",
              }}
            >
              /api/okxasp/tools/okx-token-price
            </code>{" "}
            after settle. Primary listing endpoint is OKX-native.
          </p>
          <pre
            style={{
              margin: 0,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              overflow: "auto",
              fontSize: 12.5,
              lineHeight: 1.55,
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
            }}
          >
            {SAMPLE_JSON}
          </pre>
        </section>

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
              The finance pack
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
              {tools.length} tools. {okxNative} OKX-native. Pay per call.
            </h2>
            <p style={{ ...body, marginBottom: 28 }}>
              {okxNative} OKX Web3 tools lead the pack. {tools.length - okxNative}{" "}
              coverage tools fill price, Solana risk, and FX so an agent stays
              inside one ASP. Every unpaid hit returns HTTP 402 with a real
              USDT0 price.
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tools.map((tool) => {
                const slug = slugForToolId(tool.id)!;
                const isOkx = tool.id.startsWith("okx.");
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
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {tool.name}
                        {isOkx && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--font-sans)",
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              borderRadius: 999,
                              border: "1px solid rgba(184,255,60,0.35)",
                              color: "#8fbf2e",
                            }}
                          >
                            OKX Web3
                          </span>
                        )}
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
            <div
              style={{ position: "sticky", top: 88 }}
              className="okxasp-aside"
            >
              <ArtPanel
                src="/inspo/okx-side.png"
                alt="Agents gathering around market signal"
                aspectRatio="4 / 5"
                position="50% 45%"
                variant="neon"
                overlayText="FINANCE COPILOT · X LAYER."
              />
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <div className="text-eyebrow" style={{ marginBottom: 8 }}>
                  Why the list is long
                </div>
                <p style={{ ...body, fontSize: 13, marginBottom: 0 }}>
                  OKX-native tools sit first. Commodity feeds fill coverage so
                  an agent can stay inside one ASP instead of hopping APIs.
                  The sticky panel stays with you while you scroll the pack.
                </p>
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <div className="text-eyebrow" style={{ marginBottom: 8 }}>
                  Settlement proof
                </div>
                <p style={{ ...body, fontSize: 13, marginBottom: 10 }}>
                  First paid authorize on X Layer via Agentic Wallet.
                  Facilitator returned success with tx hash. Settlement now
                  targets mainnet (`eip155:196`) to match ASP #4759.
                </p>
                <code
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    wordBreak: "break-all",
                    color: "var(--text-primary)",
                    lineHeight: 1.45,
                  }}
                >
                  {PROOF_TX}
                </code>
              </div>
              <div
                style={{
                  marginTop: 12,
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
            paddingTop: 48,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="text-eyebrow" style={{ marginBottom: 12 }}>
            How it works
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 2.4vw, 1.85rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              margin: "0 0 12px",
              maxWidth: 640,
            }}
          >
            Call. Pay. Read. Built for agents, not dashboards.
          </h2>
          <p style={{ ...body, marginBottom: 28, maxWidth: 640 }}>
            The Finance Copilot is an A2MCP pack. Your agent discovers tools on
            OKX.AI or via our catalog, pays USDT0 on X Layer when the endpoint
            returns 402, and receives JSON. No API keys on our side. No monthly
            plan.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                n: "01",
                t: "Discover",
                d: "Browse the pack on OKX.AI or hit /api/okxasp/catalog. Each tool has a price, schema, and HTTPS endpoint.",
              },
              {
                n: "02",
                t: "Probe",
                d: "Call without payment. You get HTTP 402 plus a Payment-Required header with amount, asset, network, and pay-to.",
              },
              {
                n: "03",
                t: "Settle",
                d: "Agentic Wallet or onchainos payment pay signs the 402. Retry with PAYMENT-SIGNATURE.",
              },
              {
                n: "04",
                t: "Use",
                d: "JSON comes back from OKX Web3 market data, wallet PnL, Solana risk, or FX. Spend only when the answer is worth it.",
              },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "#8fbf2e",
                    marginBottom: 8,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                  }}
                >
                  {s.t}
                </div>
                <p style={{ ...body, fontSize: 13.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
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
