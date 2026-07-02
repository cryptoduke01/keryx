import Link from "next/link";
import Image from "next/image";
import { listTools } from "@/lib/registry/store";
import Reveal from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

const RUNTIMES = [
  "Claude Code",
  "Cursor",
  "OpenAI",
  "LangChain",
  "AutoGPT",
  "Anthropic MCP",
] as const;

export default async function Landing() {
  const tools = await listTools();

  return (
    <>
      {/* ============================================================
          HERO — full-bleed photo, content overlaid directly on it,
          fading into the page background at the bottom (Kairos-direction)
          ========================================================== */}
      <section
        style={{
          position: "relative",
          height: "min(92vh, 860px)",
          minHeight: 560,
          overflow: "hidden",
        }}
      >
        <Image
          src="/hero-source.png"
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
              /* Fixed dark tone, not tied to --bg-primary: the photo stays
                 dark/moody in both themes (same pattern Vantage itself uses
                 for its photo panel), so the fade must always resolve to a
                 dark endpoint rather than the page's own background color.
                 Second gradient darkens specifically behind the bottom-left
                 text block, since a uniform top-to-bottom fade alone left
                 the headline riding directly on the photo's lighter dot
                 regions with no legibility guarantee. */
              "linear-gradient(180deg, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.45) 55%, rgba(11,11,12,0.95) 97%), linear-gradient(100deg, rgba(11,11,12,0.7) 0%, rgba(11,11,12,0.35) 38%, transparent 68%)",
          }}
        />

        {/* Live badge, top-left below the nav */}
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
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}
              />
              Live on Arc testnet
            </div>
          </div>
        </div>

        {/* Content, bottom-left on the image */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            paddingBottom: 56,
          }}
        >
          <div className="container-page">
            <Reveal immediate>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
                  fontWeight: 500,
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                  color: "#f5f4f0",
                  marginBottom: 18,
                  maxWidth: 640,
                  textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                The toll booth for the agent economy.
              </h1>
            </Reveal>
            <Reveal immediate delay={0.12}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  color: "rgba(245,244,240,0.85)",
                  lineHeight: 1.6,
                  maxWidth: 520,
                  marginBottom: 30,
                  textShadow: "0 2px 16px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                Kēryx is the registry where developers publish paid tools and
                AI agents pay to use them. Sub-cent USDC settles on Arc in
                under half a second. No subscriptions, no API keys, no human
                in the loop.
              </p>
            </Reveal>
            <Reveal immediate delay={0.22}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/ask" style={{ textDecoration: "none" }}>
                  <button className="btn btn-primary btn-lg">Ask Kēryx</button>
                </Link>
                <Link href="/publish" style={{ textDecoration: "none" }}>
                  <button
                    className="btn btn-lg"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      color: "#f5f4f0",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    Publish a tool
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          RUNTIME COMPATIBILITY ROW — neutral, marquee drift
          ========================================================== */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "24px 0" }}>
        <div className="container-page marquee-mask">
          <div
            className="marquee-track"
            style={{ alignItems: "center", gap: 56 }}
          >
            {[...RUNTIMES, ...RUNTIMES].map((r, i) => (
              <span
                key={`${r}-${i}`}
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "-0.005em",
                  whiteSpace: "nowrap",
                }}
              >
                {i % RUNTIMES.length === 0 && (
                  <span className="text-eyebrow" style={{ marginRight: 56 }}>
                    Works wherever agents run
                  </span>
                )}
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — neutral cards, no color chrome
          ========================================================== */}
      <section style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div className="container-page">
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 620, margin: "0 auto 56px" }}>
              <div className="text-eyebrow" style={{ marginBottom: 14 }}>
                How it works
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 4vw, 2.75rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.08,
                }}
              >
                Two sides. One rail.
              </h2>
            </div>
          </Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 1,
              background: "var(--border)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {[
              {
                n: "01",
                title: "Publish a tool",
                desc:
                  "Wrap any HTTP handler with @keryx/middleware. Set a price per call. Point it at an Arc wallet. Your tool is instantly discoverable.",
                icon: (
                  <path d="M14.7 6.3a1 1 0 010 1.4L8.4 14a1 1 0 01-1.4 0L4 11a1 1 0 011.4-1.4L7 11.2l5.3-5.3a1 1 0 011.4 0zM4 16h12" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                n: "02",
                title: "Agents discover it",
                desc:
                  "Every listing carries a machine-readable manifest. Claude Code, Cursor, and custom agents find your tool by capability and know its price before they call it.",
                icon: (
                  <>
                    <circle cx="8.5" cy="8.5" r="5" strokeLinecap="round" />
                    <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
                  </>
                ),
              },
              {
                n: "03",
                title: "USDC arrives",
                desc:
                  "Every call triggers a nanopayment through Circle Gateway. Your wallet updates in real time. Kēryx never holds a balance.",
                icon: (
                  <>
                    <circle cx="10" cy="10" r="7" strokeLinecap="round" />
                    <path d="M10 6v8M12.5 8a2 2 0 00-2-1.5h-.8a1.7 1.7 0 000 3.4h1.6a1.7 1.7 0 010 3.4h-.8a2 2 0 01-2-1.5" strokeLinecap="round" />
                  </>
                ),
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1} y={14}>
                <div
                  className="hover-lift step-card"
                  style={{
                    padding: 32,
                    background: "var(--surface-1)",
                    height: "100%",
                    border: "1px solid transparent",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 22,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-primary)",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                        {step.icon}
                      </svg>
                    </div>
                    <div
                      className="text-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-faint)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {step.n}
                    </div>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 10,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          REGISTRY PREVIEW
          ========================================================== */}
      <section
        style={{
          background: "var(--surface-1)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          paddingTop: 88,
          paddingBottom: 88,
        }}
      >
        <div className="container-page">
          <Reveal>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 36,
              }}
            >
              <div>
                <div className="text-eyebrow" style={{ marginBottom: 12 }}>
                  Registry
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.9rem, 3.2vw, 2.5rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Tools live right now
                </h2>
              </div>
              <Link href="/registry" style={{ textDecoration: "none" }}>
                <button className="btn btn-outline btn-sm">Browse all</button>
              </Link>
            </div>
          </Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {tools.slice(0, 6).map((tool, i) => (
              <Reveal key={tool.id} delay={(i % 3) * 0.08} y={14}>
                <div
                  className="hover-lift"
                  style={{
                    padding: 22,
                    background: "var(--surface-0)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <span className="badge">{tool.category}</span>
                    {tool.verified && <span className="badge">Verified</span>}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 8,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {tool.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      marginBottom: 18,
                      minHeight: 42,
                    }}
                  >
                    {tool.summary}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border)",
                      paddingTop: 14,
                    }}
                  >
                    <div>
                      <div className="text-eyebrow" style={{ marginBottom: 2 }}>
                        Price
                      </div>
                      <div
                        className="text-mono"
                        style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}
                      >
                        ${tool.priceUsd.toFixed(3)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="text-eyebrow" style={{ marginBottom: 2 }}>
                        Publisher
                      </div>
                      <div className="text-mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {tool.publisherName}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA — bookends the hero: same photo, tighter crop, closing beat
          ========================================================== */}
      <section style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="container-page">
          <Reveal>
            <div
              className="art-panel"
              style={{ height: "min(48vh, 420px)", minHeight: 320 }}
            >
              <Image
                src="/hero-source.png"
                alt=""
                fill
                className="art-photo"
                style={{ objectPosition: "50% 75%" }}
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <div className="art-photo-tint" />
              <div className="art-grain" />
              <div className="art-vignette" />
              {/* Inverse vignette: darkens the CENTER specifically, since
                  this text block is centered (not bottom-left like the
                  hero) and .art-vignette alone only darkens the edges. */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(11,11,12,0.55) 0%, transparent 70%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 32,
                  zIndex: 1,
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2.1rem, 4.2vw, 3rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                    marginBottom: 18,
                    color: "#f5f4f0",
                    textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  Make something agents want.
                </h2>
                <p
                  style={{
                    fontSize: 15.5,
                    color: "rgba(245,244,240,0.88)",
                    lineHeight: 1.6,
                    marginBottom: 30,
                    maxWidth: 460,
                    textShadow: "0 2px 16px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  The next trillion users on the internet are AI agents. Kēryx
                  is where they pay for the tools they use.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/publish" style={{ textDecoration: "none" }}>
                    <button className="btn btn-primary btn-lg">Publish a tool</button>
                  </Link>
                  <Link href="/live" style={{ textDecoration: "none" }}>
                    <button
                      className="btn btn-lg"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.28)",
                        color: "#f5f4f0",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      See it live
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ========================================================== */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 0" }}>
        <div
          className="container-page"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15 }}>
            Kēryx
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Link href="/ask" style={{ fontSize: 13, color: "var(--text-muted)" }}>Ask</Link>
            <Link href="/registry" style={{ fontSize: 13, color: "var(--text-muted)" }}>Registry</Link>
            <Link href="/publish" style={{ fontSize: 13, color: "var(--text-muted)" }}>Publish</Link>
            <Link href="/live" style={{ fontSize: 13, color: "var(--text-muted)" }}>Live</Link>
            <Link href="/docs" style={{ fontSize: 13, color: "var(--text-muted)" }}>Docs</Link>
            <Link href="/whitepaper" style={{ fontSize: 13, color: "var(--text-muted)" }}>Whitepaper</Link>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
            Settles on Arc · MIT · Not backed by Ycmobinator
          </span>
        </div>
      </footer>
    </>
  );
}
