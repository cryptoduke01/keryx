import LiveClient from "./LiveClient";
import { ledgerStats, readEntries } from "@/lib/ledger";

export const metadata = {
  title: "Live · Keryx",
  description: "Every paid tool call on Keryx, in real time.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  // Show a healthy chunk of recent activity so /live demonstrates real volume
  // instead of a tiny 40-row tail. Never throw — empty feed if ledger is down.
  let entries: Awaited<ReturnType<typeof readEntries>> = [];
  let stats = {
    totalPaidUsd: 0,
    callCount: 0,
    publisherCount: 0,
    callerCount: 0,
    toolCount: 0,
  };
  try {
    [entries, stats] = await Promise.all([readEntries(120), ledgerStats()]);
  } catch (err) {
    console.error("[live] ledger load failed", err);
  }
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          Public ledger
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          Every payment. Every tool. Live.
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          The moment an agent calls a paid tool, it lands here. Ledger updates
          every second.
        </p>
      </div>
      <LiveClient initialEntries={entries} initialStats={stats} />
    </div>
  );
}
