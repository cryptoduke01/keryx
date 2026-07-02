import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import { ledgerStats } from "@/lib/ledger";
import Kerykeion from "@/components/Kerykeion";

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
  const [tools, stats] = await Promise.all([listTools(), ledgerStats()]);

  return (
    <>
      {/* ============================================================
          HERO — rounded art panel, centered serif headline below it
          ========================================================== */}
      <section style={{ paddingTop: 108, paddingBottom: 88 }}>
        <div className="container-page">
          {/* Art panel */}
          <div
            className="art-panel"
            style={{
              height: "min(56vh, 480px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="art-duotone" style={{ position: "absolute", inset: 0 }} />
            <div className="art-halftone" />
            <div className="art-grain" />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                color: "rgba(11,11,12,0.9)",
                mixBlendMode: "overlay",
                opacity: 0.9,
              }}
            >
              <Kerykeion size={220} />
            </div>
            <div className="art-vignette" />

            {/* Live badge, floated top-left like Kairos's corner label */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                zIndex: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(11,11,12,0.55)",
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

          {/* Headline + copy, centered below the art */}
          <div style={{ textAlign: "center", maxWidth: 720, margin: "56px auto 0" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
                fontWeight: 500,
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
                marginBottom: 22,
              }}
            >
              A herald for the age of agents.
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 16.5,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                maxWidth: 560,
                margin: "0 auto 36px",
              }}
            >
              Kēryx is the registry where developers publish paid tools and
              AI agents pay to use them. Sub-cent USDC settles on Arc in
              under half a second — no subscriptions, no API keys, no human
              in the loop.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/ask" style={{ textDecoration: "none" }}>
                <button className="btn btn-primary btn-lg">Ask Kēryx</button>
              </Link>
              <Link href="/publish" style={{ textDecoration: "none" }}>
                <button className="btn btn-outline btn-lg">Publish a tool</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          RUNTIME COMPATIBILITY ROW — neutral, text-only, factual
          ========================================================== */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "28px 0" }}>
        <div
          className="container-page"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <span className="text-eyebrow" style={{ marginRight: 8 }}>
            Works wherever agents run
          </span>
          {RUNTIMES.map((r) => (
            <span
              key={r}
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "-0.005em",
              }}
            >
              {r}
            </span>
          ))}
        </div>
      </section>

      {/* ============================================================
          STATS
          ========================================================== */}
      <section style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div
          className="container-page"
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 64,
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
                  fontFamily: "var(--font-sans)",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
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
      </section>

      {/* ============================================================
          HOW IT WORKS — neutral cards, no color chrome
          ========================================================== */}
      <section style={{ paddingTop: 56, paddingBottom: 96 }}>
        <div className="container-page">
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
              },
              {
                n: "02",
                title: "Agents discover it",
                desc:
                  "Every listing carries a machine-readable manifest. Claude Code, Cursor, custom agents — they find your tool by capability and know its price before they call it.",
              },
              {
                n: "03",
                title: "USDC arrives",
                desc:
                  "Every call triggers a nanopayment through Circle Gateway. Your wallet updates in real time. Kēryx never holds a balance.",
              },
            ].map((step) => (
              <div
                key={step.n}
                style={{
                  padding: 32,
                  background: "var(--surface-1)",
                }}
              >
                <div
                  className="text-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                    marginBottom: 20,
                  }}
                >
                  {step.n}
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {tools.slice(0, 6).map((tool) => (
              <div
                key={tool.id}
                style={{
                  padding: 22,
                  background: "var(--surface-0)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
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
                    fontSize: 17,
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
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA — clean, centered, serif headline only
          ========================================================== */}
      <section style={{ paddingTop: 110, paddingBottom: 110, textAlign: "center" }}>
        <div className="container-narrow">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            Make something agents want.
          </h2>
          <p
            style={{
              fontSize: 15.5,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 34,
              maxWidth: 480,
              margin: "0 auto 34px",
            }}
          >
            The next trillion users on the internet are AI agents. Kēryx is
            where they pay for the tools they use.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/publish" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary btn-lg">Publish a tool</button>
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
          </div>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
            Settles on Arc · MIT
          </span>
        </div>
      </footer>
    </>
  );
}
