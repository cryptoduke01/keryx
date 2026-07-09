"use client";

import { useState } from "react";

type ToolOption = {
  id: string;
  name: string;
  slug: string;
  price: string;
  sampleArgs: Record<string, unknown>;
};

type LoopState =
  | { step: "idle" }
  | { step: "calling" }
  | {
      step: "402";
      amount: string;
      network: string;
      asset: string;
      payTo: string;
      rawHeader: string;
    }
  | { step: "paid"; result: unknown; paymentResponse?: string }
  | { step: "error"; message: string };

function buildUrl(slug: string, args: Record<string, unknown>): string {
  const u = new URL(`/api/okxasp/tools/${slug}`, window.location.origin);
  for (const [k, v] of Object.entries(args)) {
    if (v == null || v === "") continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function decodePaymentRequired(header: string | null): {
  amount: string;
  network: string;
  asset: string;
  payTo: string;
} | null {
  if (!header) return null;
  try {
    const json = JSON.parse(atob(header.replace(/-/g, "+").replace(/_/g, "/")));
    const a = json.accepts?.[0];
    if (!a) return null;
    const raw = Number(a.amount);
    const usd = Number.isFinite(raw) ? raw / 1_000_000 : NaN;
    return {
      amount: Number.isFinite(usd)
        ? `$${usd.toFixed(usd < 0.01 ? 4 : 3)} USDT0`
        : String(a.amount),
      network: String(a.network ?? ""),
      asset: String(a.extra?.name ?? a.asset ?? "USDT0"),
      payTo: String(a.payTo ?? ""),
    };
  } catch {
    return null;
  }
}

export default function OkxAgentLoop({ tools }: { tools: ToolOption[] }) {
  const [toolId, setToolId] = useState(tools[0]?.id ?? "");
  const tool = tools.find((t) => t.id === toolId) ?? tools[0];
  const [argsText, setArgsText] = useState(
    JSON.stringify(tool?.sampleArgs ?? {}, null, 2),
  );
  const [state, setState] = useState<LoopState>({ step: "idle" });

  async function runProbe() {
    if (!tool) return;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(argsText) as Record<string, unknown>;
    } catch {
      setState({ step: "error", message: "Args must be valid JSON." });
      return;
    }

    setState({ step: "calling" });
    try {
      const url = buildUrl(tool.slug, args);
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const payHeader =
        res.headers.get("payment-required") ||
        res.headers.get("Payment-Required");

      if (res.status === 402) {
        const decoded = decodePaymentRequired(payHeader);
        setState({
          step: "402",
          amount: decoded?.amount ?? tool.price,
          network: decoded?.network ?? "eip155:1952",
          asset: decoded?.asset ?? "USDT0",
          payTo: decoded?.payTo ?? "",
          rawHeader: payHeader ?? "",
        });
        return;
      }

      if (!res.ok) {
        const body = await res.text();
        setState({
          step: "error",
          message: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        });
        return;
      }

      const json = (await res.json()) as unknown;
      setState({
        step: "paid",
        result: json,
        paymentResponse:
          res.headers.get("payment-response") ||
          res.headers.get("Payment-Response") ||
          undefined,
      });
    } catch (err) {
      setState({
        step: "error",
        message: err instanceof Error ? err.message : "request_failed",
      });
    }
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--surface-1)",
        padding: 20,
      }}
    >
      <div className="text-eyebrow" style={{ marginBottom: 10 }}>
        Live agent loop
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 500,
          margin: "0 0 8px",
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        Call → 402 → pay → JSON
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          margin: "0 0 16px",
        }}
      >
        This is what an agent does. Probe a tool unpaid, read the price, settle
        with Agentic Wallet /{" "}
        <code style={code}>onchainos payment pay</code>, retry with the
        signature.
      </p>

      <label style={label}>Tool</label>
      <select
        value={tool?.id}
        onChange={(e) => {
          const next = tools.find((t) => t.id === e.target.value);
          setToolId(e.target.value);
          if (next) setArgsText(JSON.stringify(next.sampleArgs, null, 2));
        }}
        style={input}
      >
        {tools.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.price}
          </option>
        ))}
      </select>

      <label style={{ ...label, marginTop: 12 }}>Args (JSON)</label>
      <textarea
        value={argsText}
        onChange={(e) => setArgsText(e.target.value)}
        rows={5}
        style={{ ...input, fontFamily: "var(--font-mono)", fontSize: 12.5 }}
      />

      <button
        type="button"
        onClick={() => void runProbe()}
        disabled={state.step === "calling"}
        style={btn}
      >
        {state.step === "calling" ? "Calling…" : "Probe unpaid (expect 402)"}
      </button>

      {state.step === "402" && (
        <div style={panel}>
          <div style={panelTitle}>HTTP 402 · payment required</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, marginBottom: 8 }}>
            {state.amount}
          </div>
          <div style={meta}>Network {state.network}</div>
          <div style={meta}>Asset {state.asset}</div>
          {state.payTo && <div style={meta}>Pay to {state.payTo}</div>}
          <pre style={pre}>
            {`# Sign with Agentic Wallet
onchainos payment pay --payload "$PAYMENT_REQUIRED" --chain xlayer
# Retry with header PAYMENT-SIGNATURE: <authorization_header>`}
          </pre>
        </div>
      )}

      {state.step === "paid" && (
        <div style={panel}>
          <div style={panelTitle}>Paid · result</div>
          <pre style={pre}>{JSON.stringify(state.result, null, 2)}</pre>
        </div>
      )}

      {state.step === "error" && (
        <div style={{ ...panel, borderColor: "rgba(220,80,80,0.4)" }}>
          <div style={panelTitle}>Error</div>
          <div style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
            {state.message}
          </div>
        </div>
      )}
    </div>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  fontSize: 13.5,
};

const btn: React.CSSProperties = {
  marginTop: 14,
  height: 40,
  padding: "0 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--text-primary)",
  color: "var(--surface-0)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const panel: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: 8,
};

const meta: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--text-secondary)",
  fontFamily: "var(--font-mono)",
  marginBottom: 4,
};

const pre: React.CSSProperties = {
  margin: "12px 0 0",
  padding: 12,
  borderRadius: 8,
  background: "#0b0b0c",
  color: "#f5f4f0",
  fontSize: 11.5,
  overflow: "auto",
  maxHeight: 280,
};

const code: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
};
