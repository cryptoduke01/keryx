import AskClient from "./AskClient";
import ArtPanel from "@/components/ArtPanel";

export const metadata = {
  title: "Ask Kēryx · The paid tool registry for AI agents",
  description:
    "Ask a question. Watch Kēryx pay real developers for real data to answer it.",
};

export default function AskPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          The playground
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          Ask Kēryx
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every question Kēryx answers is grounded in a real tool call. Every
          call is a real USDC nanopayment to a real publisher. Watch the ledger
          tick up on{" "}
          <a href="/live" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            /live
          </a>{" "}
          while you chat.
        </p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <ArtPanel
          src="/inspo/ask-hero.png"
          alt="A reader consulting an oracle beneath a shower of light"
          aspectRatio="16 / 5"
          position="50% 55%"
          variant="raw"
          overlayText="THE ORACLE READS. AGENTS PAY. THE LEDGER REMEMBERS."
        />
      </div>

      <AskClient />
    </div>
  );
}
