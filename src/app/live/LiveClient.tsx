"use client";

import { useEffect, useState } from "react";
import type { LedgerEntry } from "@/lib/ledger";

interface Stats {
  totalPaidUsd: number;
  callCount: number;
  publisherCount: number;
}

interface Props {
  initialEntries: LedgerEntry[];
  initialStats: Stats;
}

function relTime(ts: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export default function LiveClient({ initialEntries, initialStats }: Props) {
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [now, setNow] = useState<number>(Date.now());
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const r = await fetch("/api/ledger", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { stats: Stats; entries: LedgerEntry[] };
        setStats(data.stats);
        setEntries((prev) => {
          const newHead = data.entries[0];
          if (newHead && newHead.id !== prev[0]?.id) {
            setFlashId(newHead.id);
            setTimeout(() => setFlashId(null), 900);
          }
          return data.entries;
        });
      } catch {
        /* ignore transient errors */
      }
    }, 2500);
    return () => {
      clearInterval(clock);
      clearInterval(poll);
    };
  }, []);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="Total paid" value={`$${stats.totalPaidUsd.toFixed(4)}`} />
        <StatCard label="Calls" value={stats.callCount.toLocaleString()} />
        <StatCard label="Publishers" value={String(stats.publisherCount)} />
        <StatCard label="Settlement" value="Arc · <2s" />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr 0.8fr 0.8fr 0.9fr",
            gap: 12,
            alignItems: "center",
          }}
          className="text-eyebrow"
        >
          <span>When</span>
          <span>Tool</span>
          <span>Publisher</span>
          <span style={{ textAlign: "right" }}>Paid</span>
          <span style={{ textAlign: "right" }}>Status</span>
        </div>

        {entries.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            No calls yet. Head to{" "}
            <a href="/ask" style={{ color: "var(--accent)" }}>
              /ask
            </a>{" "}
            and ask Kēryx a question.
          </div>
        )}

        {entries.map((e, i) => (
          <div
            key={e.id}
            style={{
              padding: "14px 20px",
              borderBottom:
                i < entries.length - 1 ? "1px solid var(--border)" : "none",
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 0.8fr 0.8fr 0.9fr",
              gap: 12,
              alignItems: "center",
              background:
                flashId === e.id ? "var(--gold-tint)" : "transparent",
              transition: "background 700ms ease-out",
            }}
          >
            <span className="text-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {relTime(e.ts, now)}
            </span>
            <span style={{ minWidth: 0 }}>
              <div className="text-mono" style={{ fontSize: 13, color: "var(--text-primary)" }}>
                {e.toolId}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                caller: <span className="text-mono">{e.callerId}</span>
              </div>
            </span>
            <span className="text-mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
              {e.publisherName}
            </span>
            <span
              className="text-mono"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
                textAlign: "right",
              }}
            >
              ${e.priceUsd.toFixed(4)}
            </span>
            <span style={{ textAlign: "right" }}>
              <span
                className={
                  e.status === "paid"
                    ? "badge badge-success"
                    : e.status === "failed"
                      ? "badge badge-info"
                      : "badge"
                }
              >
                {e.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-inset">
      <div className="text-eyebrow" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div
        className="text-mono"
        style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}
