import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import { ledgerStats, readEntries } from "@/lib/ledger";
import { getFacilitator } from "@/lib/x402/facilitator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For judges · Keryx · Lepton (Arc)",
  description:
    "Lepton / Arc track one-pager: autonomous buyer path, real Arcscan settlement, registry + SDK. OKX Genesis is a separate track.",
  robots: { index: false, follow: true },
};

const CONTRACT = "0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7";
const ARCSCAN_CONTRACT = `https://testnet.arcscan.app/address/${CONTRACT}`;
const REPO = "https://github.com/cryptoduke01/keryx";
const NPM = "https://www.npmjs.com/package/@keryxhq/middleware";
const MCP_URL = "https://keryxhq.xyz/api/mcp";
/** Fallback proof tx if the live ledger window has no onchain paid row. */
const FALLBACK_TX =
  "0xf1d3afcef3a0037036b4ac2cf24560d67ba7d5aee10bf23850243dcbc381cec1";

export default async function ForJudgesPage() {
  const [tools, stats, recent] = await Promise.all([
    listTools(),
    ledgerStats(),
    readEntries(80),
  ]);
  const executableCount = tools.filter((t) => !t.id.startsWith("demo.")).length;
  const facilitatorMode = getFacilitator().mode;

  const proof =
    recent.find(
      (e) =>
        e.status === "paid" &&
        e.txHash?.startsWith("0x") &&
        !e.txHash.startsWith("demo_") &&
        (e.settlementMode === "local" || e.settlementMode === "gateway"),
    ) ?? null;
  const proofTx = proof?.txHash ?? FALLBACK_TX;
  const proofArcscan = `https://testnet.arcscan.app/tx/${proofTx}`;
  const proofLedgerId = proof?.id;

  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        For judges · Lepton Agents · Arc / Circle
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Autonomous agents that pay on Arc.
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          marginBottom: 20,
          maxWidth: 640,
        }}
      >
        Keryx is a <b style={{ color: "var(--text-primary)" }}>paid tool
        registry for AI agents</b> on Arc: discover → HTTP 402 → EIP-3009 USDC
        → result. This page is the <b style={{ color: "var(--text-primary)" }}>
        Lepton / Arc</b> track. OKX.AI Genesis is a separate product surface
        (see bottom) — do not score them as one submission.
      </p>

      <div
        style={{
          marginBottom: 36,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
        }}
      >
        <b style={{ color: "var(--text-primary)" }}>RFB fit (honest):</b> RFB05
        nanopayment tooling + RFB02/03 style agent↔API commerce. We do{" "}
        <b style={{ color: "var(--text-primary)" }}>not</b> claim RFB01
        agent-to-agent networks yet — agents pay publishers/APIs today, not
        each other in multi-hop escrow.
      </div>

      {/* -------------------- TL;DR strip -------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        <Stat label="Paid calls settled" value={String(stats.callCount)} />
        <Stat
          label="Volume settled"
          value={`$${stats.totalPaidUsd.toFixed(3)}`}
        />
        <Stat label="Executable tools" value={String(executableCount)} />
        <Stat label="Unique agent callers" value={String(stats.callerCount)} />
        <Stat label="Facilitator" value={facilitatorMode} />
      </div>

      {/* -------------------- STEP 1: Autonomous hero -------------------- */}
      <Section title="1 · Prove agency (wallet agent pays)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14 }}>
          <b style={{ color: "var(--text-primary)" }}>Score this step first.</b>{" "}
          Agency = wallet agent pays on Arc — not the sponsored{" "}
          <code style={code}>/ask</code> playground (that is Step &ldquo;optional&rdquo;).
          Path: quickstart → <code style={code}>POST /api/call</code> → 402 →
          EIP-3009 → settle USDC → <code style={code}>POST /api/receipt/verify</code>{" "}
          → expect <code style={code}>tier: R5</code> + Arcscan.
        </p>

        <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 18 }}>
          <li style={{ marginBottom: 10 }}>
            <b style={{ color: "var(--text-primary)" }}>Quickstart</b> —{" "}
            <Link href="/quickstart.ts" style={inlineLink}>/quickstart.ts</Link>
            {" "}or{" "}
            <Link href="/quickstart.py" style={inlineLink}>/quickstart.py</Link>
            <pre style={pre}>
{`npm i @x402/fetch @x402/evm viem tsx
export PRIVATE_KEY=0x…   # Arc testnet + test USDC
curl -O https://keryxhq.xyz/quickstart.ts
npx tsx quickstart.ts`}
            </pre>
          </li>
          <li style={{ marginBottom: 10 }}>
            <b style={{ color: "var(--text-primary)" }}>Paid call</b> — script
            POSTs <code style={code}>/api/call</code> → HTTP 402 (with root{" "}
            <code style={code}>extensions.bazaar</code>) → signs EIP-3009 →
            retries with <code style={code}>X-PAYMENT</code> → HTTP 200 +
            result + <code style={code}>ledgerEntry.id</code>.
          </li>
          <li style={{ marginBottom: 10 }}>
            <b style={{ color: "var(--text-primary)" }}>Receipt verify (R5)</b> —{" "}
            free proof beyond HTTP 200. Hits Arc RPC{" "}
            <code style={code}>eth_getTransactionReceipt</code>:
            <pre style={pre}>
{`curl -sS -X POST https://keryxhq.xyz/api/receipt/verify \\
  -H 'content-type: application/json' \\
  -d '{"txHash":"${proofTx}"}'
# expect: "tier":"R5", "onchain":{"status":"success", ...}`}
            </pre>
            {proofLedgerId && (
              <>
                Or by ledger id:{" "}
                <code style={code}>{`{"id":"${proofLedgerId}"}`}</code>
              </>
            )}
          </li>
          <li style={{ marginBottom: 10 }}>
            <b style={{ color: "var(--text-primary)" }}>Arcscan</b> — open the
            settlement tx:{" "}
            <a href={proofArcscan} target="_blank" rel="noreferrer" style={inlineLink}>
              {proofTx.slice(0, 10)}…{proofTx.slice(-6)}
            </a>
            {proof && (
              <>
                {" "}
                · tool <code style={code}>{proof.toolId}</code> · mode{" "}
                <code style={code}>{proof.settlementMode}</code>
              </>
            )}
          </li>
        </ol>

        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 12 }}>
          Optional Loom: record a 60s terminal run of the quickstart (no
          browser) and paste the link in the submission form / Discord.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href="/api/demo?toolId=crypto.price" style={chipLink}>Free sample first →</a>
          <a href="/live" style={chipLink}>Public ledger →</a>
          <a href={proofArcscan} target="_blank" rel="noreferrer" style={chipLink}>
            Example Arcscan tx →
          </a>
        </div>
      </Section>

      {/* -------------------- Circle / settlement -------------------- */}
      <Section title="2 · Circle / Arc settlement (own the local story)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12 }}>
          Live facilitator mode on this deploy:{" "}
          <b style={{ color: "var(--text-primary)" }}>{facilitatorMode}</b>.
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 12 }}>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>local</b> (typical
            prod) = Keryx facilitator wallet broadcasts real EIP-3009{" "}
            <code style={code}>transferWithAuthorization</code> on Arc
            testnet. Tx hashes on{" "}
            <Link href="/live" style={inlineLink}>/live</Link> open on Arcscan.
          </li>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>gateway</b> = Circle
            Gateway batched settlement when{" "}
            <code style={code}>CIRCLE_GATEWAY_PREFERRED=true</code> and{" "}
            <code style={code}>CIRCLE_GATEWAY_API_URL</code> are set. Coded in{" "}
            <code style={code}>src/lib/x402/facilitator.ts</code>. Local is the
            default when a facilitator key is present (Gateway was failing
            sponsored settles when preferred blindly).
          </li>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>demo</b> = cold-clone
            fallback only (<code style={code}>demo_0x…</code> synthetic
            hashes). Not what you should see on keryxhq.xyz right now.
          </li>
        </ul>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          Economics honesty: onchain pay is <b style={{ color: "var(--text-primary)" }}>100% to publisher{" "}
          <code style={code}>payTo</code></b>. The 5% platform fee is ledger
          accounting until split settlement ships. Native USDC gas on Arc
          (<code style={code}>0x3600…0000</code>).
        </p>
      </Section>

      {/* -------------------- Primary links -------------------- */}
      <Section title="Where to look next">
        <LinkRow
          label="Live product"
          value="keryxhq.xyz"
          href="/"
          note="Registry, publish, live ledger, docs"
        />
        <LinkRow
          label="GitHub repository"
          value="cryptoduke01/keryx"
          href={REPO}
          external
          note="Public, MIT. All source + @keryxhq/middleware package."
        />
        <LinkRow
          label="npm package"
          value="@keryxhq/middleware"
          href={NPM}
          external
          note="One-line x402 middleware for publishers."
        />
        <LinkRow
          label="Onchain registry"
          value={`${CONTRACT.slice(0, 8)}…${CONTRACT.slice(-6)}`}
          href={ARCSCAN_CONTRACT}
          external
          note="KeryxRegistry.sol on Arc testnet (5042002)."
        />
        <LinkRow
          label="Agent discovery"
          value="/.well-known/x402 · /llms.txt"
          href="/.well-known/x402"
          note="Machine-readable catalog + free /api/demo"
        />
      </Section>

      {/* -------------------- Video -------------------- */}
      <Section title="Video demo (≤3 min)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 10 }}>
          Link is in the Google Form submission. Prefer a cut that shows the{" "}
          <b style={{ color: "var(--text-primary)" }}>terminal quickstart</b>{" "}
          (wallet pays) before the sponsored{" "}
          <Link href="/ask" style={inlineLink}>/ask</Link> playground.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href="/pitch" style={chipLink}>Pitch deck →</a>
          <a href="/sdk" style={chipLink}>SDK docs →</a>
          <a href={NPM} target="_blank" rel="noreferrer" style={chipLink}>npm package →</a>
        </div>
      </Section>

      {/* -------------------- Grading dimensions -------------------- */}
      <Section title="Judging dimensions · where we sit">
        <Dimension
          weight="30% Agentic sophistication"
          summary="Autonomous buyer path is the hero; /ask is cost-aware but sponsored."
          detail={
            <>
              Full agency = wallet agent +{" "}
              <Link href="/quickstart.ts" style={inlineLink}>quickstart</Link>{" "}
              + <code style={code}>POST /api/call</code>. The{" "}
              <Link href="/ask" style={inlineLink}>/ask</Link> agent only
              spends when fresh data is worth the cost — good economic
              reasoning, but <b>Keryx-sponsored</b> (no wallet in the browser).
              MCP is the same: sponsored discovery for Claude/Cursor. Score
              autonomy on the quickstart path, not the playground alone.
            </>
          }
        />
        <Dimension
          weight="30% Traction"
          summary={`R5-proven Arc settlement · ledger open · ${stats.callerCount} callers · SDK on npm. Do not over-read raw call totals.`}
          detail={
            <>
              Public ledger at{" "}
              <Link href="/live" style={inlineLink}>/live</Link>. Prefer
              Arcscan-linked <code style={code}>local</code> rows and real tool
              ids over demo utilities / sponsored <code style={code}>web-*</code>{" "}
              traffic. Prove a single receipt with{" "}
              <code style={code}>POST /api/receipt/verify</code> (tier R5) rather
              than quoting aggregate call counts alone.{" "}
              <a href={NPM} target="_blank" rel="noreferrer" style={inlineLink}>
                @keryxhq/middleware
              </a>{" "}
              shipped during the Lepton window.{" "}
              <b style={{ color: "var(--text-primary)" }}>OKX.AI ASP #4759</b>{" "}
              is a separate X Layer product — not this Arc scorecard.
            </>
          }
        />
        <Dimension
          weight="20% Circle tool usage"
          summary={`x402 + USDC on Arc. Facilitator: ${facilitatorMode}. Gateway coded, local live.`}
          detail={
            <>
              Real 402 → EIP-3009 → settle on Arc. Bazaar{" "}
              <code style={code}>extensions.bazaar</code> on 402 root. Receipt
              verify reaches <b>R5</b> via Arc RPC. Local facilitator is the
              default when a key is present; Circle Gateway is opt-in via{" "}
              <code style={code}>CIRCLE_GATEWAY_PREFERRED=true</code> (
              <Link href="/whitepaper#settlement" style={inlineLink}>
                whitepaper
              </Link>
              ).
            </>
          }
        />
        <Dimension
          weight="20% Innovation"
          summary="Paid tool registry + MCP + publishable npm SDK — Arc-native agent commerce primitive."
          detail={
            <>
              Publishers list a price + wallet; agents discover and pay in one
              round trip; MCP surfaces the catalog;{" "}
              <code style={code}>@keryxhq/middleware</code> is a one-line
              seller integration. That registry pattern is the product — not a
              single paid endpoint.
            </>
          }
        />
      </Section>

      {/* -------------------- Optional sponsored -------------------- */}
      <Section title="Optional · sponsored demos (not the agency score)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12 }}>
          Zero-setup surfaces for humans. Useful, but not autonomous payers.
        </p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          <li style={{ marginBottom: 6 }}>
            <Link href="/ask" style={inlineLink}>/ask</Link> — cost-aware chat;
            Keryx covers settlement.
          </li>
          <li style={{ marginBottom: 6 }}>
            MCP <code style={code}>{MCP_URL}</code> — Claude Code / Cursor /
            Copilot; sponsored.
          </li>
          <li>
            <Link href="/api/demo?toolId=crypto.price" style={inlineLink}>
              /api/demo
            </Link>{" "}
            — free sample shape before pay (allowlisted tools).
          </li>
        </ul>
      </Section>

      {/* -------------------- Repo tour -------------------- */}
      <Section title="Repo tour (Arc / Lepton)">
        <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          <RepoLine path="src/app/api/call/route.ts" what="x402 path — 402 + bazaar extensions, verify, execute, settle." />
          <RepoLine path="src/app/api/receipt/verify/route.ts" what="Receipt tiers R0–R5 (Arc RPC confirmation)." />
          <RepoLine path="public/quickstart.ts" what="Autonomous TypeScript buyer agent." />
          <RepoLine path="src/lib/x402/" what="Facilitator: gateway | local | demo." />
          <RepoLine path="src/lib/registry/" what="Tool store + live public API handlers." />
          <RepoLine path="packages/keryx-middleware/" what="@keryxhq/middleware on npm." />
          <RepoLine path="contracts/KeryxRegistry.sol" what="Onchain registry mirror on Arc." />
        </ul>
      </Section>

      {/* -------------------- Separate track -------------------- */}
      <Section title="Separate track · OKX.AI Genesis (not Lepton scoring)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12 }}>
          <b style={{ color: "var(--text-primary)" }}>Do not mix rails.</b>{" "}
          Lepton = Arc + USDC + x402 above. OKX.AI Genesis = X Layer + USDT0 +
          Agent Payments Protocol (exact + charge) under{" "}
          <Link href="/okxasp" style={inlineLink}>/okxasp</Link>. Same builder,
          different hackathon / settlement network.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href="/okxasp" style={chipLink}>OKX Finance Copilot →</a>
          <a href="/okxasp/docs" style={chipLink}>OKX docs →</a>
        </div>
      </Section>

      <Section title="Post-hackathon">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          Flip facilitator to Circle Gateway when credentials land; land
          external publishers via the SDK; ship Python SDK; move 5% fee from
          ledger accounting to onchain split. Registry contract already lets
          publishers own listings independently of Keryx.
        </p>
      </Section>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 40, textAlign: "center" }}>
        Questions?{" "}
        <a href="https://x.com/keryxhq" target="_blank" rel="noreferrer" style={inlineLink}>
          @keryxhq
        </a>{" "}
        on X or via the GitHub issues.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 32,
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
          lineHeight: 1,
          fontWeight: 500,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LinkRow({
  label,
  value,
  href,
  external,
  note,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
  note?: string;
}) {
  const anchor = external ? (
    <a href={href} target="_blank" rel="noreferrer" style={rowLink}>
      {value} &rarr;
    </a>
  ) : (
    <Link href={href} style={rowLink}>
      {value} &rarr;
    </Link>
  );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 16,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "start",
      }}
    >
      <div className="text-eyebrow" style={{ paddingTop: 3 }}>
        {label}
      </div>
      <div>
        {anchor}
        {note && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

function Dimension({
  weight,
  summary,
  detail,
}: {
  weight: string;
  summary: string;
  detail: React.ReactNode;
}) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="text-eyebrow" style={{ marginBottom: 6 }}>
        {weight}
      </div>
      <div
        style={{
          fontSize: 14.5,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        {summary}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
        {detail}
      </div>
    </div>
  );
}

function RepoLine({ path, what }: { path: string; what: string }) {
  return (
    <li style={{ marginBottom: 6 }}>
      <code style={code}>{path}</code> &mdash; {what}
    </li>
  );
}

const inlineLink: React.CSSProperties = {
  color: "var(--text-primary)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

const rowLink: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  color: "var(--text-primary)",
  textDecoration: "none",
  fontWeight: 600,
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

const chipLink: React.CSSProperties = {
  display: "inline-block",
  fontSize: 13,
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  textDecoration: "none",
};

const pre: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 4,
  padding: "12px 14px",
  borderRadius: 8,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  lineHeight: 1.55,
  overflowX: "auto",
  color: "var(--text-primary)",
  whiteSpace: "pre-wrap",
};
