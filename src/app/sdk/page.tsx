import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const metadata = {
  title: "SDK · @keryxhq/middleware",
  description:
    "Turn any HTTP handler into a paid tool for AI agents. One npm install, one wrapper function, done. Speaks x402, settles USDC on Arc.",
};

const NEXT_EXAMPLE = `// app/api/my-tool/route.ts
import { paidHandler } from "@keryxhq/middleware/next";

export const POST = paidHandler({
  price: 0.004,                           // USD per call
  wallet: "0xYourArcWallet...",           // where payment lands
  description: "Web search over indexed docs.",
  handler: async ({ query }: { query: string }) => {
    return { results: await mySearch(query) };
  },
});`;

const EXPRESS_EXAMPLE = `import express from "express";
import { paidExpress } from "@keryxhq/middleware/express";

const app = express();
app.use(express.json());

app.post(
  "/api/my-tool",
  paidExpress({
    price: 0.004,
    wallet: "0xYourArcWallet...",
    description: "Web search over indexed docs.",
  }),
  (req, res) => {
    // req.keryxPayment holds the verified receipt
    res.json({ results: mySearch(req.body.query) });
  },
);`;

const PRIMITIVES_EXAMPLE = `import {
  buildRequirements,
  decodePaymentHeader,
  verifyPayment,
  buildX402Body,
} from "@keryxhq/middleware";

// Use these if you're not on Next.js or Express — Cloudflare Workers,
// Deno, Fastify, Hono, bare Node http.Server, etc.`;

const FLOW_STEPS: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Agent calls your endpoint",
    body:
      "POST /api/my-tool with no X-PAYMENT header. The SDK returns HTTP 402 + a machine-readable body: exact USDC amount, asset address, your wallet, network, expiry.",
  },
  {
    n: "02",
    title: "Agent signs and retries",
    body:
      "The agent reads the 402, signs an EIP-3009 USDC authorization to your wallet for the exact amount, base64-encodes it, retries the same request with X-PAYMENT set.",
  },
  {
    n: "03",
    title: "SDK verifies, your handler runs",
    body:
      "Three-tier verification: structural (amount, recipient, expiry), cryptographic (EIP-3009 signer recovery via viem), and optional settlement (facilitator broadcasts onchain and returns a tx hash). Your handler runs with the receipt attached — you never touch the payment logic.",
  },
];

export default function SdkPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 32, maxWidth: 760 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          SDK · v0.1
        </div>
        <h1 className="text-headline" style={{ marginBottom: 14 }}>
          Ship a paid tool in five minutes.
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          <code style={inlineCode}>@keryxhq/middleware</code> wraps any HTTP
          handler so agents can pay per call with x402 + USDC on Arc. Zero
          runtime deps.{" "}
          <b style={{ color: "var(--text-primary)" }}>
            You are payTo onchain (100% of the call today). The 5% platform fee is ledger accounting until split settlement ships.
          </b>
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px 10px 16px",
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--surface-2)",
            maxWidth: 560,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13.5 }}>$</span>
          <span
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              color: "var(--text-primary)",
              overflow: "auto",
              whiteSpace: "nowrap",
            }}
          >
            pnpm add @keryxhq/middleware viem
          </span>
          <CopyButton text="pnpm add @keryxhq/middleware viem" />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <a
            href="https://www.npmjs.com/package/@keryxhq/middleware"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              fontSize: 12.5,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 3,
                background: "#cb3837",
                color: "white",
                letterSpacing: "0.06em",
              }}
            >
              npm
            </span>
            <span>@keryxhq/middleware</span>
            <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
          </a>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Also works with npm and yarn. <code style={inlineCode}>viem</code> is a peer dep.
          </span>
        </div>
      </div>

      {/* -------------------- Next.js example -------------------- */}
      <section style={{ marginBottom: 44 }}>
        <div style={sectionHeader}>
          <div className="text-eyebrow">Next.js</div>
          <h2 style={sectionH2}>The whole integration.</h2>
        </div>
        <CodeBlock code={NEXT_EXAMPLE} />
        <p style={belowCode}>
          First hit returns 402. Agent pays. Your handler runs. That&rsquo;s the whole thing.
        </p>
      </section>

      {/* -------------------- Flow -------------------- */}
      <section style={{ marginBottom: 44 }}>
        <div style={sectionHeader}>
          <div className="text-eyebrow">What happens under the hood</div>
          <h2 style={sectionH2}>Three steps. The SDK does all three.</h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {FLOW_STEPS.map((s) => (
            <div key={s.n} className="card" style={{ padding: 22 }}>
              <div
                className="text-mono"
                style={{
                  fontSize: 12,
                  color: "var(--text-faint)",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                {s.n}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                  letterSpacing: "-0.005em",
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------- Express example -------------------- */}
      <section style={{ marginBottom: 44 }}>
        <div style={sectionHeader}>
          <div className="text-eyebrow">Express</div>
          <h2 style={sectionH2}>Same idea, connect-style.</h2>
        </div>
        <CodeBlock code={EXPRESS_EXAMPLE} />
      </section>

      {/* -------------------- Primitives -------------------- */}
      <section style={{ marginBottom: 44 }}>
        <div style={sectionHeader}>
          <div className="text-eyebrow">Not on Next.js or Express?</div>
          <h2 style={sectionH2}>Use the framework-agnostic primitives.</h2>
        </div>
        <CodeBlock code={PRIMITIVES_EXAMPLE} />
        <p style={belowCode}>
          Cloudflare Workers, Deno, Hono, Fastify, bare Node <code style={inlineCode}>http.Server</code>. If you can read a header, you can accept x402.
        </p>
      </section>

      {/* -------------------- Networks + settlement -------------------- */}
      <section style={{ marginBottom: 44 }}>
        <div style={sectionHeader}>
          <div className="text-eyebrow">Networks</div>
          <h2 style={sectionH2}>Arc-native, USDC-priced.</h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14, maxWidth: 640 }}>
          The SDK ships with two Arc networks baked in. Arc is a stablecoin-native chain built by Circle where gas itself is denominated in USDC, so a sub-cent call doesn&rsquo;t get eaten alive by transaction fees. That&rsquo;s the only price band where per-call payments make sense.
        </p>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--surface-1)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th style={th}>Network</th>
                <th style={th}>Chain id</th>
                <th style={th}>USDC address</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: "arc-testnet (default)", id: "5042002", a: "0x3600…0000" },
                { n: "arc-mainnet", id: "5042001", a: "0x3600…0000" },
              ].map((row) => (
                <tr key={row.n} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>{row.n}</td>
                  <td style={td}>{row.id}</td>
                  <td style={td}>{row.a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* -------------------- CTA -------------------- */}
      <section
        style={{
          marginTop: 56,
          padding: 28,
          border: "1px solid var(--border)",
          borderRadius: 14,
          background: "var(--surface-1)",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          alignItems: "center",
        }}
        className="sdk-cta"
      >
        <div>
          <div className="text-eyebrow" style={{ marginBottom: 8 }}>
            Ready to list your tool?
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 6 }}>
            Deploy the wrapped handler. Publish the URL. Get paid.
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            One page. Wallet-signed. Your tool is discoverable to every agent in Claude, Cursor, and GitHub Copilot via MCP.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href="/publish" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary">Publish a tool →</button>
          </Link>
          <a
            href="https://github.com/cryptoduke01/keryx/tree/main/packages/keryx-middleware"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button className="btn">Source on GitHub</button>
          </a>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 720px) {
              .sdk-cta { grid-template-columns: 1fr !important; }
              .sdk-cta > div:last-child { justify-content: flex-start !important; }
            }
          `,
        }}
      />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--surface-1)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <CopyButton text={code} tag="typescript" />
      </div>
      <pre
        style={{
          margin: 0,
          padding: 20,
          paddingTop: 44,
          overflowX: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--text-primary)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

const inlineCode: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  padding: "1px 6px",
  borderRadius: 4,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
};

const sectionHeader: React.CSSProperties = {
  marginBottom: 18,
};

const sectionH2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(1.5rem, 2.4vw, 1.9rem)",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
  marginTop: 6,
};

const belowCode: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  marginTop: 10,
  lineHeight: 1.55,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const td: React.CSSProperties = {
  padding: "10px 14px",
  color: "var(--text-primary)",
};
