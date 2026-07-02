import Link from "next/link";

export const metadata = {
  title: "Docs · Kēryx",
  description: "How to publish paid tools and call them from any AI agent.",
};

export default function DocsPage() {
  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
        Docs
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Two integrations. One page.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 40 }}>
        Kēryx sits between developers who publish tools and AI agents that
        pay to use them. Both sides fit on this page. Full OpenAPI + MCP
        server ship day 3.
      </p>

      <Section title="For AI agents · call a tool">
        <p style={pStyle}>
          Any HTTP-capable agent can call tools directly. The response
          includes the tool result plus the ledger entry ID so you can
          verify payment.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryx.dev/api/call \\
  -H "content-type: application/json" \\
  -H "x-keryx-agent: my-agent" \\
  -d '{
    "toolId": "solana.whales",
    "args": { "token": "BONK", "limit": 5 }
  }'`}
        />
        <p style={pStyle}>
          Discover tools first with{" "}
          <code style={codeInline}>GET /api/tools</code>. Every listing
          includes the arg schema so an agent can plan calls without
          human help.
        </p>
      </Section>

      <Section title="For publishers · list your endpoint">
        <p style={pStyle}>
          Use the <Link href="/publish" style={{ color: "var(--accent)" }}>publish form</Link>{" "}
          or POST directly. Your Arc wallet gets credited on every call,
          minus a 5% platform fee.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryx.dev/api/publishers/tools \\
  -H "content-type: application/json" \\
  -d '{
    "id": "search.web",
    "name": "Grounded Web Search",
    "summary": "Web search that returns clean snippets + source URLs.",
    "category": "search",
    "priceUsd": 0.004,
    "publisherWallet": "0xYourArcWallet…",
    "publisherName": "Your handle"
  }'`}
        />
      </Section>

      <Section title="For coding agents · the SDK (ships day 3)">
        <p style={pStyle}>
          The <code style={codeInline}>@keryx/middleware</code> package
          wraps any Express / Next / Hono handler with x402 pricing and
          Circle Gateway settlement.
        </p>
        <CodeBlock
          lang="ts"
          code={`import { withKeryxPrice } from "@keryx/middleware";

export const POST = withKeryxPrice({
  toolId: "search.web",
  priceUsd: 0.004,
  publisherWallet: process.env.KERYX_WALLET!,
})(async (req) => {
  const { query } = await req.json();
  const results = await mySearch(query);
  return Response.json({ results });
});`}
        />
      </Section>

      <div style={{ marginTop: 32, padding: 16, borderTop: "1px solid var(--border)" }}>
        <div className="text-eyebrow" style={{ marginBottom: 8 }}>
          Coming this week
        </div>
        <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li>MCP server so Claude Code / Cursor discover Kēryx tools natively</li>
          <li>Publisher signature verification (EIP-191)</li>
          <li>Live x402 quote endpoint with Circle Gateway batching</li>
          <li>OpenAPI spec + SDKs (Node, Python)</li>
        </ul>
      </div>
    </div>
  );
}

const pStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  marginBottom: 12,
};

const codeInline: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  padding: "1px 6px",
  borderRadius: 4,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 className="text-subtitle" style={{ color: "var(--text-primary)", marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <pre
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        lineHeight: 1.55,
        overflowX: "auto",
        color: "var(--text-primary)",
        marginBottom: 14,
      }}
    >
      {lang && (
        <div className="text-eyebrow" style={{ marginBottom: 8, fontSize: 9 }}>
          {lang}
        </div>
      )}
      <code>{code}</code>
    </pre>
  );
}
