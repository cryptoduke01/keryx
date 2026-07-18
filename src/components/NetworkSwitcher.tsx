"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ARC_NETWORK_STORAGE_KEY,
  type ArcNetworkId,
} from "@/lib/chains";

type NetRow = {
  id: ArcNetworkId;
  label: string;
  caip2: string;
  chainId: number;
  ready: boolean;
  notReadyReason: string | null;
  active: boolean;
};

/**
 * Arc Testnet / Mainnet control.
 * Settlement network is server-driven (NEXT_PUBLIC_ARC_NETWORK).
 * Mainnet option is disabled until Circle publishes public params + env is set.
 */
export default function NetworkSwitcher() {
  const [networks, setNetworks] = useState<NetRow[]>([]);
  const [active, setActive] = useState<ArcNetworkId>("testnet");
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/arc-network", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          active: ArcNetworkId;
          networks: NetRow[];
        };
        if (cancelled) return;
        setNetworks(data.networks ?? []);
        setActive(data.active ?? "testnet");
        try {
          localStorage.setItem(
            ARC_NETWORK_STORAGE_KEY,
            data.active ?? "testnet",
          );
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeRow = networks.find((n) => n.id === active) ?? networks[0];

  const onSelect = useCallback((n: NetRow) => {
    if (!n.ready) {
      setNote(n.notReadyReason ?? "Not available yet");
      setOpen(false);
      return;
    }
    if (!n.active) {
      // Server settlement is env-pinned until dual-facilitator ships.
      // Selecting a ready non-active network tells the user how to switch.
      setNote(
        n.id === "mainnet"
          ? "Mainnet is configured but not active. Set NEXT_PUBLIC_ARC_NETWORK=mainnet on Vercel and redeploy to settle on mainnet."
          : "Set NEXT_PUBLIC_ARC_NETWORK=testnet and redeploy to settle on testnet.",
      );
      setOpen(false);
      return;
    }
    setActive(n.id);
    setNote(null);
    setOpen(false);
    try {
      localStorage.setItem(ARC_NETWORK_STORAGE_KEY, n.id);
    } catch {
      /* ignore */
    }
  }, []);

  if (!activeRow) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid var(--border)",
        }}
      >
        Arc
      </span>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setNote(null);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface-1)",
          color: "var(--text-primary)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background:
              activeRow.id === "mainnet" && activeRow.ready
                ? "#b8ff3c"
                : "#6b9fff",
          }}
        />
        {activeRow.label}
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            minWidth: 220,
            padding: 6,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-1)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            zIndex: 60,
          }}
        >
          {networks.map((n) => {
            const selected = n.id === active;
            return (
              <button
                key={n.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(n)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: selected
                    ? "var(--surface-2)"
                    : "transparent",
                  color: n.ready
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: selected ? 600 : 500,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{n.label}</span>
                  {!n.ready && (
                    <span style={{ fontSize: 10, letterSpacing: "0.04em" }}>
                      SOON
                    </span>
                  )}
                  {n.ready && n.active && (
                    <span style={{ fontSize: 10, color: "#8fbf2e" }}>ACTIVE</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {n.ready ? n.caip2 : "Awaiting public mainnet params"}
                </div>
              </button>
            );
          })}
          {note && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                fontSize: 11,
                lineHeight: 1.45,
                color: "var(--text-secondary)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
