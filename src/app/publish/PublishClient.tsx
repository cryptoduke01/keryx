"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { arcTestnet } from "@/lib/chains";

type Category = "solana" | "search" | "scrape" | "memory" | "compute" | "social";

export default function PublishClient() {
  const router = useRouter();
  const { address, isConnected, connector } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const [connectError, setConnectError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

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
    !wrongNetwork &&
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
        // Special case: id already registered. Point the user at it rather
        // than making them think publish silently failed.
        if (j?.error === "tool_id_taken") {
          setStatus({
            kind: "err",
            msg: `That id is already published. Try /registry to see it, or pick a different id.`,
          });
        } else {
          setStatus({ kind: "err", msg: j?.error ?? "publish_failed" });
        }
        return;
      }
      // Success — invalidate the router cache so /registry shows the new
      // listing without a hard reload, then clear the form for another go.
      setStatus({ kind: "ok", toolId: j?.tool?.id ?? slug.trim() });
      router.refresh();
      setName("");
      setSlug("");
      setSummary("");
      setPublisherName((n) => n); // keep publisher name for follow-up publishes
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
        isSwitching={isSwitching}
        wrongNetwork={wrongNetwork}
        connectorName={connector?.name}
        pickerOpen={pickerOpen}
        connectors={connectors.map((c) => ({ id: c.id, name: c.name, ready: !!c }))}
        error={connectError}
        onOpenPicker={() => {
          setConnectError(null);
          setPickerOpen(true);
        }}
        onPickConnector={async (connectorId) => {
          setConnectError(null);
          setPickerOpen(false);
          const c = connectors.find((x) => x.id === connectorId);
          if (!c) {
            setConnectError("Connector not available.");
            return;
          }
          try {
            await connectAsync({ connector: c, chainId: arcTestnet.id });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "connect_failed";
            if (/not installed|no provider|window\.ethereum/i.test(msg)) {
              setConnectError(`${c.name} isn't installed in this browser. Install it or pick another wallet.`);
            } else if (/rejected|denied|user closed/i.test(msg)) {
              setConnectError("Connection cancelled in the wallet.");
            } else {
              setConnectError(msg.slice(0, 140));
            }
          }
        }}
        onSwitchNetwork={async () => {
          setConnectError(null);
          try {
            await switchChainAsync({ chainId: arcTestnet.id });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "switch_failed";
            setConnectError(
              /add|4902/i.test(msg)
                ? "Approve adding Arc testnet in your wallet, then retry."
                : msg.slice(0, 140),
            );
          }
        }}
        onDisconnect={() => {
          void disconnectAsync();
          setConnectError(null);
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
          style={{
            padding: 16,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#10b981",
                display: "inline-block",
                animation: "keryx-pulse 2000ms ease-in-out infinite",
              }}
            />
            Published as <code style={{ fontFamily: "var(--font-mono)" }}>{status.toolId}</code>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            The tool is live in the registry now. Signed and stored — any agent hitting
            {" "}<code style={{ fontFamily: "var(--font-mono)" }}>GET /api/tools</code>{" "}
            picks it up immediately.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href={`/registry`}
              className="btn btn-sm btn-primary"
              style={{ textDecoration: "none" }}
            >
              See on /registry →
            </a>
            <a
              href={`/api/tools/${encodeURIComponent(status.toolId)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{ textDecoration: "none" }}
            >
              View JSON
            </a>
          </div>
        </div>
      )}
      {status.kind === "err" && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "rgba(220, 80, 80, 0.08)",
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.55,
          }}
        >
          {status.msg}
        </div>
      )}
    </form>
  );
}

function WalletHeader({
  address,
  isConnected,
  isConnecting,
  isSwitching,
  wrongNetwork,
  connectorName,
  connectors,
  pickerOpen,
  error,
  onOpenPicker,
  onPickConnector,
  onSwitchNetwork,
  onDisconnect,
}: {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  isSwitching: boolean;
  wrongNetwork: boolean;
  connectorName?: string;
  connectors: Array<{ id: string; name: string; ready: boolean }>;
  pickerOpen: boolean;
  error: string | null;
  onOpenPicker: () => void;
  onPickConnector: (id: string) => void | Promise<void>;
  onSwitchNetwork: () => void | Promise<void>;
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
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
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
            onClick={onOpenPicker}
            disabled={isConnecting}
            className="btn btn-primary"
            style={{ fontSize: 13 }}
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>

      {pickerOpen && !isConnected && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {connectors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPickConnector(c.id)}
              disabled={isConnecting}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-3)",
                color: "var(--text-primary)",
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {wrongNetwork && isConnected && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-3)",
            fontSize: 12.5,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span>
            Wrong network. Switch to <b>Arc testnet</b> so your publish tx settles where the registry lives.
          </span>
          <button
            type="button"
            onClick={onSwitchNetwork}
            disabled={isSwitching}
            className="btn btn-primary"
            style={{ fontSize: 12 }}
          >
            {isSwitching ? "Switching…" : "Switch network"}
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "rgba(220,80,80,0.08)",
            fontSize: 12.5,
            color: "var(--text-primary)",
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
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
