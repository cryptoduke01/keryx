import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Keryx favicon — a simplified herald's-staff monogram: a coin-disc
 * bisected by the rod, with two small wing ticks. Legible at 16px.
 * Generated at request time via Satori/ImageResponse, no external
 * asset needed.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 100">
          <circle cx="50" cy="42" r="22" fill="none" stroke="#f3f3f1" strokeWidth="7" />
          <line x1="50" y1="20" x2="50" y2="88" stroke="#f3f3f1" strokeWidth="7" strokeLinecap="round" />
          <path d="M28 30 Q 40 22 50 30" fill="none" stroke="#f3f3f1" strokeWidth="6" strokeLinecap="round" />
          <path d="M72 30 Q 60 22 50 30" fill="none" stroke="#f3f3f1" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
