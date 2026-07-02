import PublishClient from "./PublishClient";

export const metadata = {
  title: "Publish a tool · Kēryx",
  description:
    "Turn any HTTP endpoint into a paid tool for AI agents. Set a price. Connect an Arc wallet. Ship.",
};

export default function PublishPage() {
  return (
    <div className="container-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32, maxWidth: 720 }}>
        <div className="text-eyebrow" style={{ marginBottom: 12 }}>
          Publish
        </div>
        <h1 className="text-headline" style={{ marginBottom: 12 }}>
          Ship a paid tool in a minute.
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every AI agent needs tools. Publish yours &mdash; set a price per
          call, connect the Arc wallet where you want to be paid, and Kēryx
          routes agent calls straight to it. Your revenue lands on-chain.
        </p>
      </div>
      <PublishClient />
    </div>
  );
}
