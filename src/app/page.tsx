import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import { ledgerStats } from "@/lib/ledger";
import Wordmark from "@/components/Wordmark";
import Kerykeion from "@/components/Kerykeion";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [tools, stats] = await Promise.all([listTools(), ledgerStats()]);

  return (
    <>
      {/* ============================================================
          HERO — kērykeion motif, italic serif headline, dual glow
          ========================================================== */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          paddingTop: 130,
          paddingBottom: 110,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Layer 1 · dual radial glow (gold left, cobalt right) */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} className="hero-glow" />
        {/* Layer 2 · halftone dot field, faded at edges */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.7 }}
          className="halftone halftone-fade"
        />
        {/* Layer 3 · engraved crosshatch (very faint) */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }}
          className="engraved"
        />
        {/* Layer 4 · centered kērykeion motif, low opacity, behind copy */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--gold)",
            opacity: 0.09,
            pointerEvents: "none",
          }}
        >
          <Kerykeion size={420} />
        </div>
        {/* Layer 5 · chiaroscuro vignette */}
        <div aria-hidden style={{ position: "absolute", inset: 0 }} className="chiaroscuro" />

        <div className="container-page" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 32,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(212,169,74,0.35)",
                background: "rgba(212,169,74,0.06)",
                color: "var(--gold-ink)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              <span
                aria-hidden
                className="animate-gold-pulse"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold-ink)" }}
              />
              A herald · for the age of agents
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 8.5vw, 5.6rem)",
                fontWeight: 400,
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
                marginBottom: 26,
              }}
            >
              The paid tool registry
              <br />
              <span
                className="text-italic"
                style={{
                  color: "var(--gold-ink)",
                  fontWeight: 400,
                  fontStyle: "italic",
                }}
              >
                for AI agents.
              </span>
            </h1>

            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: 640,
                margin: "0 auto 38px",
              }}
            >
              Any developer publishes a tool. Any AI agent pays to use it.
              Sub-cent USDC clears on Arc in under half a second — carried,
              like every message worth sending, by a herald.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/ask" style={{ textDecoration: "none" }}>
                <button className="btn btn-primary btn-lg">Ask Kēryx →</button>
              </Link>
              <Link href="/publish" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost btn-lg">Publish a tool</button>
              </Link>
            </div>
          </div>

          {/* Ornament: two thin gold horizontals framing the stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              marginTop: 84,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border-strong), transparent)", maxWidth: 260 }} />
            <span className="text-eyebrow" style={{ color: "var(--gold-warm)" }}>
              At a glance
            </span>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border-strong), transparent)", maxWidth: 260 }} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 60,
              marginTop: 32,
            }}
          >
            {[
              { label: "Tools live", value: String(tools.length) },
              { label: "Paid calls", value: String(stats.callCount) },
              { label: "Publisher take", value: "95%" },
              { label: "Settlement", value: "<2s" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 34,
                    fontWeight: 500,
                    fontStyle: "italic",
                    color: "var(--gold-ink)",
                    lineHeight: 1,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-eyebrow" style={{ marginTop: 10 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — cobalt full bleed. The storytelling beat.
          ========================================================== */}
      <section
        className="section-cobalt"
        style={{
          paddingTop: 100,
          paddingBottom: 100,
        }}
      >
        <div className="container-page" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64, maxWidth: 720, margin: "0 auto 64px" }}>
            <div className="text-eyebrow" style={{ color: "var(--cobalt-ink)", marginBottom: 14 }}>
              The rite
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
                fontWeight: 400,
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Two sides.{" "}
              <span className="text-italic" style={{ color: "var(--gold-ink)" }}>
                One rail.
              </span>
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "rgba(242, 235, 216, 0.72)",
                lineHeight: 1.6,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              Developers publish. Agents pay. Kēryx carries the coin between
              them, without asking anyone to sign up for a subscription.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                n: "I",
                title: "Publish a tool",
                desc:
                  "Wrap any HTTP handler with @keryx/middleware. Set a price per call. Point it at an Arc wallet. Your tool is instantly discoverable to every agent runtime.",
              },
              {
                n: "II",
                title: "Agents discover it",
                desc:
                  "Every listing carries a machine-readable manifest. Claude Code, Cursor, custom agents — they find your tool by capability and know its price before they call it.",
              },
              {
                n: "III",
                title: "USDC arrives",
                desc:
                  "Every call triggers a nanopayment through Circle Gateway. Your Arc wallet ticks up in real time. Kēryx never holds a cent longer than a heartbeat.",
              },
            ].map((step) => (
              <div
                key={step.n}
                style={{
                  padding: 26,
                  borderRadius: 12,
                  background: "rgba(15, 37, 96, 0.55)",
                  border: "1px solid rgba(109, 140, 232, 0.35)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 30,
                    fontWeight: 500,
                    color: "var(--gold-ink)",
                    lineHeight: 1,
                    marginBottom: 18,
                  }}
                >
                  {step.n}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "rgba(242, 235, 216, 0.72)",
                    lineHeight: 1.65,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          REGISTRY PREVIEW
          ========================================================== */}
      <section
        style={{
          position: "relative",
          background: "var(--surface-0)",
          paddingTop: 96,
          paddingBottom: 96,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.45 }}
          className="engraved"
        />
        <div className="container-page" style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <div>
              <div className="text-eyebrow" style={{ color: "var(--gold-warm)", marginBottom: 12 }}>
                Registry · live now
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              >
                Tools <span className="text-italic" style={{ color: "var(--gold-ink)" }}>the herald</span> carries
              </h2>
            </div>
            <Link href="/registry" style={{ textDecoration: "none" }}>
              <button className="btn btn-outline btn-sm">Browse all →</button>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {tools.slice(0, 6).map((tool) => (
              <div
                key={tool.id}
                style={{
                  padding: 22,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* subtle corner accent */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    background: "var(--gold-tint)",
                    filter: "blur(24px)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 14,
                    position: "relative",
                  }}
                >
                  <span className="badge badge-cobalt">{tool.category}</span>
                  {tool.verified && (
                    <span className="badge badge-gold" style={{ fontSize: 9 }}>
                      Verified
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 500,
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                    position: "relative",
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
                    position: "relative",
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
                    position: "relative",
                  }}
                >
                  <div>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>
                      Price
                    </div>
                    <div
                      className="text-mono"
                      style={{ fontSize: 16, fontWeight: 700, color: "var(--gold-ink)" }}
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
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA — italic serif closing beat
          ========================================================== */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          paddingTop: 120,
          paddingBottom: 120,
          textAlign: "center",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} className="halftone halftone-fade" />
        <div className="container-narrow" style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              fontWeight: 400,
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
              marginBottom: 20,
            }}
          >
            Make something{" "}
            <span className="text-italic" style={{ color: "var(--gold-ink)" }}>
              agents want.
            </span>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 540,
              margin: "0 auto 36px",
            }}
          >
            The next trillion users on the internet are AI agents. Kēryx is
            where they pay for the tools they use.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/publish" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary btn-lg">Publish a tool →</button>
            </Link>
            <Link href="/live" style={{ textDecoration: "none" }}>
              <button className="btn btn-outline btn-lg">See it live</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ========================================================== */}
      <footer style={{ padding: "32px 0" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Wordmark size={20} />
            <span className="badge badge-gold" style={{ fontSize: 9 }}>
              Lepton
            </span>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Link href="/ask" style={{ fontSize: 13, color: "var(--text-muted)" }}>Ask</Link>
            <Link href="/registry" style={{ fontSize: 13, color: "var(--text-muted)" }}>Registry</Link>
            <Link href="/publish" style={{ fontSize: 13, color: "var(--text-muted)" }}>Publish</Link>
            <Link href="/live" style={{ fontSize: 13, color: "var(--text-muted)" }}>Live</Link>
            <Link href="/docs" style={{ fontSize: 13, color: "var(--text-muted)" }}>Docs</Link>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
            Settles on Arc · MIT
          </span>
        </div>
      </footer>
    </>
  );
}
