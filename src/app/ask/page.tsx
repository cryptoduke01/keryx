import AskClient from "./AskClient";

export const metadata = {
  title: "Ask Kēryx · The paid tool registry for AI agents",
  description:
    "Ask a question. Watch Kēryx pay real developers for real data to answer it.",
};

export default function AskPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 28, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          The playground
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          Ask Kēryx
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every question is answered with real tool calls. Every call becomes a real
          USDC transaction on Arc. Watch the ledger fill on{" "}
          <a href="/live" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            /live
          </a>{" "}
          while you chat.
        </p>
      </div>

      <AskClient />
    </div>
  );
}
