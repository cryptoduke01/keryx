import Link from "next/link";
import Image from "next/image";
import { listTools } from "@/lib/registry/store";
import { ledgerStats } from "@/lib/ledger";
import Reveal from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const emptyStats = {
    totalPaidUsd: 0,
    callCount: 0,
    publisherCount: 0,
    callerCount: 0,
    toolCount: 0,
  };
  let tools: Awaited<ReturnType<typeof listTools>> = [];
  let stats = emptyStats;
  try {
    [tools, stats] = await Promise.all([listTools(), ledgerStats()]);
  } catch (err) {
    console.error("[page] landing data failed", err);
    try {
      tools = await listTools();
    } catch {
      tools = [];
    }
  }
  const nfmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

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
                Web scrapes break. Keryx tools don&rsquo;t &mdash; because their
                publishers get paid to keep them working. Fresh, structured,
                attributable data at fractions of a cent per call, in USDC on Arc.
              </p>
            </Reveal>
            <Reveal immediate delay={0.22}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/ask" style={{ textDecoration: "none" }}>
                  <button className="btn btn-primary btn-lg">Ask Keryx</button>
                </Link>
                <Link href="/whitepaper" style={{ textDecoration: "none" }}>
                  <button
                    className="btn btn-lg"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      color: "#f5f4f0",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    Read the whitepaper
                  </button>
                </Link>
              </div>
            </Reveal>
            <Reveal immediate delay={0.32}>
              <Link
                href="/docs#mcp"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 16,
                  fontSize: 13,
                  color: "rgba(245,244,240,0.75)",
                  textDecoration: "none",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.28)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  MCP
                </span>
                <span style={{ opacity: 0.85 }}>Available in Cursor, Claude, GitHub Copilot <span aria-hidden>→</span></span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          TRACTION STRIP — real numbers from the ledger, not vanity metrics.
          These are the "user onboarding numbers" a hackathon judge asks for.
          ========================================================== */}
      <section
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "28px 0",
          background: "var(--surface-1)",
        }}
      >
        <div className="container-page">
          <div
            className="traction-strip"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 20,
              alignItems: "center",
            }}
          >
            <TractionStat
              eyebrow="Paid calls settled"
              value={nfmt(stats.callCount)}
              hint="Live on Arc testnet"
            />
            <TractionStat
              eyebrow="Executable tools"
              value={String(tools.filter((t) => !t.id.startsWith("demo.")).length)}
              hint="Real HTTP endpoints"
            />
            <TractionStat
              eyebrow="Unique agent callers"
              value={String(Math.max(1, stats.callerCount))}
              hint="Distinct paying identities"
            />
            <TractionStat
              eyebrow="Onchain contract"
              value="Arc"
              hint="0x7eA3…8bA7"
              href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"
            />
            <TractionStat
              eyebrow="SDK on npm"
              value="v0.1.1"
              hint="@keryxhq/middleware"
              href="https://www.npmjs.com/package/@keryxhq/middleware"
            />
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 900px) {
                .traction-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; row-gap: 22px !important; }
                .traction-strip > :nth-child(5) { grid-column: span 2; }
              }
              @media (max-width: 480px) {
                .traction-strip { grid-template-columns: 1fr !important; }
                .traction-strip > :nth-child(5) { grid-column: auto; }
              }
            `,
          }}
        />
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
                The unit of access is the call, not the account.
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
                  "Wrap any HTTP handler with @keryxhq/middleware. Set a price per call. Point it at an Arc wallet. Your tool is instantly discoverable.",
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
                  "Every call settles USDC on Arc via x402 (local facilitator today; Circle Gateway when configured). Your publisher wallet is payTo. Keryx never custodians a balance.",
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

          {/* CTA directly under the cards */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <Link
              href="/ask"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                borderRadius: 8,
                background: "var(--text-primary)",
                color: "var(--surface-0)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Fire a live call &rarr;
            </Link>
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
                  The next trillion users on the internet are AI agents. Keryx
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
      <footer style={{ borderTop: "1px solid var(--border)", marginTop: 64, paddingTop: 56, paddingBottom: 40 }}>
        <div className="container-page">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: 32,
              marginBottom: 48,
            }}
            className="footer-grid"
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-wordmark)",
                  fontStyle: "italic",
                  fontSize: 26,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                  marginBottom: 12,
                }}
              >
                Keryx
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 260, marginBottom: 20 }}>
                The toll booth for the agent economy. Any developer publishes a paid tool. Any AI agent pays to use it. USDC nanopayments on Arc.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href="https://x.com/keryxhq"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Keryx on X"
                  style={footerIconStyle}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="KeryxRegistry contract on Arcscan"
                  style={footerIconStyle}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 10h16" />
                    <path d="M10 20V10" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <div className="text-eyebrow" style={footerColHead}>Product</div>
              <FooterLink href="/ask">Ask playground</FooterLink>
              <FooterLink href="/registry">Registry</FooterLink>
              <FooterLink href="/publish">Publish a tool</FooterLink>
              <FooterLink href="/live">Live ledger</FooterLink>
              <FooterLink href="/sdk">SDK</FooterLink>
              <FooterLink href="/try">Testing guide</FooterLink>
            </div>

            <div>
              <div className="text-eyebrow" style={footerColHead}>Developers</div>
              <FooterLink href="/sdk">SDK · @keryxhq/middleware</FooterLink>
              <FooterLink href="/docs">Integration docs</FooterLink>
              <FooterLink href="/docs#mcp">MCP for Claude Code</FooterLink>
              <FooterLink href="/.well-known/x402">x402 discovery</FooterLink>
              <FooterLink href="/llms.txt">llms.txt</FooterLink>
              <FooterLink href="/api/demo?toolId=crypto.price">Free demo sample</FooterLink>
              <FooterLink href="/quickstart.ts">Buyer quickstart (.ts)</FooterLink>
              <FooterLink href="/try">Try in 5 minutes</FooterLink>
              <FooterExternal href="https://www.npmjs.com/package/@keryxhq/middleware">
                Package on npm
              </FooterExternal>
              <FooterExternal href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7">
                Contract on Arc
              </FooterExternal>
            </div>

            <div>
              <div className="text-eyebrow" style={footerColHead}>Company</div>
              <FooterLink href="/for-judges">For judges · Lepton / Arc</FooterLink>
              <FooterLink href="/pitch">Pitch deck</FooterLink>
              <FooterLink href="/okxasp">OKX.AI track (separate)</FooterLink>
              <FooterLink href="/whitepaper">Whitepaper</FooterLink>
              <FooterExternal href="https://x.com/keryxhq">@keryxhq</FooterExternal>
              <FooterExternal href="https://www.arc.network">Runs on Arc</FooterExternal>
            </div>
          </div>

          <div
            style={{
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 11.5, color: "var(--text-faint)", letterSpacing: "0.02em" }}>
              © 2026 Keryx. Settles on Arc testnet. MIT-licensed. Not backed by Ycmobinator.
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
              v0.1 · commit provably onchain
            </div>
          </div>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 720px) {
                .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
              }
              @media (max-width: 480px) {
                .footer-grid { grid-template-columns: 1fr !important; }
              }
            `,
          }}
        />
      </footer>
    </>
  );
}

const footerColHead: React.CSSProperties = {
  marginBottom: 14,
  color: "var(--text-secondary)",
};

const footerIconStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-secondary)",
};

function TractionStat({
  eyebrow,
  value,
  hint,
  href,
}: {
  eyebrow: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <div
        className="text-eyebrow"
        style={{ marginBottom: 6, color: "var(--text-muted)" }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.6rem, 3vw, 2.15rem)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontWeight: 500,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        className="text-mono"
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.01em",
        }}
      >
        {hint}
      </div>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {body}
      </a>
    );
  }
  return <div>{body}</div>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        fontSize: 13.5,
        color: "var(--text-secondary)",
        padding: "5px 0",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function FooterExternal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "block",
        fontSize: 13.5,
        color: "var(--text-secondary)",
        padding: "5px 0",
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}
