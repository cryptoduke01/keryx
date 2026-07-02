"use client";

import { useState } from "react";

type Category = "solana" | "search" | "scrape" | "memory" | "compute" | "social";

export default function PublishClient() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<Category>("compute");
  const [priceUsd, setPriceUsd] = useState("0.005");
  const [wallet, setWallet] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "ok"; toolId: string }
    | { kind: "err"; msg: string }
  >({ kind: "idle" });

  const canSubmit =
    name.trim().length > 2 &&
    slug.trim().length > 2 &&
    summary.trim().length > 8 &&
    /^0x[a-fA-F0-9]{40}$/.test(wallet.trim()) &&
    Number(priceUsd) > 0 &&
    status.kind !== "submitting";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const r = await fetch("/api/publishers/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: slug.trim(),
          name: name.trim(),
          summary: summary.trim(),
          category,
          priceUsd: Number(priceUsd),
          publisherWallet: wallet.trim(),
          publisherName: publisherName.trim() || "Anonymous",
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatus({ kind: "err", msg: j?.error ?? "publish_failed" });
        return;
      }
      const j = await r.json();
      setStatus({ kind: "ok", toolId: j?.tool?.id ?? slug.trim() });
    } catch (err) {
      setStatus({
        kind: "err",
        msg: err instanceof Error ? err.message : "network_error",
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card"
      style={{
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Field label="Tool name" hint="e.g. Grounded Web Search">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Grounded Web Search"
          style={inputStyle}
        />
      </Field>

      <Field label="Tool id" hint="URL-safe slug. Dots allowed. Example: search.web">
        <input
          type="text"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9.\-_]/g, ""))
          }
          placeholder="search.web"
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
        />
      </Field>

      <Field label="One-sentence summary" hint="What an agent reads to decide whether to call it.">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="Web search that returns clean snippets + source URLs. Optimized for LLM grounding."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            style={inputStyle}
          >
            <option value="solana">Solana</option>
            <option value="search">Search</option>
            <option value="scrape">Scrape</option>
            <option value="memory">Memory</option>
            <option value="compute">Compute</option>
            <option value="social">Social</option>
          </select>
        </Field>
        <Field label="Price per call (USD)">
          <input
            type="number"
            step="0.0001"
            min="0"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          />
        </Field>
      </div>

      <Field label="Arc payout wallet (0x…)">
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
        />
      </Field>

      <Field label="Publisher display name (optional)">
        <input
          type="text"
          value={publisherName}
          onChange={(e) => setPublisherName(e.target.value)}
          placeholder="Your name or handle"
          style={inputStyle}
        />
      </Field>

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!canSubmit}
      >
        {status.kind === "submitting" ? "Publishing…" : "Publish tool"}
      </button>

      {status.kind === "ok" && (
        <div
          className="badge badge-success"
          style={{ padding: "10px 14px", fontSize: 13, whiteSpace: "normal", lineHeight: 1.5 }}
        >
          ✓ Published as <code style={{ fontFamily: "var(--font-mono)" }}>{status.toolId}</code>.
          Head to <a href="/registry" style={{ color: "inherit", textDecoration: "underline" }}>/registry</a> to see the listing.
        </div>
      )}
      {status.kind === "err" && (
        <div
          className="badge badge-info"
          style={{ padding: "10px 14px", fontSize: 13, whiteSpace: "normal", lineHeight: 1.5 }}
        >
          Could not publish: {status.msg}
        </div>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  outline: "none",
  fontSize: 14,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="text-eyebrow">{label}</div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </label>
  );
}
