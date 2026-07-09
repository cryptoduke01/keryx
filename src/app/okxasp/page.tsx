import Link from "next/link";
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

export default function OkxAspPage() {
  const tools = listOkxAspTools();

  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 40, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          OKX.AI Genesis · A2MCP
        </div>
        <h1 className="text-headline" style={{ marginBottom: 14 }}>
          Finance Copilot for agents.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            marginBottom: 20,
          }}
        >
          Agents need live prices and token risk mid-task — not a signup form.
          Kēryx Finance Copilot is a paid tool pack on{" "}
          <a href="https://okx.ai" target="_blank" rel="noreferrer" style={link}>
            OKX.AI
          </a>
          : discover, pay per call on{" "}
          <b style={{ color: "var(--text-primary)" }}>X Layer</b>, get the
          result. Arc Kēryx stays untouched.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href="/api/okxasp/catalog" style={btnPrimary}>
            Open catalog
          </a>
          <a
            href="https://okx.ai/tutorial/asp"
            target="_blank"
            rel="noreferrer"
            style={btnGhost}
          >
            ASP tutorial
          </a>
          <Link href="/ask" style={btnGhost}>
            Arc playground
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        <Stat label="ASP type" value="A2MCP" />
        <Stat label="Tools live" value={String(tools.length)} />
        <Stat label="Settlement" value="X Layer" />
        <Stat label="Form deadline" value="Jul 17" />
      </div>

      <Section title="Coexistence">
        <p style={body}>
          <b style={{ color: "var(--text-primary)" }}>Arc paths are unchanged.</b>{" "}
          <Link href="/ask" style={link}>
            /ask
          </Link>
          , <code style={code}>/api/call</code>, and Arc MCP still settle USDC on
          Arc. This feature is a parallel rail for the OKX.AI marketplace — same
          handlers, OKX x402 facilitator, X Layer network.
        </p>
      </Section>

      <Section title="Paid tools">
        <p style={{ ...body, marginBottom: 16 }}>
          Unpaid hits return HTTP 402. After Agentic Wallet pays, the handler
          runs. Point your OKX.AI listing at a public{" "}
          <code style={code}>https://</code> tool URL (not localhost).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {tools.map((tool) => {
            const slug = slugForToolId(tool.id)!;
            return (
              <div
                key={tool.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {tool.name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {tool.summary}
                  </div>
                  <code style={{ ...code, marginTop: 8, display: "inline-block" }}>
                    /api/okxasp/tools/{slug}
                  </code>
                </div>
                <div
                  className="text-mono"
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {priceUsdToOkxPrice(tool.priceUsd)}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Hackathon entry">
        <ol style={{ ...body, paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 10 }}>
            Build ASP with a clear use case — Finance Copilot (this page).
          </li>
          <li style={{ marginBottom: 10 }}>
            List on OKX.AI via{" "}
            <a href="https://okx.ai/tutorial/asp" target="_blank" rel="noreferrer" style={link}>
              okx.ai/tutorial/asp
            </a>{" "}
            — must be <b style={{ color: "var(--text-primary)" }}>approved / live</b>.
          </li>
          <li style={{ marginBottom: 10 }}>
            Google form before <b style={{ color: "var(--text-primary)" }}>{DEADLINE}</b>:{" "}
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
            X post with <code style={code}>#okxai</code>, demo ≤ 90 seconds.
          </li>
        </ol>
        <p style={{ ...body, marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
          Aim: Best Product + Finance Copilot + Revenue Rocket + Social Buzz. Full
          checklist in <code style={code}>docs/hackathon/OKX_AI_GENESIS.md</code>.
        </p>
      </Section>

      <Section title="Agentic Wallet (OTP)">
        <p style={{ ...body, marginBottom: 12 }}>
          Login is two steps. The first only <i>sends</i> the email. Paste the code
          into the second command — do not share the OTP in chat.
        </p>
        <Pre>
{`export PATH="$HOME/.local/bin:$PATH"
onchainos wallet login thepublicdesigner@gmail.com
# check email for the code, then:
onchainos wallet verify YOUR_OTP_HERE
onchainos wallet status
onchainos wallet addresses`}
        </Pre>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36, maxWidth: 760 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "16px 18px", background: "var(--surface-1)" }}>
      <div className="text-eyebrow" style={{ marginBottom: 6, color: "var(--text-muted)" }}>
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

function Pre({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 16,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        lineHeight: 1.55,
        color: "var(--text-primary)",
        overflow: "auto",
      }}
    >
      {children}
    </pre>
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

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 36,
  padding: "0 16px",
  borderRadius: 8,
  background: "var(--text-primary)",
  color: "var(--surface-0)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 36,
  padding: "0 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};
