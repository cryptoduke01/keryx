import { ImageResponse } from "next/og";
import {
  OKX_ASP_ID,
  OKX_ASP_NAME,
} from "@/lib/okxasp/metadata";

export const alt = `${OKX_ASP_NAME} · ASP #${OKX_ASP_ID} · LIVE on OKX.AI`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG card for /okxasp only.
 * Neon OKX energy — not the root Arc/bronze Keryx registry card.
 */
export default function OkxAspOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          padding: "56px 64px",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Neon orb — top right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(184,255,60,0.28) 0%, rgba(184,255,60,0.06) 45%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Cool depth — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(28,63,158,0.35) 0%, rgba(28,63,158,0.08) 45%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 28,
                color: "#f3f3f1",
                fontStyle: "italic",
                fontWeight: 400,
                display: "flex",
              }}
            >
              Keryx
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#67676a",
                display: "flex",
              }}
            >
              /
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#9d9d9f",
                fontWeight: 600,
                letterSpacing: 1,
                display: "flex",
              }}
            >
              OKX.AI
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(184,255,60,0.45)",
              background: "rgba(184,255,60,0.12)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#b8ff3c",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#b8ff3c",
                letterSpacing: 2,
                display: "flex",
              }}
            >
              LIVE · ASP #{OKX_ASP_ID}
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#f3f3f1",
              lineHeight: 1.05,
              letterSpacing: -1.5,
              display: "flex",
            }}
          >
            Finance Copilot
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#9d9d9f",
              lineHeight: 1.35,
              display: "flex",
              maxWidth: 900,
            }}
          >
            Nine tools for AI agents. Pay per call in USDT0 on X Layer.
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 600,
              color: "#b8ff3c",
              letterSpacing: 1,
              display: "flex",
            }}
          >
            402 → PAY → JSON
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #202022",
            paddingTop: 28,
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#9d9d9f",
              display: "flex",
              gap: 20,
            }}
          >
            <span style={{ display: "flex" }}>okx.ai/agents/{OKX_ASP_ID}</span>
            <span style={{ color: "#67676a", display: "flex" }}>·</span>
            <span style={{ display: "flex" }}>keryxhq.xyz/okxasp</span>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#67676a",
              letterSpacing: 2,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            A2MCP · X Layer · not Arc
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
