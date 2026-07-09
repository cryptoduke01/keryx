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
  title: "OKX.AI ASP · Kēryx Finance Copilot",
  description:
    "Kēryx Finance Copilot — an A2MCP Agent Service Provider for OKX.AI. Pay-per-call market intel on X Layer. Coexists with Arc settlement.",
};

const DEADLINE = "Jul 17, 00:00 UTC";
const ASP_ID = "4759";

export default function OkxAspPage() {
  const tools = listOkxAspTools();

  return (
    <>
      {/* Full-bleed hero — same language as landing */}
      <section
        style={{
          position: "relative",
          height: "min(78vh, 720px)",
          minHeight: 480,
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
              OKX.AI Genesis · ASP #{ASP_ID}
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
                  maxWidth: 520,
                  marginBottom: 24,
                  textShadow: "0 1px 12px rgba(0,0,0,0.7)",
                }}
              >
                Live prices, token risk, and FX — paid per call on X Layer.
                Discover the pack on OKX.AI. Arc Kēryx stays on its own rail.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <a href="/api/okxasp/catalog" style={btnHeroPrimary}>
                  Open catalog
                </a>
                <a
                  href="https://okx.ai"
                  target="_blank"
                  rel="noreferrer"
                  style={btnHeroGhost}
                >
                  OKX.AI marketplace
                </a>
                <Link href="/ask" style={btnHeroGhost}>
                  Arc playground
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
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 1,
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 56,
            marginTop: -8,
          }}
        >
          <Stat label="ASP type" value="A2MCP" />
          <Stat label="Tools" value={String(tools.length)} />
          <Stat label="Settlement" value="X Layer" />
          <Stat label="Listing" value={`#${ASP_ID}`} />
          <Stat label="Deadline" value="Jul 17" />
        </div>

        <div
          className="okxasp-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.88fr)",
            gap: 40,
            marginBottom: 56,
            alignItems: "start",
          }}
        >
          <section>
            <div className="text-eyebrow" style={{ marginBottom: 12 }}>
              Paid tools
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
              Eight market calls. One ASP.
            </h2>
            <p style={{ ...body, marginBottom: 24 }}>
              Unpaid hits return HTTP 402. After Agentic Wallet pays on X Layer,
              the handler runs. Point your listing at a public{" "}
              <code style={code}>https://</code> tool URL.
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tools.map((tool) => {
                const slug = slugForToolId(tool.id)!;
                return (
                  <div
                    key={tool.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 16,
                      padding: "18px 0",
                      borderBottom: "1px solid var(--border)",
                      alignItems: "start",
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
                          marginBottom: 8,
                        }}
                      >
                        {tool.summary}
                      </div>
                      <code style={code}>/api/okxasp/tools/{slug}</code>
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
                  </div>
                );
              })}
            </div>
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="okxasp-aside-art" style={{ position: "sticky", top: 88 }}>
              <ArtPanel
                src="/inspo/publish-hero.jpg"
                alt="Publishers and heralds of the registry"
                aspectRatio="4 / 5"
                position="50% 35%"
                variant="raw"
                overlayText="MARKET INTEL AT MACHINE SPEED — SETTLED ON X LAYER."
              />
              <div
                style={{
                  marginTop: 20,
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <div className="text-eyebrow" style={{ marginBottom: 10 }}>
                  Coexistence
                </div>
                <p style={body}>
                  Arc paths (
                  <Link href="/ask" style={link}>
                    /ask
                  </Link>
                  , <code style={code}>/api/call</code>) still settle USDC on
                  Arc. This page is the OKX.AI rail only — same handlers,
                  different facilitator and chain.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 32,
            alignItems: "center",
            marginBottom: 48,
            padding: "32px 0",
            borderTop: "1px solid var(--border)",
          }}
          className="okxasp-entry"
        >
          <div>
            <div className="text-eyebrow" style={{ marginBottom: 12 }}>
              Hackathon entry
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem, 2.2vw, 1.7rem)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                margin: "0 0 16px",
              }}
            >
              Listed under review. Form still open.
            </h2>
            <ol style={{ ...body, paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 10 }}>
                ASP{" "}
                <b style={{ color: "var(--text-primary)" }}>#{ASP_ID}</b>{" "}
                registered — {tools.length} A2MCP services on OKX.AI.
              </li>
              <li style={{ marginBottom: 10 }}>
                When live, submit the Google form before{" "}
                <b style={{ color: "var(--text-primary)" }}>{DEADLINE}</b>:{" "}
                <a
                  href="https://forms.gle/mddEUagmDbyV37ws8"
                  target="_blank"
                  rel="noreferrer"
                  style={link}
                >
                  forms.gle/…
                </a>
              </li>
              <li>
                X post with <code style={code}>#okxai</code>, demo ≤ 90
                seconds.
              </li>
            </ol>
            <p
              style={{
                ...body,
                marginTop: 16,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Marketplace:{" "}
              <a
                href="https://okx.ai"
                target="_blank"
                rel="noreferrer"
                style={link}
              >
                okx.ai
              </a>
            </p>
          </div>
          <ArtPanel
            src="/inspo/whitepaper-hero.png"
            alt="Kēryx whitepaper atmosphere"
            aspectRatio="16 / 10"
            position="50% 40%"
            variant="raw"
            overlayText="PARALLEL RAIL — ARC UNTOUCHED."
          />
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 960px) {
              .okxasp-split { grid-template-columns: 1fr !important; }
              .okxasp-entry { grid-template-columns: 1fr !important; }
              .okxasp-aside-art { position: static !important; }
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

const code: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12.5,
  padding: "1px 6px",
  borderRadius: 4,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
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
