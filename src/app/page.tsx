import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import { ledgerStats } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [tools, stats] = await Promise.all([listTools(), ledgerStats()]);

  return (
    <>
      {/* ============================================================
          HERO
          ========================================================== */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          paddingTop: 120,
          paddingBottom: 96,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          className="hero-glow"
        />
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.6 }}
          className="grid-bg"
        />

        <div className="container-page" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
            <div
              className="badge badge-gold"
              style={{ display: "inline-flex", marginBottom: 24 }}
            >
              <span
                className="animate-gold-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              Live on Arc testnet
            </div>

            <h1
              className="text-display"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 8vw, 5.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.045em",
                lineHeight: 0.95,
                marginBottom: 22,
              }}
            >
              The paid tool registry
              <br />
              <span style={{ color: "var(--accent)" }}>for AI agents.</span>
            </h1>

            <p
              style={{
                fontSize: 17,
                color: "var(--text-secondary)",
                lineHeight: 1.55,
                maxWidth: 620,
                margin: "0 auto 36px",
              }}
            >
              Any developer publishes a tool. Any AI agent pays to use it.
              Sub-cent USDC payments settle on Arc in under half a second.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/ask" style={{ textDecoration: "none" }}>
                <button className="btn btn-primary btn-lg">
                  Ask Kēryx →
                </button>
              </Link>
              <Link href="/publish" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost btn-lg">
                  Publish a tool
                </button>
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 48,
              marginTop: 72,
              paddingTop: 32,
              borderTop: "1px solid var(--border)",
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
                  className="text-mono"
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div className="text-eyebrow" style={{ marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ========================================================== */}
      <section
        style={{
          paddingTop: 88,
          paddingBottom: 88,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container-page">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="text-eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
              How Kēryx works
            </div>
            <h2 className="text-headline">Two sides. One rail.</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                n: "01",
                title: "Publish a tool",
                desc:
                  "Wrap any HTTP handler with @keryx/middleware. Set a price per call. Connect an Arc wallet. Your tool is instantly discoverable.",
              },
              {
                n: "02",
                title: "Agents discover it",
                desc:
                  "Every listing exposes a machine-readable manifest. Claude Code, Cursor, custom agents — they find your tool by capability.",
              },
              {
                n: "03",
                title: "USDC clears in <2s",
                desc:
                  "Every call triggers a nanopayment through Circle Gateway. Publisher wallet ticks up in real time. Zero platform holds.",
              },
            ].map((step) => (
              <div key={step.n} className="card" style={{ padding: 24 }}>
                <div
                  className="text-mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--accent)",
                    letterSpacing: "0.1em",
                    marginBottom: 14,
                  }}
                >
                  {step.n}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 19,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
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
          background: "var(--bg-secondary)",
          paddingTop: 88,
          paddingBottom: 88,
          borderBottom: "1px solid var(--border)",
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
              marginBottom: 32,
            }}
          >
            <div>
              <div className="text-eyebrow" style={{ color: "var(--accent)", marginBottom: 10 }}>
                Registry
              </div>
              <h2 className="text-title">Live tools right now</h2>
            </div>
            <Link href="/registry" style={{ textDecoration: "none" }}>
              <button className="btn btn-outline btn-sm">Browse all →</button>
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
              <div key={tool.id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    className="badge"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                  >
                    {tool.category}
                  </span>
                  {tool.verified && (
                    <span className="badge badge-gold" style={{ fontSize: 9 }}>
                      Verified
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {tool.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.55,
                    marginBottom: 16,
                    minHeight: 40,
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
                    paddingTop: 12,
                  }}
                >
                  <div>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>
                      Price
                    </div>
                    <div
                      className="text-mono"
                      style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}
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
          CTA
          ========================================================== */}
      <section
        style={{
          paddingTop: 96,
          paddingBottom: 96,
          textAlign: "center",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container-narrow">
          <h2 className="text-headline" style={{ marginBottom: 16 }}>
            Make something agents want.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              lineHeight: 1.55,
              marginBottom: 32,
              maxWidth: 520,
              margin: "0 auto 32px",
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
      <footer style={{ padding: "28px 0" }}>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                fontSize: 20,
                background: "linear-gradient(135deg, var(--gold-bright), var(--gold-dim))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Kēryx
            </span>
            <span className="badge badge-gold" style={{ fontSize: 9 }}>
              Lepton
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
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
