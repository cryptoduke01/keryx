import Link from "next/link";
import ArtPanel from "@/components/ArtPanel";
import CopyButton from "@/components/CopyButton";

export const metadata = {
  title: "OKX.AI docs · Keryx Finance Copilot",
  description:
    "How to call Keryx Finance Copilot tools on OKX.AI. Pay per call on X Layer with Agentic Wallet.",
};

export default function OkxAspDocsPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 36, width: "100%" }}>
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

      <div style={{ maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          OKX.AI · Docs
        </div>
        <h1 className="text-headline" style={{ marginBottom: 16 }}>
          Wire your agent to the Finance Copilot.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            marginBottom: 12,
          }}
        >
          Ten paid market tools on X Layer. Hit an HTTPS endpoint, pay USDT0
          when asked, get JSON back. Includes OKX Web3 market data, not only
          public scrapes.
        </p>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            lineHeight: 1.55,
            marginBottom: 40,
          }}
        >
          Product:{" "}
          <Link href="/okxasp" style={link}>
            /okxasp
          </Link>
          {" · "}
          Marketplace:{" "}
          <a href="https://okx.ai" target="_blank" rel="noreferrer" style={link}>
            okx.ai
          </a>
          {" · "}
          ASP tutorial:{" "}
          <a
            href="https://okx.ai/tutorial/asp"
            target="_blank"
            rel="noreferrer"
            style={link}
          >
            okx.ai/tutorial/asp
          </a>
        </p>

        <Section title="1. Discover tools">
          <p style={pStyle}>
            Free catalog. Pick an endpoint and see prices before you pay.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl https://keryxhq.xyz/api/okxasp/catalog`}
          />
        </Section>

        <Section title="2. Call without payment">
          <p style={pStyle}>
            First request returns <code style={codeInline}>402</code>. The
            Payment-Required header carries amount, asset, network, and pay-to.
            In a browser you get a clear paywall with the USDT0 price.
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
            Use OKX Agentic Wallet or Onchain OS to settle the 402, then retry.
            A successful call returns JSON from the tool.
          </p>
          <CodeBlock
            lang="bash"
            code={`# After payment:
curl "https://keryxhq.xyz/api/okxasp/tools/okx-token-price?address=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&chain=ethereum"
# → { "toolId": "okx.token-price", "result": { "priceUsd": ..., "source": "okx-web3" } }`}
          />
        </Section>

        <Section title="OKX-native tools">
          <p style={pStyle}>
            These hit OKX Web3 market APIs with our seller credentials. That is
            the edge versus wrapping CoinGecko alone.
          </p>
          <ul style={{ ...pStyle, paddingLeft: 18 }}>
            <li>
              <code style={codeInline}>/api/okxasp/tools/okx-token-price</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/okx-token-market</code>
            </li>
          </ul>
        </Section>

        <Section title="Full endpoint list">
          <ul style={{ ...pStyle, paddingLeft: 18 }}>
            <li>
              <code style={codeInline}>/api/okxasp/tools/crypto-price</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/crypto-trending</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/crypto-btc-dominance</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/solana-token-activity</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/solana-rug-check</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/solana-launches</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/finance-convert</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/finance-exchange-rates</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/okx-token-price</code>
            </li>
            <li>
              <code style={codeInline}>/api/okxasp/tools/okx-token-market</code>
            </li>
          </ul>
        </Section>

        <p style={{ ...pStyle, marginTop: 32 }}>
          Product thesis:{" "}
          <Link href="/okxasp/whitepaper" style={link}>
            read the note
          </Link>
          .
        </p>
      </div>
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
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
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

const pStyle: React.CSSProperties = {
  fontSize: 14.5,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  margin: "0 0 12px",
};

const link: React.CSSProperties = {
  color: "var(--text-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
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
