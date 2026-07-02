import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card. Generated at request time — no external asset. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          position: "relative",
        }}
      >
        {/* sunburst accent, top right */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(217,172,82,0.35) 0%, rgba(217,172,82,0.08) 45%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(28,63,158,0.4) 0%, rgba(28,63,158,0.1) 45%, transparent 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 28,
          }}
        >
          <svg width="64" height="64" viewBox="0 0 100 100">
            <circle cx="50" cy="42" r="22" fill="none" stroke="#f3f3f1" strokeWidth="6" />
            <line x1="50" y1="18" x2="50" y2="90" stroke="#f3f3f1" strokeWidth="6" strokeLinecap="round" />
            <path d="M26 29 Q 39 20 50 29" fill="none" stroke="#f3f3f1" strokeWidth="5" strokeLinecap="round" />
            <path d="M74 29 Q 61 20 50 29" fill="none" stroke="#f3f3f1" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 76, color: "#f3f3f1", fontWeight: 700, display: "flex" }}>
            Kēryx
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            color: "#9d9d9f",
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          The paid tool registry for AI agents
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: "#67676a",
            display: "flex",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          keryxhq.xyz · settles on arc
        </div>
      </div>
    ),
    { ...size }
  );
}
