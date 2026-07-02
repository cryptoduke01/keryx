import Link from "next/link";

export const metadata = {
  title: "Docs · Kēryx",
  description: "How to publish paid tools and call them from any AI agent.",
};

export default function DocsPage() {
  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        Docs
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Two integrations. One page.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 40 }}>
        Kēryx sits between developers who publish tools and AI agents that
        pay to use them. Both sides fit on this page.
      </p>

      <Section title="For AI agents · call a tool">
        <p style={pStyle}>
          Every tool call is gated by x402. Hit the endpoint once, read
          the price tag, sign a USDC authorization, retry with the
          signature. Same request, two round trips.
        </p>
        <p style={pStyle}>
          <b>Step 1.</b> Call with no payment header. Get a{" "}
          <code style={codeInline}>402</code> back carrying the exact
          amount, USDC address, seller wallet, and Arc network id.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryxhq.xyz/api/call \\
  -H "content-type: application/json" \\
  -H "x-keryx-agent: my-agent" \\
  -d '{
    "toolId": "solana.token-activity",
    "args": { "mintOrSymbol": "BONK" }
  }'
# → HTTP 402
# {
#   "x402Version": 1,
#   "error": "X-PAYMENT header is required",
#   "accepts": [{
#     "scheme": "exact",
#     "network": "eip155:5042002",
#     "asset": "0x3600000000000000000000000000000000000000",
#     "amount": "5000",
#     "payTo": "0x8F47…26B6",
#     "maxTimeoutSeconds": 60
#   }]
# }`}
        />
        <p style={pStyle}>
          <b>Step 2.</b> Sign an EIP-3009 USDC{" "}
          <code style={codeInline}>transferWithAuthorization</code>{" "}
          against those requirements, base64-encode the signed payload,
          send it back in the{" "}
          <code style={codeInline}>X-PAYMENT</code> header. The response
          carries the tool result, the settlement tx hash, and the
          ledger entry id in one shot.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryxhq.xyz/api/call \\
  -H "content-type: application/json" \\
  -H "x-keryx-agent: my-agent" \\
  -H "x-payment: $SIGNED_PAYLOAD_BASE64" \\
  -d '{ "toolId": "solana.token-activity", "args": { "mintOrSymbol": "BONK" } }'
# → HTTP 200
# { "ok": true, "result": {...}, "settlement": { "mode": "gateway", "txHash": "0x…" } }`}
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
          Use the <Link href="/publish" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>publish form</Link>{" "}
          or POST directly. Your Arc wallet gets credited on every call,
          minus a 5% platform fee.
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryxhq.xyz/api/publishers/tools \\
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

      <Section title="For Claude Code, Cursor, and any MCP client" id="mcp">
        <p style={pStyle}>
          Kēryx runs a Model Context Protocol server at{" "}
          <code style={codeInline}>https://keryxhq.xyz/api/mcp</code>. Add it to
          your client's config and every tool in the registry shows up
          natively as a callable tool — no per-tool wiring, no wallet setup.
          Payment is sponsored in demo mode; the /live ledger records each
          call as it happens.
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "mcpServers": {
    "keryx": {
      "type": "http",
      "url": "https://keryxhq.xyz/api/mcp"
    }
  }
}`}
        />
        <p style={pStyle}>
          Drop that into{" "}
          <code style={codeInline}>~/.claude/mcp.json</code> (Claude Code) or
          your client's equivalent. Restart, and try:{" "}
          <i>&ldquo;use keryx to find the top BONK whales.&rdquo;</i>
        </p>
      </Section>

      <Section title="For coding agents · the SDK">
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

      <div style={{ marginTop: 16, padding: 16, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          For the full protocol design, pricing model, and settlement
          roadmap, read the{" "}
          <Link href="/whitepaper" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            whitepaper
          </Link>
          .
        </p>
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

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 80 }}>
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
