import Image from "next/image";

/**
 * Side-panel / hero-strip art frame.
 * - duotone: brand gold/cobalt re-tint
 * - neon: OKX-rail lime re-tint (for /okxasp docs + note)
 * - raw: source colors with a light contrast bump
 */
export default function ArtPanel({
  src,
  alt,
  aspectRatio = "3 / 4",
  minHeight,
  overlayText,
  headline,
  className,
  variant = "duotone",
  position = "50% 50%",
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  minHeight?: number | string;
  overlayText?: string;
  /** Large headline overlaid on the art (docs / product note). */
  headline?: string;
  className?: string;
  variant?: "duotone" | "raw" | "neon";
  position?: string;
}) {
  const photoClass =
    variant === "duotone"
      ? "art-photo"
      : variant === "neon"
        ? "art-photo art-photo-neon"
        : "";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio,
        minHeight,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#0b0b0c",
        isolation: "isolate",
        width: "100%",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(min-width: 900px) 70vw, 100vw"
        className={photoClass}
        style={{
          objectPosition: position,
          objectFit: "cover",
          ...(variant === "raw"
            ? { filter: "contrast(1.05) saturate(1.05) brightness(1.15)" }
            : {}),
        }}
        priority={false}
      />
      {variant === "duotone" && <div className="art-photo-tint" />}
      {variant === "neon" && <div className="art-photo-tint-neon" />}
      <div className="art-grain" />
      {(headline || overlayText) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: headline ? "28px 24px 22px" : "16px 18px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(11,11,12,0.78) 70%)",
            color: "#f5f4f0",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          {headline && (
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.35rem, 2.8vw, 1.85rem)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                marginBottom: overlayText ? 8 : 0,
                maxWidth: 520,
              }}
            >
              {headline}
            </div>
          )}
          {overlayText && (
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "rgba(245,244,240,0.82)",
              }}
            >
              {overlayText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
