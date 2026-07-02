import LiveClient from "./LiveClient";
import { ledgerStats, readEntries } from "@/lib/ledger";

export const metadata = {
  title: "Live · Kēryx",
  description: "Every paid tool call on Kēryx, in real time.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [entries, stats] = await Promise.all([readEntries(40), ledgerStats()]);
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
