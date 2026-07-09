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
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 28, maxWidth: 520 }}>
        <ArtPanel
          src="/inspo/okx-docs.png"
          alt=""
          aspectRatio="21 / 9"
          position="50% 40%"
          variant="raw"
        />
      </div>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        OKX.AI · Docs
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Call the Finance Copilot.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12 }}>
        Eight paid market tools on X Layer. Your agent hits an HTTPS endpoint,
        pays USDT0 when asked, and gets JSON back. No signup on our side.
      </p>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 40 }}>
        Product page:{" "}
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
          Free catalog. Use it to pick an endpoint and see prices before you pay.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl https://keryxhq.xyz/api/okxasp/catalog`}
        />
      </Section>

      <Section title="2. Call without payment">
        <p style={pStyle}>
          First request returns <code style={codeInline}>402</code>. The
          Payment-Required header carries the amount, asset, network, and pay-to
          address. In a browser you may see a plain &quot;Payment Required&quot;
          page. Agents should read the header or JSON accepts list.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -i "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=bitcoin&vs=usd"
# HTTP/2 402
# payment-required: <base64 x402 payload>
# amount is USDT0 on X Layer (eip155:1952 testnet / eip155:196 mainnet)`}
        />
      </Section>

      <Section title="3. Pay and retry">
        <p style={pStyle}>
          Use OKX Agentic Wallet or the Onchain OS payment flow to settle the
          402, then retry the same URL with the payment proof. A successful call
          returns the tool result as JSON.
        </p>
        <CodeBlock
          lang="bash"
          code={`# After payment (Agentic Wallet / Onchain OS handles the header):
curl "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=bitcoin,ethereum&vs=usd"
# → { "toolId": "crypto.price", "result": { ... }, "settlement": "okx-xlayer" }`}
        />
      </Section>

      <Section title="Endpoints">
        <p style={pStyle}>
          All tools accept GET (query params) and POST (JSON body). Prices are
          per call.
        </p>
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
        </ul>
      </Section>

      <Section title="Seller SDK">
        <p style={pStyle}>
          These routes use{" "}
          <code style={codeInline}>@okxweb3/x402-next</code> with{" "}
          <code style={codeInline}>OKXFacilitatorClient</code>. If you are
          building your own ASP, start here:
        </p>
        <p style={pStyle}>
          <a
            href="https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk"
            target="_blank"
            rel="noreferrer"
            style={link}
          >
            Seller SDK docs
          </a>
        </p>
      </Section>

      <p style={{ ...pStyle, marginTop: 32 }}>
        Want the product thesis?{" "}
        <Link href="/okxasp/whitepaper" style={link}>
          Read the product note
        </Link>
        .
      </p>
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
