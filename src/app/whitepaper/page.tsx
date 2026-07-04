import Link from "next/link";
import ArtPanel from "@/components/ArtPanel";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = {
  title: "Whitepaper · Kēryx",
  description:
    "How Kēryx prices, executes, and settles paid tool calls between developers and AI agents on Arc.",
};

const TOC_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "abstract", label: "Abstract" },
  { id: "problem", label: "The problem" },
  { id: "design", label: "Design principle" },
  { id: "mechanics", label: "Protocol mechanics" },
  { id: "settlement", label: "Settlement" },
  { id: "trust", label: "Trust & verification" },
  { id: "economics", label: "Economics" },
  { id: "roadmap", label: "Roadmap" },
  { id: "risks", label: "Known limitations" },
];

export default function WhitepaperPage() {
  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 20px 96px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 720px)",
          gap: 56,
        }}
        className="whitepaper-grid"
      >
        <aside className="whitepaper-toc">
          <div
            className="whitepaper-toc-inner"
            style={{
              position: "sticky",
              top: 88,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
          <div className="text-eyebrow" style={{ marginBottom: 14 }}>
            Whitepaper · v0.1
          </div>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              borderLeft: "1px solid var(--border)",
            }}
          >
            {TOC_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  style={{
                    display: "block",
                    padding: "3px 0 3px 14px",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    borderLeft: "2px solid transparent",
                    marginLeft: -1,
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
              fontSize: 11.5,
              color: "var(--text-muted)",
              lineHeight: 1.55,
            }}
          >
            Onchain contract:{" "}
            <a
              href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"
              target="_blank"
              rel="noreferrer"
              className="text-mono"
              style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              0x7eA3…8bA7
            </a>
          </div>
          </div>
        </aside>

        <div>
          <div style={{ marginBottom: 32 }}>
            <ArtPanel
              src="/inspo/whitepaper-hero.png"
              alt="A classical loggia opening onto a reflecting pool"
              aspectRatio="16 / 6"
              position="50% 55%"
              variant="raw"
              overlayText="A LIVING SPECIFICATION FOR A REGISTRY BUILT FOR AGENTS, NOT ACCOUNTS."
            />
          </div>
          <div className="text-eyebrow" style={{ marginBottom: 12 }}>
            Whitepaper · v0.1, July 2026
          </div>
          <h1 className="text-headline" style={{ marginBottom: 16 }}>
            Kēryx: a paid tool registry for AI agents
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 40 }}>
            This document describes the problem Kēryx solves, how the registry
            prices and executes a call, and how the x402 protocol layer settles
            USDC on Arc via Circle Gateway. It is a living specification, not
            a funding pitch. Where a mechanism is not yet live, that is stated
            plainly.
          </p>

          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media (max-width: 900px) {
                  .whitepaper-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
                  .whitepaper-toc-inner { position: static !important; border: 1px solid var(--border); border-radius: 10px; padding: 16px; background: var(--surface-2); }
                }
              `,
            }}
          />

      <Section id="abstract" title="Abstract">
        <P>
          AI agents are becoming direct consumers of software, not just
          people using software through a chat window. Most tools an agent
          might want to call today are still gated behind human-shaped
          onboarding: create an account, generate an API key, attach a
          card, wait for approval. That flow assumes a human is present to
          complete it. An agent making one autonomous call to answer one
          question has no use for a monthly subscription and no way to
          click through a signup form.
        </P>
        <P>
          Kēryx is a registry where any developer publishes a tool at a
          price, and any agent calls that tool by paying for exactly the
          call it makes. Discovery, pricing, execution, and payment happen
          in a single request. Settlement runs in USDC on Arc, a
          stablecoin-native chain built by Circle, so a call priced at
          half a cent is not eaten alive by transaction fees.
        </P>
      </Section>

      <Section id="problem" title="The problem: software built for humans, not callers">
        <P>
          Three assumptions are baked into almost every API on the internet
          today, and all three break when the caller is an agent instead
          of a person:
        </P>
        <Ul items={[
          <>
            <b>Identity is assumed to be durable.</b> APIs expect a
            long-lived account: an email, a password, a dashboard the
            owner returns to. An agent spun up to answer one question has
            no durable identity worth registering.
          </>,
          <>
            <b>Payment is assumed to be recurring.</b> Subscriptions and
            metered billing exist because processing a card is expensive
            relative to a single API call. That math does not work below a
            cent, which is exactly the price band most agent tool calls
            fall into.
          </>,
          <>
            <b>Access is assumed to be pre-provisioned.</b> A human reads
            docs, gets a key, and hardcodes it. An agent discovering a new
            capability mid-task cannot pause to fill out a form.
          </>,
        ]} />
        <P>
          None of these are hard technical problems. They are defaults
          that made sense when the caller was always a person, and stopped
          making sense the moment the caller became a stateless process
          with a wallet.
        </P>
      </Section>

      <Section id="design" title="Design principle: pay per call, not per account">
        <P>
          Kēryx has one design principle and everything else follows from
          it: <b>the unit of access is the call, not the account.</b> There
          is no signup for agents. There is no API key. A publisher lists
          a tool once; from then on, every agent on the internet can
          discover it via <code style={codeInline}>GET /api/tools</code>{" "}
          and pay for it via <code style={codeInline}>POST /api/call</code>{" "}
          in the same request that executes it.
        </P>
        <P>
          This inverts the usual cost structure. Instead of a publisher
          absorbing infrastructure cost while hoping enough signups
          convert to paid plans, every single call is already paid before
          the response leaves the server. There is no free tier to abuse
          and no unpaid usage to write off.
        </P>
      </Section>

      <Section id="mechanics" title="Protocol mechanics">
        <H3>1. Publish</H3>
        <P>
          A developer registers an HTTP-callable tool: an id, a one-line
          summary an agent uses to decide whether to call it, a category,
          a price in USD, an argument schema, and the wallet that should
          receive payment. This is a <code style={codeInline}>POST /api/publishers/tools</code>{" "}
          call. There is no review queue standing between listing and
          going live, so the tool is callable immediately (see{" "}
          <a href="#trust" style={linkStyle}>Trust and verification</a>{" "}
          for what that trade-off costs today).
        </P>
        <P>
          The same tools are instantly available to agents through the Model Context Protocol (MCP).
          Cursor, Claude (via custom connectors), GitHub Copilot, and any MCP-compatible client can discover and call them natively with a one-line config.
        </P>
        <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "12px 0", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Native in:</span>
          <BrandLogo name="cursor" size={18} />
          <BrandLogo name="claude" size={18} />
          <BrandLogo name="copilot" size={18} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>+ Codex plugins (developers.openai.com/codex/plugins/build)</span>
        </div>
        <H3>2. Discover</H3>
        <P>
          <code style={codeInline}>GET /api/tools</code> returns every
          published tool with its price, its argument schema, and a sample
          call. An agent needs no separate documentation lookup: the
          schema an agent uses to plan a call is the same schema Kēryx
          uses to validate it.
        </P>
        <H3>3. Call, quote, execute, pay</H3>
        <P>
          <code style={codeInline}>POST /api/call</code> does four things
          in one round trip. It looks up the tool, computes a quote (the
          listed price, split into a publisher share and a platform fee),
          executes the tool's handler with the caller's arguments, and
          writes the result to the public ledger, whether the call
          succeeded or failed. The response carries the tool's result and
          the ledger entry id together, so a caller can prove a specific
          call was paid for.
        </P>
        <H3>4. Settle</H3>
        <P>
          Every call splits 95% to the publisher's wallet and 5% to the
          Kēryx treasury. See{" "}
          <a href="#settlement" style={linkStyle}>Settlement</a> for how
          that split currently moves versus how it will move once onchain
          settlement is fully live.
        </P>
      </Section>

      <Section id="settlement" title="Settlement: x402 on Arc, batched through Circle Gateway">
        <P>
          Kēryx settles on{" "}
          <a href="https://www.arc.network" style={linkStyle}>Arc</a>,
          Circle's stablecoin-native L1 (testnet chain id{" "}
          <code style={codeInline}>5042002</code>, native gas denominated
          in USDC). Arc was chosen specifically because sub-cent pricing
          only works if the settlement layer does not itself cost more
          than the call. A registry that prices a search call at $0.004
          cannot settle it on a chain where gas costs ten times that.
        </P>
        <P>
          <code style={codeInline}>POST /api/call</code> speaks the real
          x402 protocol. A first hit without an{" "}
          <code style={codeInline}>X-PAYMENT</code> header returns HTTP
          402 with a machine-readable{" "}
          <code style={codeInline}>accepts</code> array carrying the
          exact amount, USDC asset address, seller wallet, and Arc
          network id. The caller signs an EIP-3009 USDC authorization
          against those requirements and retries with the base64-encoded
          signature in the header. The server decodes, verifies, executes
          the tool, and settles &mdash; all inside a single request.
        </P>
        <P>
          Verification and settlement route through a swappable
          facilitator. When{" "}
          <code style={codeInline}>CIRCLE_GATEWAY_API_URL</code> is set,
          Kēryx uses{" "}
          <code style={codeInline}>@circle-fin/x402-batching</code>'s
          Gateway client &mdash; verify happens against Circle's endpoint
          and settlement is batched onchain. Without that variable, Kēryx
          falls back to a demo facilitator that accepts well-formed
          payloads and records a synthetic tx hash; the{" "}
          <a href="/live" style={linkStyle}>/live</a> ledger tags those
          entries as <b>demo</b> so nothing on the page misrepresents
          onchain state.
        </P>
        <P>
          The reason to batch through Circle Gateway rather than settle
          every call as its own onchain transaction is the same reason
          Arc exists in the first place: at sub-cent price points, the
          cost and latency of broadcasting one transaction per call would
          dominate the transaction itself. Batching lets Kēryx settle many
          calls' worth of USDC movement in a single, periodic onchain
          transfer per publisher, while every individual call is still
          quoted, priced, and ledgered in real time.
        </P>
      </Section>

      <Section id="trust" title="Trust and verification">
        <P>
          Publisher wallet ownership is enforced via EIP-191 signatures.
          Before a new tool can be registered, the client requests a
          nonce from{" "}
          <code style={codeInline}>POST /api/publishers/nonce</code>,
          signs a canonical message with the wallet it claims to own, and
          submits the signature alongside the tool payload. The server
          rebuilds the exact message and verifies it via viem's{" "}
          <code style={codeInline}>verifyMessage</code>. Nonces are
          consumed on first successful verification and expire after five
          minutes, so a signature cannot be replayed for a different tool
          or a different registration attempt.
        </P>
        <P>
          Kēryx distinguishes tools by a{" "}
          <code style={codeInline}>verified</code> flag. Seeded tools
          (Kēryx runs the handler against live public APIs) are verified
          and immediately executable. Community tools are listed right away;
          they become executable when the publisher provides a simple
          POST handler URL (Kēryx forwards after payment). The seeded catalog
          focuses on everyday micro-tasks (weather, finance, geo, dns, web data,
          crypto, utilities).
        </P>
        <P>
          A companion contract,{" "}
          <code style={codeInline}>KeryxRegistry.sol</code>, mirrors the
          offchain registry on Arc. Publishing a tool onchain records the
          publisher wallet, price, and metadata URI in permanent storage
          keyed by <code style={codeInline}>keccak256(id)</code>. Only the
          wallet that first publishes an id can update its price, edit
          metadata, or transfer the listing. Kēryx as owner can pause the
          registry or mark a listing verified; it cannot rewrite a
          publisher's state. The contract is deployed on Arc testnet at{" "}
          <a
            href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"
            style={linkStyle}
            target="_blank"
            rel="noreferrer"
          >
            <code style={codeInline}>0x7eA3…8bA7</code>
          </a>
          , owned by the Kēryx treasury, and seeded tools are mirrored onchain
          (visible as <b>On Arc</b> badges on the <code style={codeInline}>/registry</code> page).
        </P>
      </Section>

      <Section id="economics" title="Economics">
        <P>
          Kēryx takes a flat 5% platform fee on every call, computed at
          quote time and split at settlement. There is no listing fee, no
          minimum volume, and no subscription on either side of the
          market. A publisher earns from the first call. An agent pays
          for exactly the calls it makes and nothing else.
        </P>
        <P>
          This only works economically because the calls themselves are
          priced in fractions of a cent and settle on a chain built for
          exactly that price band. A 5% fee on a $0.004 call is a
          fraction of a cent moving through a system where a fraction of
          a cent is still worth collecting, precisely because Arc and x402
          make the collection itself nearly free.
        </P>
      </Section>

      <Section id="roadmap" title="Roadmap">
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
          Status as of July 2026 (hackathon delivery):
        </p>
        <Ul items={[
          <>✓ Clear handler contract for community publishers (publish a <code>handlerUrl</code>; Kēryx forwards after payment). Seeded catalog at 20 practical tools (Solana onchain research, weather, finance/rates, geo, search, crypto market signals, utilities, time/uuid, etc.).</>,
          <>○ Circle Gateway: fully implemented in code (prefers <code>CIRCLE_GATEWAY_API_URL</code> → real batched Gateway; falls back to local facilitator if private key present; otherwise demo). The production deployment at keryxhq.xyz is currently on demo (synthetic hashes). Nothing in the code prevents flipping — it is waiting on provisioning a real Circle Gateway account/URL.</>,
          <>✓ Basic OpenAPI spec published at /keryx-openapi.json. First-party SDKs (Node/Python middleware) — not started (planned post-hackathon).</>,
        ]} />
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          The three bullets below are the original aspirational list; the checkmarks above reflect what actually shipped.
        </p>
        <Ul items={[
          <>Rich seeded catalog (20+ everyday tools) + clear handler contract for community publishers</>,
          <>Provisioning a Circle Gateway account and flipping the default facilitator from demo to gateway in production.</>,
          <>OpenAPI spec and first-party SDKs for Node and Python.</>,
        ]} />
      </Section>

      <Section id="risks" title="Known limitations">
        <P>
          This is a hackathon-stage build, and this document is written to
          be honest about that rather than to oversell it. The x402
          protocol path (402 + signed X-PAYMENT retry + verify/execute/settle)
          is real end-to-end. The deployed site currently runs in <b>demo</b>
          mode (synthetic hashes). When <code>CIRCLE_GATEWAY_API_URL</code> is
          set it uses real batched Circle Gateway; when a local facilitator
          key is configured it broadcasts directly on Arc. Persistence is
          Redis when configured, otherwise in-memory (resets on cold start).
          20 seeded tools are implemented and executable (Kēryx calls real
          public APIs). Community tools are executable when the publisher
          supplies a <code>handlerUrl</code>. Not every interesting data source
          has a cheap, machine-friendly public endpoint yet.
        </P>
      </Section>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/docs" style={{ fontSize: 13.5, color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Read the integration docs
            </Link>
            <Link href="/live" style={{ fontSize: 13.5, color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Watch the live ledger
            </Link>
            <a href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7" target="_blank" rel="noreferrer" style={{ fontSize: 13.5, color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Verify contract on Arcscan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  textDecoration: "underline",
  textUnderlineOffset: 3,
  color: "var(--text-primary)",
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

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 80 }}>
      <h2 className="text-subtitle" style={{ color: "var(--text-primary)", marginBottom: 14, fontSize: 20 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", marginTop: 20, marginBottom: 8 }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>
      {children}
    </p>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: 20, marginBottom: 12 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 8 }}>{item}</li>
      ))}
    </ul>
  );
}
