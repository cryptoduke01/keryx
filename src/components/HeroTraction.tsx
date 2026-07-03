"use client";

import { useEffect, useState } from "react";

/**
 * Live traction pill for the landing hero. Pulls /api/ledger every few
 * seconds so a visitor watching the page sees the counters actually move
 * whenever any agent, anywhere, calls a Kēryx tool. The color palette is
 * scoped to what reads well over the dark hero photo without leaning on
 * theme tokens (the pill sits in a fixed-dark surface regardless of
 * light/dark mode elsewhere).
 */

interface Stats {
  totalPaidUsd: number;
  callCount: number;
  publisherCount: number;
}

const POLL_MS = 4000;

export default function HeroTraction() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pulseOn, setPulseOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let lastCount = -1;

    async function tick() {
      try {
        const res = await fetch("/api/ledger?limit=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { stats?: Stats };
        if (cancelled || !data.stats) return;
        setStats(data.stats);
        if (lastCount !== -1 && data.stats.callCount > lastCount) {
          setPulseOn(true);
          setTimeout(() => !cancelled && setPulseOn(false), 700);
        }
        lastCount = data.stats.callCount;
      } catch {
        /* prod is fine — a transient fetch fail shouldn't nuke the UI */
      }
    }

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Show nothing until we have the first stat. Prevents a flash of "$0.00"
  // while the fetch is in-flight, which would misrepresent activity.
  if (!stats) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(15,15,17,0.55)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(6px)",
        color: "#f5f4f0",
        fontSize: 12.5,
        letterSpacing: "0.02em",
        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#10b981",
            display: "inline-block",
            animation: pulseOn
              ? "keryx-traction-flash 700ms ease-out"
              : "keryx-traction-pulse 2000ms ease-in-out infinite",
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", color: "#f5f4f0" }}>
          Live on Arc testnet
        </span>
      </span>
      <span style={{ opacity: 0.35 }}>·</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ${stats.totalPaidUsd.toFixed(4)} settled
      </span>
      <span style={{ opacity: 0.35 }}>·</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stats.callCount.toLocaleString()} paid call
        {stats.callCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
