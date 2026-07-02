"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
} from "wagmi";

type Category = "solana" | "search" | "scrape" | "memory" | "compute" | "social";

export default function PublishClient() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<Category>("compute");
  const [priceUsd, setPriceUsd] = useState("0.005");
  const [publisherName, setPublisherName] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "step"; step: "requesting-nonce" | "awaiting-signature" | "submitting" }
    | { kind: "ok"; toolId: string }
    | { kind: "err"; msg: string }
  >({ kind: "idle" });

  const canSubmit =
    isConnected &&
    name.trim().length > 2 &&
    slug.trim().length > 2 &&
    summary.trim().length > 8 &&
    Number(priceUsd) > 0 &&
    status.kind !== "step";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !address) return;
    try {
      setStatus({ kind: "step", step: "requesting-nonce" });
      const nonceRes = await fetch("/api/publishers/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, toolId: slug.trim() }),
      }).then((r) => r.json());
      if (!nonceRes?.ok || !nonceRes.message) {
        setStatus({ kind: "err", msg: nonceRes?.error ?? "nonce_failed" });
        return;
      }

      setStatus({ kind: "step", step: "awaiting-signature" });
      const signature = await signMessageAsync({ message: nonceRes.message });

      setStatus({ kind: "step", step: "submitting" });
      const r = await fetch("/api/publishers/tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: slug.trim(),
          name: name.trim(),
          summary: summary.trim(),
          category,
          priceUsd: Number(priceUsd),
          publisherWallet: address,
          publisherName: publisherName.trim() || "Anonymous",
          nonce: nonceRes.nonce,
          issuedAt: nonceRes.issuedAt,
          signature,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus({ kind: "err", msg: j?.error ?? "publish_failed" });
        return;
      }
      setStatus({ kind: "ok", toolId: j?.tool?.id ?? slug.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network_error";
      setStatus({
        kind: "err",
        msg: /rejected|denied/i.test(msg) ? "signature_rejected_in_wallet" : msg,
      });
    }
  }

  const submitLabel = (() => {
    if (status.kind !== "step") return "Sign and publish";
    if (status.step === "requesting-nonce") return "Requesting nonce…";
    if (status.step === "awaiting-signature") return "Waiting for wallet…";
    return "Publishing…";
  })();

  return (
    <form
      onSubmit={submit}
      className="card"
      style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <WalletHeader
        address={address}
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectorName={connector?.name}
        onConnect={async () => {
          const preferred = connectors.find((c) => c.name === "MetaMask") ?? connectors[0];
          if (!preferred) return;
          try {
            await connectAsync({ connector: preferred });
          } catch {
            /* user closed wallet modal */
          }
        }}
        onDisconnect={() => {
          void disconnectAsync();
        }}
      />

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
          placeholder="Web search that returns clean snippets and source URLs. Optimised for LLM grounding."
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
        {submitLabel}
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

function WalletHeader({
  address,
  isConnected,
  isConnecting,
  connectorName,
  onConnect,
  onDisconnect,
}: {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectorName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--surface-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div className="text-eyebrow">Publisher wallet</div>
        {isConnected && address ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {address}
            {connectorName && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>
                via {connectorName}
              </span>
            )}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Connect a wallet on Arc testnet. Signing proves you control the wallet the payouts land in.
          </span>
        )}
      </div>
      {isConnected ? (
        <button
          type="button"
          onClick={onDisconnect}
          className="btn"
          style={{ fontSize: 12 }}
        >
          Disconnect
        </button>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          disabled={isConnecting}
          className="btn btn-primary"
          style={{ fontSize: 13 }}
        >
          {isConnecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </div>
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
