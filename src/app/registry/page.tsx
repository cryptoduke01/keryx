import Link from "next/link";
import { listTools } from "@/lib/registry/store";
import type { ToolCategory } from "@/lib/registry/seed";

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
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Link href="/publish" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary btn-sm">Publish yours →</button>
          </Link>
          <Link href="/docs" style={{ textDecoration: "none" }}>
            <button className="btn btn-outline btn-sm">API docs</button>
          </Link>
        </div>
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
                  }}
                >
                  <span className="text-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {tool.id}
                  </span>
                  {tool.verified && (
                    <span className="badge badge-gold" style={{ fontSize: 9 }}>
                      Verified
                    </span>
                  )}
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
                    <div className="text-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      ${tool.priceUsd.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Latency</div>
                    <div className="text-mono" style={{ color: "var(--text-primary)" }}>
                      ~{tool.latencyMs}ms
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="text-eyebrow" style={{ marginBottom: 2 }}>Publisher</div>
                    <div className="text-mono" style={{ color: "var(--text-primary)" }}>
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
