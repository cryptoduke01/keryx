import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import type { ToolCategory } from "@/lib/registry/seed";
import { isSeededExecutableTool } from "@/lib/registry/handlers";
import {
  arcscanAddressUrl,
  getOnchainTool,
  isConfigured as onchainConfigured,
  registryAddress,
} from "@/lib/onchain/registry";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  solana: "Solana",
  search: "Search",
  scrape: "Scrape",
  memory: "Memory",
  compute: "Compute",
  social: "Social",
  weather: "Weather",
  finance: "Finance",
  geo: "Geo & IP",
  dns: "DNS & Domains",
  utility: "Utilities",
  web: "Web & Content",
};

export default async function RegistryPage() {
  const allTools = await listTools();
  // Hide demo/example tools from the public registry UI. They remain callable
  // via the API for demonstrations, but shouldn't clutter the browsable list.
  const tools = allTools.filter((t) => !t.id.startsWith("demo."));
  const byCategory: Partial<Record<ToolCategory, typeof tools>> = {};
  for (const t of tools) {
    (byCategory[t.category] ??= []).push(t);
  }

  // Enrich with onchain state when the KeryxRegistry contract is configured.
  // Requests run in parallel; each one has its own try/catch so a single
  // downed RPC can't break the whole page.
  const onchainByToolId: Record<string, Awaited<ReturnType<typeof getOnchainTool>>> = {};
  if (onchainConfigured()) {
    const entries = await Promise.all(
      tools.map(async (t) => [t.id, await getOnchainTool(t.id)] as const),
    );
    for (const [id, state] of entries) onchainByToolId[id] = state;
  }
  const contractAddress = registryAddress();

  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          Registry
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          {tools.length} tools live on Kēryx.
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every tool is a real HTTP endpoint. Every call pays the publisher in
          USDC. Discover by capability, call by id.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 8 }}>
          Some tools wrap high-quality public data sources (always-on, structured, settled). Others are paid creator or proprietary content.
          Kēryx is the payment, discovery, and settlement layer — not a replacement for free web browsing.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/publish" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary btn-sm">Publish yours →</button>
          </Link>
          <Link href="/docs" style={{ textDecoration: "none" }}>
            <button className="btn btn-outline btn-sm">API docs</button>
          </Link>
        </div>
        {contractAddress && (
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            Registry contract on Arc testnet:{" "}
            <a
              href={arcscanAddressUrl(contractAddress)}
              target="_blank"
              rel="noreferrer"
              className="text-mono"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}
            </a>
          </div>
        )}
      </div>

      {(Object.keys(byCategory) as ToolCategory[]).map((cat) => (
        <section key={cat} style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2 className="text-subtitle" style={{ color: "var(--text-primary)" }}>
              {CATEGORY_LABEL[cat]}
            </h2>
            <span className="text-eyebrow">{byCategory[cat]?.length ?? 0} tools</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {byCategory[cat]?.map((tool) => {
              const isExecutable = isSeededExecutableTool(tool.id) || !!tool.handlerUrl;
              const isKeryxTreasury = tool.publisherWallet === "0x8F47aE9eC148903C8535b9289ad8efA400e026B6";
              return (
              <div key={tool.id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 8,
                  }}
                >
                  <span className="text-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {tool.id}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {onchainByToolId[tool.id] && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                        title="Listed onchain on Arc testnet"
                      >
                        On Arc
                      </span>
                    )}
                    {tool.verified && (
                      <span className="badge badge-gold" style={{ fontSize: 9 }}>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.005em",
                    marginBottom: 6,
                  }}
                >
                  {tool.name}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16, minHeight: 42 }}>
                  {tool.summary}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Price per call</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      ${tool.priceUsd.toFixed(3)} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)" }}>(95% to publisher)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Latency</div>
                    <div style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      ~{tool.latencyMs}ms
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Publisher</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {tool.publisherName}
                    </div>
                    {!isKeryxTreasury && (
                      <div style={{ fontSize: 9, color: "#10b981", fontFamily: "var(--font-mono)" }}>
                        external • gets paid
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {isExecutable ? (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--surface-3)", color: "var(--text-secondary)" }}>Kēryx executes • real settlement</span>
                  ) : (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--surface-3)", color: "var(--text-muted)" }}>Discovery only • add handlerUrl to execute</span>
                  )}
                </div>
              </div>
            )})}
          </div>
        </section>
      ))}
    </div>
  );
}
