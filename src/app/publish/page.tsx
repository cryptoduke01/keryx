import PublishClient from "./PublishClient";
import ArtPanel from "@/components/ArtPanel";

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 640px) minmax(0, 1fr)",
          gap: 32,
          alignItems: "start",
        }}
        className="publish-grid"
      >
        <PublishClient />
        <div className="publish-art">
          <div style={{ position: "sticky", top: 88 }}>
            <ArtPanel
              src="/inspo/publish-hero.jpg"
              alt="A palace of publishers watched over by heralds"
              aspectRatio="4 / 5"
              position="50% 40%"
              variant="raw"
              overlayText="EVERY TOOL YOU PUBLISH BECOMES ANOTHER MESSENGER IN THE REGISTRY."
            />
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1080px) {
              .publish-grid { grid-template-columns: 1fr !important; }
              .publish-art { display: none; }
            }
          `,
        }}
      />
    </div>
  );
}
