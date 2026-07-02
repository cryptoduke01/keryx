import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import type { ToolCategory } from "@/lib/registry/seed";
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
};

export default async function RegistryPage() {
  const tools = await listTools();
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
            {byCategory[cat]?.map((tool) => (
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
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Price</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      ${tool.priceUsd.toFixed(3)}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
