import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export const metadata = {
  title: "Try Kēryx · Test the full flow in five minutes",
  description:
    "A minute-by-minute guide to try every part of Kēryx: play in /ask, hit /api/call from the terminal, add the MCP server to Claude Code, and publish a real tool.",
};

export default function TryPage() {
  return (
    <div className="container-narrow" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="text-eyebrow" style={{ marginBottom: 12 }}>
        Testing guide
      </div>
      <h1 className="text-headline" style={{ marginBottom: 16 }}>
        Try Kēryx in five minutes.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 40 }}>
        Four ways to hit Kēryx yourself, ordered from easiest to most technical.
        Every one produces a real onchain USDC transaction on Arc testnet that
        you can look up on Arcscan afterwards.
      </p>

      <Step
        num={1}
        title="Ask something in the playground"
        seconds={30}
        difficulty="Zero setup"
      >
        <P>
          Head to <Link href="/ask" style={link}>/ask</Link>. Pick one of the
          suggested prompts &mdash; try{" "}
          <i>&ldquo;What&apos;s the 24h trading volume for BONK on Solana?&rdquo;</i>
        </P>
        <P>
          Watch the small chip appear under the response: it shows the tool
          being called, the price ($0.005), and after a second, a shortened
          Arcscan tx hash you can click. That&apos;s a real USDC settlement.
          The green pulse pill under the CTAs on the landing page ticks up
          the moment your call lands.
        </P>
      </Step>

      <Step
        num={2}
        title="Curl the paid endpoint directly"
        seconds={60}
        difficulty="Terminal"
      >
        <P>
          Anyone with a terminal can hit the raw x402 endpoint. This is what
          Kēryx looks like to an AI agent with no browser.
        </P>
        <P>
          <b>First hit &mdash; you get a 402:</b>
        </P>
        <CodeBlock
          code={`curl -X POST https://keryxhq.xyz/api/call \\
  -H "content-type: application/json" \\
  -H "x-keryx-agent: my-terminal" \\
  -d '{"toolId":"crypto.trending","args":{"limit":3}}'`}
        />
        <P>
          Response: HTTP 402 with a <code style={codeInline}>PaymentRequirements</code>{" "}
          block listing the exact amount ($0.001 for this tool), the USDC contract
          address on Arc, and the seller wallet. An agent reads this and signs
          an EIP-3009 authorization against it, base64-encodes the signed
          payload, and retries with{" "}
          <code style={codeInline}>X-PAYMENT: &lt;signed&gt;</code>. The response
          then carries the tool result plus a real onchain tx hash.
        </P>
        <P>
          Don&apos;t want to write a signer? Use{" "}
          <Link href="/ask" style={link}>/ask</Link> &mdash; Kēryx signs on
          behalf of its facilitator wallet for you.
        </P>
      </Step>

      <Step
        num={3}
        title="Drop Kēryx into Claude Code"
        seconds={120}
        difficulty="One JSON file"
      >
        <P>
          Kēryx runs a Model Context Protocol server at{" "}
          <code style={codeInline}>https://keryxhq.xyz/api/mcp</code>. Add it
          to Claude Code&apos;s MCP config once and every tool in the registry
          becomes something Claude can call natively, no per-tool wiring.
        </P>
        <P>Edit <code style={codeInline}>~/.claude/mcp.json</code>:</P>
        <CodeBlock
          code={`{
  "mcpServers": {
    "keryx": {
      "type": "http",
      "url": "https://keryxhq.xyz/api/mcp"
    }
  }
}`}
        />
        <P>
          Restart Claude Code. Try:{" "}
          <i>&ldquo;use keryx to search for what Circle Arc is&rdquo;</i>{" "}
          or <i>&ldquo;use keryx to rug-check this Solana mint: EPjF…Dt1v&rdquo;</i>.
          Claude picks the right tool from the registry, calls it, and
          Kēryx settles the payment onchain in the background. Every call
          shows up on <Link href="/live" style={link}>/live</Link>.
        </P>
      </Step>

      <Step
        num={4}
        title="Publish your own tool"
        seconds={180}
        difficulty="Arc wallet + testnet USDC"
      >
        <P>
          Any HTTP endpoint you can respond to can be listed on Kēryx. For
          the demo below we&apos;ll list a fake tool called{" "}
          <code style={codeInline}>weather.today</code> at $0.002 per call.
          The listing lives in two places: an offchain record on Kēryx that
          shows up on <Link href="/registry" style={link}>/registry</Link>{" "}
          and an onchain record on{" "}
          <a
            href="https://testnet.arcscan.app/address/0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7"
            target="_blank"
            rel="noreferrer"
            style={link}
          >
            KeryxRegistry.sol
          </a>{" "}
          at <code style={codeInline}>0x7eA3…8bA7</code> on Arc testnet.
        </P>
        <P>
          <b>Step A &mdash; offchain listing (browser).</b>
        </P>
        <ol style={olStyle}>
          <li>Open <Link href="/publish" style={link}>/publish</Link>.</li>
          <li>Click <b>Connect wallet</b>. Pick MetaMask (or any injected wallet). Approve.</li>
          <li>If your wallet is on the wrong network, a banner says so &mdash; click <b>Switch network</b> to jump to Arc testnet.</li>
          <li>Fill the form:
            <ul style={ulStyle}>
              <li><b>Tool name:</b> Weather Today</li>
              <li><b>Tool id:</b> <code style={codeInline}>weather.today</code></li>
              <li><b>Summary:</b> Current weather for a city. Returns temperature, condition, and humidity.</li>
              <li><b>Category:</b> Search</li>
              <li><b>Price:</b> 0.002</li>
            </ul>
          </li>
          <li>Click <b>Sign and publish</b>. Your wallet pops up asking you to sign a text message (this is EIP-191, free, no gas). Approve.</li>
          <li>You&apos;re done. Head to <Link href="/registry" style={link}>/registry</Link> and your tool is there under Search.</li>
        </ol>
        <P>
          <b>Step B &mdash; onchain listing (terminal, optional).</b>{" "}
          If you want your tool to also show the <b>On Arc</b> badge on{" "}
          <Link href="/registry" style={link}>/registry</Link>, register it
          directly against the contract. You&apos;ll need an Arc-funded wallet
          (small USDC balance for gas &mdash; Arc uses USDC as gas).
        </P>
        <CodeBlock
          code={`cast send 0x7eA36cC743EDF162fd7BF3704BD55c56A1998bA7 \\
  "publish(string,uint256,string)" \\
  "weather.today" 2000 "https://keryxhq.xyz/api/tools" \\
  --rpc-url https://rpc.testnet.arc.network \\
  --private-key $YOUR_PRIVATE_KEY`}
        />
        <P>
          <code style={codeInline}>2000</code> is the price in atomic USDC
          (6 decimals, so $0.002 = 2000). The <code style={codeInline}>publish</code>{" "}
          call is idempotent per id &mdash; only the wallet that first publishes
          an id can update its price, and the contract emits a{" "}
          <code style={codeInline}>ToolPublished</code> event you can watch
          in the receipt.
        </P>
      </Step>

      <div
        style={{
          marginTop: 48,
          padding: 20,
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--surface-2)",
        }}
      >
        <div className="text-eyebrow" style={{ marginBottom: 10 }}>
          What just happened
        </div>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Every step above triggered a real HTTP 402 payment protocol handshake
          against a real USDC contract on Arc testnet, settled through a Kēryx
          facilitator wallet that has{" "}
          <a
            href="https://testnet.arcscan.app/address/0x8F47aE9eC148903C8535b9289ad8efA400e026B6"
            target="_blank"
            rel="noreferrer"
            style={link}
          >
            $116 USDC of runway
          </a>
          . The tx hashes you saw on <Link href="/live" style={link}>/live</Link>{" "}
          are provable, permanent onchain records anyone can verify.
        </p>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 32 }}>
        Prefer reading first? &nbsp;→{" "}
        <Link href="/whitepaper" style={link}>the whitepaper</Link>{" "}
        &nbsp;·&nbsp;{" "}
        <Link href="/docs" style={link}>the integration docs</Link>
      </p>
    </div>
  );
}

// ---- helpers ----

const link: React.CSSProperties = {
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

const olStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  paddingLeft: 22,
  marginBottom: 14,
};

const ulStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--text-secondary)",
  lineHeight: 1.7,
  paddingLeft: 20,
  marginTop: 6,
};

function Step({
  num,
  title,
  seconds,
  difficulty,
  children,
}: {
  num: number;
  title: string;
  seconds: number;
  difficulty: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 44, scrollMarginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          0{num}
        </span>
        <h2 className="text-subtitle" style={{ fontSize: 20, color: "var(--text-primary)", margin: 0 }}>
          {title}
        </h2>
        <span
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          ~{seconds}s · {difficulty}
        </span>
      </div>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 12 }}>
      {children}
    </p>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div
      style={{
        position: "relative",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
        <CopyButton text={code} />
      </div>
      <pre
        style={{
          margin: 0,
          padding: 16,
          paddingTop: 44,
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.55,
          overflowX: "auto",
          color: "var(--text-primary)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
