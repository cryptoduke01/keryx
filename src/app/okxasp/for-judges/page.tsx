import Link from "next/link";
import {
  listOkxAspTools,
  priceUsdToOkxPrice,
  slugForToolId,
  OKX_ASP_ID,
  OKX_ASP_LISTING_URL,
  OKX_ASP_DISPLAY_NAME,
  isOkxNativeToolId,
} from "@/lib/okxasp/config";
import { okxAspMetadata } from "@/lib/okxasp/metadata";

export const metadata = okxAspMetadata({
  title: `For judges · ${OKX_ASP_DISPLAY_NAME} · ASP #${OKX_ASP_ID}`,
  description:
    "OKX.AI Genesis judge one-pager: ASP #4759 Finance Copilot, A2MCP, USDT0 on X Layer. Not the Arc/Lepton track.",
  path: "/okxasp/for-judges",
});

/**
 * OKX Genesis only. No Arc, no USDC, no /api/call.
 */
export default function OkxAspForJudgesPage() {
  const tools = listOkxAspTools();
  const native = tools.filter((t) => isOkxNativeToolId(t.id));
  const coverage = tools.filter((t) => !isOkxNativeToolId(t.id));

  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        For judges · OKX.AI Genesis · X Layer
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        ASP #{OKX_ASP_ID} · Finance Copilot
      </h1>
      <p style={lead}>
        <b style={{ color: "var(--text-primary)" }}>Score this surface only.</b>{" "}
        A2MCP pack on OKX.AI: agents pay per call in{" "}
        <b style={{ color: "var(--text-primary)" }}>USDT0 on X Layer</b> via OKX
        Agent Payments Protocol (402 → pay → JSON). This is{" "}
        <b style={{ color: "var(--text-primary)" }}>not</b> the Lepton / Arc
        registry (
        <Link href="/for-judges" className="okx-link">
          /for-judges
        </Link>
        ).
      </p>

      <div style={callout}>
        <b style={{ color: "var(--text-primary)" }}>Do not mix rails.</b> No
        Arc · no USDC · no <code style={code}>POST /api/call</code>. Listing:{" "}
        <a href={OKX_ASP_LISTING_URL} target="_blank" rel="noreferrer" className="okx-link">
          okx.ai/agents/{OKX_ASP_ID}
        </a>
        .
      </div>

      <Section title="1 · Prove the product (cold path)">
        <ol style={ol}>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Listing</b> — open{" "}
            <a href={OKX_ASP_LISTING_URL} target="_blank" rel="noreferrer" className="okx-link">
              ASP #{OKX_ASP_ID}
            </a>{" "}
            · confirm LIVE · A2MCP services · prices in USDT.
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Catalog</b> — free JSON:
            <pre style={pre}>{`curl -sS https://keryxhq.xyz/api/okxasp/catalog | head -c 800`}</pre>
            Expect <code style={code}>listingStatus: &quot;listed&quot;</code>,{" "}
            <code style={code}>native: true/false</code> per tool,{" "}
            <code style={code}>buyerNote</code> about payTo.
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>402 challenge</b> —
            unpaid probe:
            <pre style={pre}>{`curl -sS -D - -o /dev/null \\
  "https://keryxhq.xyz/api/okxasp/tools/crypto-price?ids=bitcoin" \\
  -H "Accept: application/json" \\
  -H "User-Agent: OKX-A2MCP-Client/1.0"
# expect HTTP 402 + PAYMENT-REQUIRED + network eip155:196`}</pre>
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Pay + JSON</b> — paste
            marketplace <b>USE NOW</b> prompt into an agent with Onchain OS /
            Agentic Wallet.{" "}
            <b style={{ color: "var(--text-primary)" }}>
              Buyer wallet must not equal seller payTo
            </b>{" "}
            or the platform returns <code style={code}>payer_blocked</code>.
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Optional task path</b> —
            Task marketplace (User identity → assign ASP #{OKX_ASP_ID} → x402
            pay → complete → review) is separate from Sold volume; reviews feed
            reputation.
          </li>
        </ol>
      </Section>

      <Section title="2 · Tool honesty">
        <p style={p}>
          <b style={{ color: "var(--text-primary)" }}>
            {native.length} OKX Web3 · native
          </b>{" "}
          — signed seller calls to OKX market/wallet APIs.
        </p>
        <ul style={ul}>
          {native.map((t) => (
            <li key={t.id} style={li}>
              {t.name} · {priceUsdToOkxPrice(t.priceUsd)} ·{" "}
              <code style={code}>/api/okxasp/tools/{slugForToolId(t.id)}</code>
            </li>
          ))}
        </ul>
        <p style={{ ...p, marginTop: 16 }}>
          <b style={{ color: "var(--text-primary)" }}>
            {coverage.length} Coverage
          </b>{" "}
          — public feeds (CoinGecko-class, DexScreener, rugcheck, FX) so the
          agent stays in one pack. Catalog marks{" "}
          <code style={code}>native: false</code>.
        </p>
        <ul style={ul}>
          {coverage.map((t) => (
            <li key={t.id} style={li}>
              {t.name} · {priceUsdToOkxPrice(t.priceUsd)}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="3 · Reliability notes">
        <ul style={ul}>
          <li style={li}>
            Facilitator lag may return status{" "}
            <code style={code}>timeout</code> with <code style={code}>success</code>{" "}
            + tx. We still deliver tool JSON and set{" "}
            <code style={code}>payment.provisional: true</code> — reconcile by
            tx hash.
          </li>
          <li style={li}>
            Sold / reviews: marketplace listing is source of truth, not this
            site&apos;s health endpoint.
          </li>
          <li style={li}>
            Product page:{" "}
            <Link href="/okxasp" className="okx-link">
              /okxasp
            </Link>{" "}
            · Docs:{" "}
            <Link href="/okxasp/docs" className="okx-link">
              /okxasp/docs
            </Link>
          </li>
        </ul>
      </Section>

      <Section title="4 · Award fit (self-map, not a promise)">
        <ul style={ul}>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Best Product</b> —
            completeness, native+coverage pack, live 402, agent loop.
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Finance Copilot</b> —
            explicit finance use case for agents mid-task.
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Revenue Rocket</b> —
            marketplace Sold + reviews (judge live listing, not raw API banners).
          </li>
          <li style={li}>
            <b style={{ color: "var(--text-primary)" }}>Social Buzz</b> — X post
            + #OKXAI + ≤90s demo.
          </li>
        </ul>
      </Section>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 40,
          textAlign: "center",
        }}
      >
        Lepton / Arc judges:{" "}
        <Link href="/for-judges" className="okx-link">
          /for-judges
        </Link>{" "}
        only.
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
    <section
      style={{
        marginBottom: 28,
        padding: 24,
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface-1)",
      }}
    >
      <h2
        className="text-subtitle"
        style={{ color: "var(--text-primary)", marginBottom: 14, fontSize: 18 }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const lead: React.CSSProperties = {
  fontSize: 15,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  marginBottom: 20,
  maxWidth: 640,
};
const callout: React.CSSProperties = {
  marginBottom: 28,
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid rgba(184,255,60,0.25)",
  background: "rgba(184,255,60,0.06)",
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.55,
};
const p: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.65,
  marginBottom: 10,
};
const ol: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  margin: 0,
};
const ul: React.CSSProperties = {
  paddingLeft: 20,
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  margin: 0,
};
const li: React.CSSProperties = { marginBottom: 10 };
const code: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12.5,
  color: "var(--text-primary)",
};
const pre: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 4,
  padding: 12,
  borderRadius: 8,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-primary)",
  overflowX: "auto",
  whiteSpace: "pre-wrap",
};
