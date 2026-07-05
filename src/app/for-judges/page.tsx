import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import { ledgerStats } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For judges · Kēryx",
  description:
    "Everything a reviewer needs, on one page: video, repo, live URL, onchain contract, npm package, whitepaper.",
  robots: { index: false, follow: true },
};

const CONTRACT = "0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7";
const ARCSCAN = `https://testnet.arcscan.app/address/${CONTRACT}`;
const REPO = "https://github.com/cryptoduke01/keryx";
const NPM = "https://www.npmjs.com/package/@keryxhq/middleware";
const MCP_URL = "https://keryxhq.xyz/api/mcp";

export default async function ForJudgesPage() {
  const [tools, stats] = await Promise.all([listTools(), ledgerStats()]);
  const executableCount = tools.filter((t) => !t.id.startsWith("demo.")).length;

  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        For judges · Lepton Agents
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Everything you need on one page.
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          lineHeight: 1.65,
          marginBottom: 40,
          maxWidth: 640,
        }}
      >
        Kēryx is <b style={{ color: "var(--text-primary)" }}>Stripe for the
        moment an AI agent needs to use an API</b>. Publishers list tools at a
        price-per-call; agents pay in USDC on Arc, one call at a time, no
        signup. This page collects every artifact a Lepton reviewer might
        want, so nothing is a hunt.
      </p>

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
        <Stat label="Executable tools" value={String(executableCount)} />
        <Stat label="Unique agent callers" value={String(Math.max(1, stats.callerCount))} />
        <Stat label="SDK version" value="0.1.0" />
      </div>

      {/* -------------------- Primary links -------------------- */}
      <Section title="Where to look first">
        <LinkRow
          label="Live product"
          value="keryxhq.xyz"
          href="/"
          note="Full app; try /ask, /registry, /publish, /live directly"
        />
        <LinkRow
          label="GitHub repository"
          value="cryptoduke01/keryx"
          href={REPO}
          external
          note="Public, MIT. All source code + monorepo package."
        />
        <LinkRow
          label="npm package"
          value="@keryxhq/middleware"
          href={NPM}
          external
          note="The SDK a publisher installs to wire their endpoint into Kēryx."
        />
        <LinkRow
          label="Onchain contract"
          value={`${CONTRACT.slice(0, 8)}…${CONTRACT.slice(-6)}`}
          href={ARCSCAN}
          external
          note="KeryxRegistry.sol on Arc testnet (chain id 5042002). Verify onchain."
        />
      </Section>

      {/* -------------------- Video demo -------------------- */}
      <Section title="Video demo (≤3 min)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 10 }}>
          Uploaded separately. Link is in the Google Form submission.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
          The video walks through: publishing a paid tool, an agent discovering
          it via MCP in Claude Code, the agent making a decision to pay because
          real-time onchain data can&rsquo;t be answered from training, the tx
          settling on the ledger.
        </p>
      </Section>

      {/* -------------------- Grading dimensions -------------------- */}
      <Section title="Judging dimensions · where we sit">
        <Dimension
          weight="30% Agentic sophistication"
          summary="Cost-aware agent at /ask with a real economic model."
          detail={
            <>
              The <Link href="/ask" style={inlineLink}>/ask</Link> agent is
              instructed to <b>only</b> spend when the fresh data is worth the
              cost. It refuses paid tool calls for questions it can answer from
              training data. When it does pay, it narrates the decision on
              screen before the tool card fires. Try the &ldquo;A wallet just
              aped $50K into this Solana mint&rdquo; prompt in the suggestions
              &mdash; it forces a paid decision because rugcheck data changes
              hour-to-hour.
            </>
          }
        />
        <Dimension
          weight="30% Traction"
          summary={`${stats.callCount} paid calls · ${Math.max(1, stats.callerCount)} unique agent callers · SDK on npm.`}
          detail={
            <>
              Every paid call writes an entry to a persistent public ledger at{" "}
              <Link href="/live" style={inlineLink}>/live</Link>. Distinct agent
              identities are tracked. The{" "}
              <a href={NPM} target="_blank" rel="noreferrer" style={inlineLink}>
                @keryxhq/middleware
              </a>{" "}
              SDK went live on npm during the Lepton window.
            </>
          }
        />
        <Dimension
          weight="20% Circle tool usage"
          summary="x402 + USDC on Arc, native gas at 0x3600. Gateway integration coded in facilitator abstraction."
          detail={
            <>
              <code style={code}>POST /api/call</code> speaks real x402: HTTP
              402 with machine-readable requirements, EIP-3009{" "}
              <code style={code}>transferWithAuthorization</code> retry via{" "}
              <code style={code}>X-PAYMENT</code>, verify + execute + settle in
              one round trip. Circle Gateway wired via a swappable facilitator
              (<Link href="/whitepaper#settlement" style={inlineLink}>whitepaper §Settlement</Link>).
              Currently in demo mode on prod; <code style={code}>CIRCLE_GATEWAY_API_URL</code>{" "}
              flips it to real batched settlement with no code change.
            </>
          }
        />
        <Dimension
          weight="20% Innovation"
          summary="A registry pattern for paid agent tools + a real publishable SDK. Not seen elsewhere in the Arc ecosystem."
          detail={
            <>
              The pattern &mdash; publishers list tools with a price and a
              wallet, agents discover + pay in one round trip, MCP surfaces the
              catalog to Claude/Cursor/Copilot &mdash; is a new
              primitive for the agent economy. The SDK makes it a one-line
              integration for any publisher.
            </>
          }
        />
      </Section>

      {/* -------------------- Try it live -------------------- */}
      <Section title="Try it live (no setup)">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14 }}>
          Three ways to hit Kēryx yourself in under a minute each. Every one
          produces a real ledger entry visible on <Link href="/live" style={inlineLink}>/live</Link>.
        </p>
        <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>Web</b>:{" "}
            <Link href="/ask" style={inlineLink}>keryxhq.xyz/ask</Link> &mdash; pick a suggested prompt.
          </li>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>Terminal</b>:{" "}
            <Link href="/try" style={inlineLink}>keryxhq.xyz/try</Link> has copy-pasteable curl examples that hit the raw x402 endpoint.
          </li>
          <li style={{ marginBottom: 8 }}>
            <b style={{ color: "var(--text-primary)" }}>Claude Code / Cursor / Copilot</b>: add the MCP server URL{" "}
            <code style={code}>{MCP_URL}</code> to your MCP config. Every Kēryx tool becomes discoverable inside your agent.
          </li>
        </ol>
      </Section>

      {/* -------------------- Repo tour -------------------- */}
      <Section title="Repo tour (what's where)">
        <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          <RepoLine path="src/app/api/call/route.ts" what="The x402 payment path — 402, verify, execute, settle." />
          <RepoLine path="src/app/api/mcp/route.ts" what="MCP JSON-RPC endpoint for Cursor/Claude/Copilot." />
          <RepoLine path="src/lib/x402/" what="Facilitator abstraction — swap demo, local, or Circle Gateway." />
          <RepoLine path="src/lib/registry/" what="Registry store + seeded tool handlers hitting real public APIs." />
          <RepoLine path="src/lib/publishers/nonce.ts" what="EIP-191 nonce store for publisher signature verification." />
          <RepoLine path="contracts/KeryxRegistry.sol" what="Onchain registry mirror on Arc testnet." />
          <RepoLine path="packages/keryx-middleware/" what="The @keryxhq/middleware SDK — npm publishable." />
        </ul>
      </Section>

      {/* -------------------- Post-hackathon -------------------- */}
      <Section title="Post-hackathon">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          Kēryx is intended to be maintained. Immediate next steps: flip
          production to a real Circle Gateway facilitator, publish the first
          three external publisher integrations (Helius / Birdeye /
          DexScreener via the SDK), ship a Python SDK. The registry contract
          on Arc is designed so publishers own their listings independently of
          Kēryx.
        </p>
      </Section>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 40, textAlign: "center" }}>
        Questions? <a href="https://x.com/keryxhq" target="_blank" rel="noreferrer" style={inlineLink}>@keryxhq</a> on X or via the GitHub issues.
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
    <div
      style={{
        padding: "16px 18px",
        background: "var(--surface-1)",
      }}
    >
      <div
        className="text-eyebrow"
        style={{ marginBottom: 6, color: "var(--text-muted)" }}
      >
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
      <div className="text-eyebrow" style={{ paddingTop: 3 }}>{label}</div>
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
    <div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="text-eyebrow" style={{ marginBottom: 6 }}>
        {weight}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
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
