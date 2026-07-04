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
      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 32 }}>
        Note: many seeded tools provide reliable structured access to public data sources.
        Agents can still fetch some of this data for free elsewhere. Kēryx's value is the unified payment,
        discovery, settlement, and MCP interface — especially as the catalog grows with paid creator and proprietary tools.
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
        <p style={pStyle}>
          <b>Seeded tools</b> (Kēryx runs the handler) are executable out of the box by /ask, MCP, and /api/call.
          Community tools are listed immediately. To make a published tool executable by Kēryx today, provide a simple HTTPS POST endpoint that returns JSON (see publish form for exact contract).
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://keryxhq.xyz/api/publishers/tools \\
  -H "content-type: application/json" \\
  -d '{
    "id": "my.tool",
    "name": "My Tool",
    "summary": "Does one useful thing for agents.",
    "category": "utility",
    "priceUsd": 0.003,
    "publisherWallet": "0xYourArcWallet…",
    "publisherName": "You"
  }'`}
        />
      </Section>

      <Section title="For Claude Code, Cursor, GitHub Copilot, and any MCP client" id="mcp">
        <p style={pStyle}>
          <b>Real agents do not use our /ask chat.</b> They talk directly to Kēryx via the Model Context Protocol.
          Add the MCP server once and the agent gets the full catalog (20+ seeded tools + any community-published tools) as native tools.
        </p>

        <div style={{ margin: "16px 0 20px", padding: "14px 18px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Available in the agents you already use
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logos/cursor.png" alt="Cursor" width="22" height="22" style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Cursor</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logos/claude.png" alt="Claude" width="22" height="22" style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Claude</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logos/copilot.png" alt="GitHub Copilot" width="22" height="22" style={{ objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>GitHub Copilot</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>+ any MCP client</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
            Logos from official sources: Cursor (cursor.com/brand), Anthropic press kit, GitHub Brand Toolkit.
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          <strong>Note on payments:</strong> Through MCP, tool calls are currently executed in <strong>demo/subsidized mode</strong> (Kēryx covers the cost while MCP clients do not yet support wallets). 
          For real paid calls with USDC settlement on Arc, use the direct <code>/api/call</code> endpoint or the <Link href="/ask">/ask</Link> playground (which now uses your configured Gateway).
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

        <h3 style={{ fontSize: 15, marginTop: 24, marginBottom: 8 }}>Cursor</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* Official Cursor logos available at https://cursor.com/brand */}
          <img src="/logos/cursor.png" alt="Cursor" width="20" height="20" style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 600 }}>Cursor</span>
        </div>
        <p style={pStyle}>
          Add the JSON block above to your Cursor settings (Tools &amp; MCP) or project <code>.cursor/mcp.json</code>.
          <br />
          Or install the repo as a plugin: symlink to <code>~/.cursor/plugins/local/keryx</code> or submit to the Cursor Marketplace.
        </p>

        <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>Claude (Claude.ai, Claude Code, Claude Desktop)</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* Official Anthropic / Claude assets: anthropic.com/news → Media assets / press kit */}
          <img src="/logos/claude.png" alt="Claude" width="20" height="20" style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 600 }}>Claude by Anthropic</span>
        </div>
        <p style={pStyle}>
          Add as a custom connector:
        </p>
        <ul style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, paddingLeft: 20 }}>
          <li>Go to <strong>Settings → Connectors</strong> (or "Add custom connector")</li>
          <li>Use the URL: <code>https://keryxhq.xyz/api/mcp</code></li>
          <li>Paste the config block above if your client asks for it.</li>
        </ul>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Note: The official Claude Connectors Directory requires a Team or Enterprise plan. With a Pro plan you can still add it manually using the URL.
        </p>

        <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 8 }}>GitHub Copilot (VS Code / Copilot CLI)</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* GitHub Copilot lockups: brand.github.com/brand-identity/copilot (note: as of 2025, prefers product lockups over standalone icon) */}
          <img src="/logos/copilot.png" alt="GitHub Copilot" width="20" height="20" style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 600 }}>GitHub Copilot</span>
        </div>
        <p style={pStyle}>
          Add to <code>.vscode/mcp.json</code> (project) or your user MCP config:
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "servers": {
    "keryx": {
      "type": "http",
      "url": "https://keryxhq.xyz/api/mcp"
    }
  }
}`}
        />
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Or via CLI: <code>copilot mcp add keryx --transport http --url https://keryxhq.xyz/api/mcp</code>
        </p>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16 }}>
          One config. 20 real seeded tools + community-published tools. 
          Direct calls (outside MCP) are paid per call in sub-cent USDC on Arc.
        </p>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>OpenAI Codex</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Kēryx tools can be exposed to OpenAI Codex agents. See the official build guide:
            {" "}
            <a href="https://developers.openai.com/codex/plugins/build" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              developers.openai.com/codex/plugins/build
            </a>
          </p>
        </div>
      </Section>

      <Section title="For publishers · integrate x402 yourself (SDKs planned)">
        <p style={pStyle}>
          First-party SDKs and an <code style={codeInline}>@keryx/*</code> middleware are planned.
          Today you can implement the x402 flow directly (return 402 with price requirements, accept <code>X-PAYMENT</code>, settle via the same facilitator logic) or point a simple <code>handlerUrl</code> at your existing endpoint and let Kēryx handle payment + forwarding.
        </p>
        <p style={pStyle}>
          See the whitepaper for the settlement modes and the publish form for the exact contract when providing a <code>handlerUrl</code>.
        </p>
      </Section>

      <div style={{ marginTop: 32, padding: 16, borderTop: "1px solid var(--border)" }}>
        <div className="text-eyebrow" style={{ marginBottom: 8 }}>
          Live today
        </div>
        <ul style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li>20 seeded executable tools (Solana onchain research, weather, finance/rates, geo, search, crypto signals, utilities, time, uuid) — real public data or fresh computation</li>
          <li>Anyone can publish tools. Provide a <code>handlerUrl</code> to make them executable by Kēryx surfaces.</li>
          <li>Full x402 flow + public ledger. MCP server works with Claude, Cursor, GitHub Copilot, and any MCP client.</li>
          <li>OpenAPI spec at <a href="/keryx-openapi.json" style={{ textDecoration: "underline" }}>/keryx-openapi.json</a></li>
          <li>Onchain registry contract (KeryxRegistry.sol) + EIP-191 publisher ownership</li>
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
