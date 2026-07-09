import Link from "next/link";
import ArtPanel from "@/components/ArtPanel";
import CopyButton from "@/components/CopyButton";
import {
  listOkxAspTools,
  priceUsdToOkxPrice,
  slugForToolId,
} from "@/lib/okxasp/config";

export const metadata = {
  title: "OKX.AI docs · Keryx Finance Copilot",
  description:
    "How to call Keryx Finance Copilot tools on OKX.AI. Pay per call on X Layer with Agentic Wallet.",
};

export default function OkxAspDocsPage() {
  const tools = listOkxAspTools();
  const okxNative = tools.filter((t) => t.id.startsWith("okx."));
  const rest = tools.filter((t) => !t.id.startsWith("okx."));

  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 40, width: "100%" }}>
        <ArtPanel
          src="/inspo/okx-docs.png"
          alt=""
          aspectRatio="21 / 8"
          minHeight={220}
          position="50% 38%"
          variant="neon"
          headline="Agents that pay, not scrape."
          overlayText="OKX.AI · Integration docs"
        />
      </div>

      {/* Match hero strip width — no skinny column under a full-bleed art panel */}
      <div style={{ maxWidth: "100%" }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          OKX.AI · Docs
        </div>
        <h1
          className="text-headline"
          style={{ marginBottom: 16 }}
        >
          Wire your agent to the Finance Copilot.
        </h1>
        <p style={lead}>
          Twelve paid market tools on X Layer. Hit an HTTPS endpoint, pay USDT0
          when asked, get JSON back. Four tools hit OKX Web3 market and wallet
          APIs with our seller credentials. The rest fill coverage so an agent
          can stay inside one ASP.
        </p>
        <p style={{ ...muted, marginBottom: 48 }}>
          Product:{" "}
          <Link href="/okxasp" className="okx-link">
            /okxasp
          </Link>
          {" · "}
          Marketplace:{" "}
          <a
            href="https://okx.ai"
            target="_blank"
            rel="noreferrer"
            className="okx-link"
          >
            okx.ai
          </a>
          {" · "}
          ASP tutorial:{" "}
          <a
            href="https://okx.ai/tutorial/asp"
            target="_blank"
            rel="noreferrer"
            className="okx-link"
          >
            okx.ai/tutorial/asp
          </a>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 56,
          }}
        >
          {[
            { k: "Settlement", v: "X Layer · USDT0" },
            { k: "Auth model", v: "x402 · no API keys" },
            { k: "OKX-native", v: String(okxNative.length) },
            { k: "Total tools", v: String(tools.length) },
          ].map((s) => (
            <div
              key={s.k}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface-1)",
              }}
            >
              <div className="text-eyebrow" style={{ marginBottom: 6 }}>
                {s.k}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <Section title="1. Discover tools">
          <p style={pStyle}>
            Free catalog. No payment. Use it to pick an endpoint and see prices
            before the agent spends.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl https://keryxhq.xyz/api/okxasp/catalog`}
          />
          <p style={pStyle}>
            Response includes tool id, name, price, summary, and the HTTPS path
            under <code style={codeInline}>/api/okxasp/tools/…</code>.
          </p>
        </Section>

        <Section title="2. Call without payment">
          <p style={pStyle}>
            First request returns <code style={codeInline}>402</code>. The{" "}
            <code style={codeInline}>PAYMENT-REQUIRED</code> header carries
            amount, asset, network, and pay-to. In a browser (Mozilla UA +{" "}
            <code style={codeInline}>Accept: text/html</code>) you get a clear
            paywall with the real USDT0 price — not a blank 402.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl -i "https://keryxhq.xyz/api/okxasp/tools/okx-token-price?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum"
# HTTP/2 402
# payment-required: <base64 x402 payload>
# amount is USDT0 on X Layer`}
          />
        </Section>

        <Section title="3. Pay and retry">
          <p style={pStyle}>
            Use OKX Agentic Wallet or Onchain OS to settle the 402, then retry
            with <code style={codeInline}>PAYMENT-SIGNATURE</code>. A successful
            call returns JSON from the tool.
          </p>
          <CodeBlock
            lang="bash"
            code={`# Extract PAYMENT-REQUIRED from the 402, then:
onchainos payment pay --payload "$PAYMENT_REQUIRED" --chain xlayer

# Retry with the signed header:
curl -H "PAYMENT-SIGNATURE: $SIG" \\
  "https://keryxhq.xyz/api/okxasp/tools/okx-token-price?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum"
# → { "toolId": "okx.token-price", "result": { "priceUsd": ..., "source": "okx-web3" } }`}
          />
          <p style={pStyle}>
            If the facilitator returns <code style={codeInline}>timeout</code>{" "}
            after a successful authorize, we poll settlement and still return
            the tool JSON when the tx lands. Do not treat timeout as a failed
            spend without checking the tx hash.
          </p>
        </Section>

        <Section title="4. OKX-native tools (use these first)">
          <p style={pStyle}>
            These hit OKX Web3 market and wallet APIs with our seller
            credentials. That is the edge versus wrapping CoinGecko alone.
          </p>
          <ToolTable tools={okxNative} />
        </Section>

        <Section title="5. Coverage tools">
          <p style={pStyle}>
            Commodity feeds so the agent does not leave the pack for price,
            Solana risk, or FX.
          </p>
          <ToolTable tools={rest} />
        </Section>

        <Section title="6. Health check">
          <p style={pStyle}>
            Confirms seller credentials and network config without spending.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl https://keryxhq.xyz/api/okxasp/health`}
          />
        </Section>

        <Section title="7. Agent loop (browser)">
          <p style={pStyle}>
            Prefer a visual walkthrough? The product page has a live agent loop
            that probes 402, shows the price, and walks the settle path.
          </p>
          <p style={pStyle}>
            <Link href="/okxasp#agent-loop" className="okx-link">
              Open the agent loop on /okxasp
            </Link>
          </p>
        </Section>

        <div
          style={{
            marginTop: 48,
            padding: 24,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
          }}
        >
          <h2 style={{ ...h2, marginTop: 0 }}>Why pay-per-call</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Agents should not hold shared API keys or burn monthly plans for a
            single answer. x402 prices the call in the open. You spend when the
            answer is worth it. Product thesis:{" "}
            <Link href="/okxasp/whitepaper" className="okx-link">
              read the note
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function ToolTable({
  tools,
}: {
  tools: ReturnType<typeof listOkxAspTools>;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {tools.map((tool, i) => {
        const slug = slugForToolId(tool.id)!;
        return (
          <div
            key={tool.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
              padding: "14px 16px",
              borderTop: i === 0 ? undefined : "1px solid var(--border)",
              background: "var(--surface-1)",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {tool.name}
              </div>
              <code style={{ ...codeInline, fontSize: 12 }}>
                /api/okxasp/tools/{slug}
              </code>
              <p
                style={{
                  ...pStyle,
                  fontSize: 13,
                  margin: "8px 0 0",
                  color: "var(--text-muted)",
                }}
              >
                {tool.summary}
              </p>
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
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div style={{ position: "relative", margin: "14px 0 18px" }}>
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
        <code>{code}</code>
      </pre>
      <div style={{ position: "absolute", top: 8, right: 8 }}>
        <CopyButton text={code} tag={lang} />
      </div>
    </div>
  );
}

const lead: React.CSSProperties = {
  fontSize: 16,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  marginBottom: 12,
};

const muted: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--text-muted)",
  lineHeight: 1.55,
};

const pStyle: React.CSSProperties = {
  fontSize: 14.5,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  margin: "0 0 12px",
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: "-0.015em",
  color: "var(--text-primary)",
  marginBottom: 12,
};

const codeInline: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12.5,
  padding: "1px 6px",
  borderRadius: 4,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};
