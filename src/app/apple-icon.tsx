import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Larger variant for iOS home-screen / bookmark icons. */
export default function AppleIcon() {
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
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="42" r="22" fill="none" stroke="#f3f3f1" strokeWidth="6.5" />
          <line x1="50" y1="18" x2="50" y2="90" stroke="#f3f3f1" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M26 29 Q 39 20 50 29" fill="none" stroke="#f3f3f1" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M74 29 Q 61 20 50 29" fill="none" stroke="#f3f3f1" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="50" cy="42" r="4" fill="#f3f3f1" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
