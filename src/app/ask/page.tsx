import AskClient from "./AskClient";

export const metadata = {
  title: "Ask Kēryx — the paid tool registry for AI agents",
  description:
    "Ask a question. Watch Kēryx pay real developers for real data to answer it.",
};

export default function AskPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
          The playground
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          Ask Kēryx
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every question Kēryx answers is grounded in a real tool call. Every
          call is a real USDC nanopayment to a real publisher. Watch the ledger
          tick up on <a href="/live" style={{ color: "var(--accent)" }}>/live</a> while you chat.
        </p>
      </div>
      <AskClient />
    </div>
  );
}
