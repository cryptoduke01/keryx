import AskClient from "./AskClient";

export const metadata = {
  title: "Ask Kēryx · The paid tool registry for AI agents",
  description:
    "Ask a question. Watch Kēryx pay real developers for real data to answer it.",
};

export default function AskPage() {
  return (
    <div className="container-page" style={{ paddingTop: 16, paddingBottom: 48 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.6rem, 2.8vw, 2rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Ask Kēryx
          </h1>
          <span className="text-eyebrow" style={{ color: "var(--text-muted)" }}>
            The playground
          </span>
        </div>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-muted)",
            lineHeight: 1.4,
            maxWidth: 460,
            margin: 0,
          }}
        >
          Real tool calls, real USDC on Arc. The agent only spends when fresh data
          is worth the cost &mdash; watch the ledger fill on{" "}
          <a href="/live" style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>/live</a>.
        </p>
      </div>

      <AskClient />
    </div>
  );
}
