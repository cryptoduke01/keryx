import Image from "next/image";
import PitchLayoutBoot from "./PitchLayoutBoot";
import PrintButton from "./PrintButton";

export const metadata = {
  title: "Kēryx · Pitch deck",
  description: "The toll booth for the agent economy. Deck for the Lepton Agents Hackathon.",
};

export default function PitchPage() {
  return (
    <div className="pitch-root">
      <PitchLayoutBoot />

      <PrintButton />

      {/* -------------------- SLIDE 1 · Cover --------------------- */}
      <section className="pitch-slide pitch-cover pitch-cover-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/inspo/pitch-cover.png"
          alt=""
          className="pitch-cover-bg"
        />
        <div className="pitch-cover-scrim" />
        <div className="pitch-cover-content">
          <div className="pitch-cover-wordmark">Kēryx</div>
          <div className="pitch-cover-primary">
            Commerce at machine speed.
          </div>
          <div className="pitch-cover-secondary">
            The toll booth for the agent economy.
          </div>
          <div className="pitch-cover-meta">
            <div>Pitch deck · v0.1 · July 2026</div>
            <div>team@keryxhq.xyz · keryxhq.xyz</div>
          </div>
        </div>
      </section>

      {/* -------------------- SLIDE 2 · Problem ------------------- */}
      <section className="pitch-slide">
        <SlideHead num="01" eyebrow="The world we're leaving">
          Every API on the internet was built for humans.
        </SlideHead>
        <div className="pitch-three-cards">
          <ProblemCard
            tag="Identity"
            claim="Assumed to be durable."
            reality="Every SaaS has an accounts table. Agents spun up for one call don't have long-lived identities worth registering."
          />
          <ProblemCard
            tag="Payment"
            claim="Assumed to be recurring."
            reality="Card processing costs more than a single API call. So vendors bundle a month at a time. That math breaks below one cent."
          />
          <ProblemCard
            tag="Access"
            claim="Assumed to be pre-provisioned."
            reality="A human hardcodes a key into an env file. An agent that discovers a new capability mid-task cannot pause to fill a signup form."
          />
        </div>
        <SlideFoot>None of this is a hard technical problem &mdash; just defaults that stopped making sense the moment the caller became a program.</SlideFoot>
      </section>

      {/* -------------------- SLIDE 3 · The break ---------------- */}
      <section className="pitch-slide pitch-slide-dark">
        <SlideHead num="02" eyebrow="The world we're entering" light>
          The caller is changing.
        </SlideHead>
        <div className="pitch-hero-art">
          <Image
            src="/inspo/ask-hero.png"
            alt="A reader consulting an oracle"
            fill
            unoptimized
            style={{ objectFit: "cover", objectPosition: "35% 50%", filter: "contrast(1.05) saturate(1.05) brightness(1.05)" }}
          />
          <div className="pitch-hero-art-overlay">
            When your caller is an autonomous AI agent that lives for thirty seconds to answer one question,
            <b> all three assumptions collapse.</b>
          </div>
        </div>
      </section>

      {/* -------------------- SLIDE 4 · Enter Kēryx --------------- */}
      <section className="pitch-slide">
        <SlideHead num="03" eyebrow="Enter">
          Kēryx is a paid tool registry for AI agents.
        </SlideHead>
        <div className="pitch-two-col">
          <ul className="pitch-bullets">
            <li>Any developer publishes an HTTP endpoint at a price, points it at an Arc wallet, and it's live in a minute. No accounts.</li>
            <li>Any AI agent — <strong>Cursor, Claude, GitHub Copilot, custom</strong> — discovers it via MCP and pays per call in USDC on Circle Arc.</li>
            <li>The unit of access is the call, not the account. 95% to the publisher, 5% to Kēryx, no listing fee, no minimum.</li>
            <li>Every payment settles onchain in under half a second. Every settlement has a real Arcscan tx hash.</li>
            <li><i>Not</i> "pay for things that are free on the web". Kēryx is the payment + discovery layer for capabilities agents are willing to pay for — today public data with reliability, tomorrow paid creator tools and proprietary sources.</li>
          </ul>
          <ReceiptCard
            heading="Provably live"
            lines={[
              ["Contract", "0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"],
              ["Chain", "Arc testnet (5042002)"],
              ["Tools listed", "20 seeded + published (executable)"],
              ["Onchain anchor", "5 · KeryxRegistry.sol"],
              ["Off-chain registry", "14 · publisher-owned"],
              ["Facilitator", "0x8F47…26B6"],
              ["Site", "keryxhq.xyz"],
            ]}
          />
        </div>
      </section>

      {/* -------------------- SLIDE 5 · How it works ------------- */}
      <section className="pitch-slide">
        <SlideHead num="04" eyebrow="How it works">
          Four steps. One HTTP request.
        </SlideHead>
        <div className="pitch-flow">
          <FlowStep num="1" name="Publish">
            Wrap any HTTP handler with a middleware. Set a price. Point it at your Arc wallet. Sign an EIP-191 message to prove ownership.
          </FlowStep>
          <FlowStep num="2" name="Discover">
            Agents hit <code>GET /api/tools</code> or drop the Kēryx MCP server into Claude Code's config. Every listing carries its price and arg schema.
          </FlowStep>
          <FlowStep num="3" name="Pay-per-call">
            The agent's first request returns HTTP 402 with a machine-readable price. It signs an EIP-3009 USDC authorization and retries.
          </FlowStep>
          <FlowStep num="4" name="Settle">
            Kēryx verifies the signature, executes the tool, broadcasts the USDC transfer onchain. Real tx hash lands on the public ledger.
          </FlowStep>
        </div>
        <SlideFoot>One call. One payment. One Arc transaction. Ninety-five percent to the publisher.</SlideFoot>
      </section>

      {/* -------------------- SLIDE 6 · Stack -------------------- */}
      <section className="pitch-slide">
        <SlideHead num="05" eyebrow="Under the hood">
          The stack, top to bottom.
        </SlideHead>
        <div className="pitch-stack">
          <StackLayer label="AI agent" example="Claude Code · Cursor · custom" />
          <StackLayer label="MCP" example="Native tool discovery in three lines of config" />
          <StackLayer label="x402 protocol" example="HTTP 402 + signed X-PAYMENT retry" />
          <StackLayer label="Kēryx registry" example="Offchain listings + onchain KeryxRegistry.sol" />
          <StackLayer label="USDC on Arc" example="Sub-cent settlements, USDC-native gas, <2s finality" />
        </div>
        <SlideFoot>
          Every layer is real and shipping. The x402 endpoint returns real 402s. The MCP server responds to real JSON-RPC. The registry contract holds real onchain state.
        </SlideFoot>
      </section>

      {/* -------------------- SLIDE 7 · Live today --------------- */}
      <section className="pitch-slide pitch-slide-dark">
        <SlideHead num="06" eyebrow="What's live today" light>
          Not aspirational. Shipped.
        </SlideHead>
        <div className="pitch-metrics">
          <Metric big="20" small="Seeded tools (executable end-to-end)" />
          <Metric big="5" small="Anchored onchain in KeryxRegistry.sol" />
          <Metric big="4" small="Live surfaces (site, /api/call, /api/mcp, /ask)" />
          <Metric big="∞" small="Public tx hashes on Arcscan — verify any of them" />
        </div>
        <SlideFoot light>
          <b>Hybrid model on purpose.</b> Five tools are anchored onchain in <span className="pitch-mono">KeryxRegistry.sol</span> at <span className="pitch-mono">0x7eA3…8bA7</span> as canonical, permissionless discovery. The rest live in the off-chain registry so publishers can iterate (price changes, arg schema updates) in a wallet-signed message instead of a gas-paying transaction. Every listed tool is executable today; the onchain anchor is opt-in.
        </SlideFoot>
      </section>

      {/* -------------------- SLIDE 8 · Landscape --------------- */}
      <section className="pitch-slide">
        <SlideHead num="07" eyebrow="Competitive landscape">
          Nobody's shipped this exact shape yet.
        </SlideHead>
        <div className="pitch-table-wrap">
          <table className="pitch-table">
            <thead>
              <tr>
                <th></th>
                <th className="us">Kēryx</th>
                <th>RapidAPI</th>
                <th>Exa · Tavily</th>
                <th>Skyfire</th>
                <th>Anthropic MCP dir</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Registry of many tools</td><td className="us">✓</td><td>✓</td><td>—</td><td>—</td><td>✓</td></tr>
              <tr><td>Agent-callable without signup</td><td className="us">✓</td><td>—</td><td>—</td><td>✓</td><td>partial</td></tr>
              <tr><td>MCP-native discovery</td><td className="us">✓</td><td>—</td><td>—</td><td>—</td><td>✓</td></tr>
              <tr><td>Onchain USDC settlement</td><td className="us">✓</td><td>—</td><td>—</td><td>✓</td><td>—</td></tr>
              <tr><td>Sub-cent pricing viable</td><td className="us">✓</td><td>—</td><td>—</td><td>partial</td><td>—</td></tr>
              <tr><td>Publisher gets paid per call</td><td className="us">✓</td><td>✓ (via card)</td><td>N/A</td><td>N/A</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
        <SlideFoot>
          Exa, Tavily, Firecrawl, Helius, DexScreener &mdash; every single-product API on this table could <b>list on Kēryx</b>. We&apos;re a different layer of the stack.
        </SlideFoot>
      </section>

      {/* -------------------- SLIDE 9 · Why Circle -------------- */}
      <section className="pitch-slide">
        <SlideHead num="08" eyebrow="Why Circle Arc, specifically">
          Sub-cent pricing collapses on every other rail.
        </SlideHead>
        <div className="pitch-price-band">
          <PriceRow label="Stripe minimum" value="$0.30 + 2.9%" verdict="A $0.005 call becomes a $0.31 call." />
          <PriceRow label="Ethereum L1 gas" value="~$0.50 – $2.00" verdict="More gas than call. Impossible math." />
          <PriceRow label="Base / Optimism" value="~$0.001 – $0.005" verdict="Better, but a $0.005 tool still costs more in gas than in revenue." />
          <PriceRow label="Circle Arc" value="Native USDC gas · ~$0.0001 per tx" verdict="This is the only chain in Kēryx&apos;s price band." highlight />
        </div>
        <SlideFoot>
          Arc is <b>USDC as native gas</b> with sub-half-second finality. It's the reason the whole business model is possible.
        </SlideFoot>
      </section>

      {/* -------------------- SLIDE 10 · Moat ------------------- */}
      <section className="pitch-slide pitch-slide-dark">
        <SlideHead num="09" eyebrow="The moat" light>
          Three flywheels stacked.
        </SlideHead>
        <div className="pitch-moat">
          <MoatPillar
            title="MCP-native discovery"
            body="Every Claude Code user is one config edit away from every tool we host. That distribution surface only grows."
          />
          <MoatPillar
            title="Wallet-native payments"
            body="No accounts, no keys, no signup. The one thing every agent framework already gives an agent is a wallet."
          />
          <MoatPillar
            title="Registry network effects"
            body="Every publisher adds a reason for agents to be on Kēryx. Every agent adds a reason for publishers to list. Standard marketplace lock-in, but tuned for machines."
          />
        </div>
      </section>

      {/* -------------------- SLIDE 11 · Roadmap ---------------- */}
      <section className="pitch-slide">
        <SlideHead num="10" eyebrow="Roadmap">
          What&apos;s shipped, what&apos;s next, what&apos;s after.
        </SlideHead>
        <div className="pitch-roadmap">
          <RoadmapCol
            when="Now"
            items={[
              "KeryxRegistry.sol on Arc testnet",
              "20 seeded executable tools (Solana, weather, finance, geo, search, crypto, utilities, time...)",
              "Real x402 endpoint",
              "MCP server — native in Cursor, Claude, GitHub Copilot + any MCP client",
              "Publisher wallet verification (EIP-191)",
              "Public ledger with real Arcscan hashes",
            ]}
          />
          <RoadmapCol
            when="Next 30 days"
            items={[
              "Growing seeded catalog + explicit handler contract for publishers",
              "Circle Gateway credentials → onchain batched settlement",
              "First 20 verified publishers",
              "OpenAPI spec + Node + Python SDKs",
              "Get listed in Anthropic MCP directory",
            ]}
          />
          <RoadmapCol
            when="Q1 2027"
            items={[
              "Arc mainnet migration",
              "Fiat on-ramp for humans who want to pre-fund",
              "Publisher reputation + revenue analytics",
              "Cross-chain settlement (via Circle Gateway)",
              "Enterprise self-host for regulated deployments",
            ]}
          />
        </div>
      </section>

      {/* -------------------- SLIDE 12 · Ask -------------------- */}
      <section className="pitch-slide">
        <SlideHead num="11" eyebrow="What we&apos;re asking for">
          Distribution, credentials, and the first fifty publishers.
        </SlideHead>
        <div className="pitch-asks">
          <AskCard
            heading="Circle"
            body="Gateway credentials so we flip the default facilitator from local to Gateway-batched. Blog post feature as a reference implementation of the Agent Stack."
          />
          <AskCard
            heading="Anthropic"
            body="Listing in the MCP directory when it launches. Priority Claude API rate limits under the Claude Startups program so /ask can scale."
          />
          <AskCard
            heading="Publishers"
            body="Any operator of a real API — search, crypto data, RPC, scraping — should list a tool. Verified first-50 slots free. team@keryxhq.xyz · @keryxhq."
          />
        </div>
      </section>

      {/* -------------------- SLIDE 13 · Close ----------------- */}
      <section className="pitch-slide pitch-cover pitch-cover-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/inspo/pitch-cover.png" alt="" className="pitch-cover-bg" />
        <div className="pitch-cover-scrim" />
        <div className="pitch-cover-content">
          <div className="pitch-cover-wordmark" style={{ fontSize: 96 }}>Kēryx</div>
          <div className="pitch-cover-primary" style={{ marginBottom: 40 }}>
            Commerce at machine speed.
          </div>
          <div className="pitch-close-links">
            <div><span>Site</span> keryxhq.xyz</div>
            <div><span>Contact</span> team@keryxhq.xyz</div>
            <div><span>Contract</span> 0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7</div>
            <div><span>X</span> @keryxhq</div>
          </div>
          <div className="pitch-cover-meta">
            <div>Not backed by Ycmobinator.</div>
            <div>MIT · Settles on Arc testnet.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---- reusable slide pieces ----

function SlideHead({
  num,
  eyebrow,
  children,
  light,
}: {
  num: string;
  eyebrow: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`pitch-head ${light ? "light" : ""}`}>
      <div className="pitch-eyebrow">
        <span className="pitch-num">{num}</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="pitch-title">{children}</h2>
    </div>
  );
}

function SlideFoot({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`pitch-foot ${light ? "light" : ""}`}>{children}</div>;
}

function ProblemCard({
  tag,
  claim,
  reality,
}: {
  tag: string;
  claim: string;
  reality: string;
}) {
  return (
    <div className="pitch-problem-card">
      <div className="pitch-problem-tag">{tag}</div>
      <div className="pitch-problem-claim">{claim}</div>
      <div className="pitch-problem-reality">{reality}</div>
    </div>
  );
}

function ReceiptCard({
  heading,
  lines,
}: {
  heading: string;
  lines: Array<[string, string]>;
}) {
  return (
    <div className="pitch-receipt">
      <div className="pitch-receipt-head">
        <span className="pitch-dot" />
        {heading}
      </div>
      {lines.map(([k, v]) => (
        <div key={k} className="pitch-receipt-row">
          <span>{k}</span>
          <span className="pitch-mono">{v}</span>
        </div>
      ))}
    </div>
  );
}

function FlowStep({ num, name, children }: { num: string; name: string; children: React.ReactNode }) {
  return (
    <div className="pitch-flow-step">
      <div className="pitch-flow-num">{num}</div>
      <div className="pitch-flow-name">{name}</div>
      <div className="pitch-flow-desc">{children}</div>
    </div>
  );
}

function StackLayer({ label, example }: { label: string; example: string }) {
  return (
    <div className="pitch-stack-layer">
      <div className="pitch-stack-label">{label}</div>
      <div className="pitch-stack-example">{example}</div>
    </div>
  );
}

function Metric({ big, small }: { big: string; small: string }) {
  return (
    <div className="pitch-metric">
      <div className="pitch-metric-big">{big}</div>
      <div className="pitch-metric-small">{small}</div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  verdict,
  highlight,
}: {
  label: string;
  value: string;
  verdict: string;
  highlight?: boolean;
}) {
  return (
    <div className={`pitch-price-row ${highlight ? "hi" : ""}`}>
      <div className="pitch-price-label">{label}</div>
      <div className="pitch-price-value">{value}</div>
      <div className="pitch-price-verdict">{verdict}</div>
    </div>
  );
}

function MoatPillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="pitch-moat-pillar">
      <div className="pitch-moat-title">{title}</div>
      <div className="pitch-moat-body">{body}</div>
    </div>
  );
}

function RoadmapCol({ when, items }: { when: string; items: string[] }) {
  return (
    <div className="pitch-roadmap-col">
      <div className="pitch-roadmap-when">{when}</div>
      <ul className="pitch-roadmap-list">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function AskCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="pitch-ask-card">
      <div className="pitch-ask-head">{heading}</div>
      <div className="pitch-ask-body">{body}</div>
    </div>
  );
}

