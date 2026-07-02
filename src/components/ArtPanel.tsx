import Image from "next/image";

/**
 * A side-panel or hero-strip art frame. Reuses the same duotone re-tint
 * pattern as the landing hero: grayscale the source, blend our gold/cobalt
 * gradient back in via mix-blend-mode. Same brand palette regardless of
 * whatever the underlying photo looks like.
 */
export default function ArtPanel({
  src,
  alt,
  aspectRatio = "3 / 4",
  minHeight,
  overlayText,
  className,
  variant = "duotone",
  position = "50% 50%",
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  minHeight?: number | string;
  overlayText?: string;
  className?: string;
  /** "duotone" reapplies brand palette. "raw" leaves the source colors alone. */
  variant?: "duotone" | "raw";
  position?: string;
}) {
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
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(min-width: 900px) 40vw, 100vw"
        className={variant === "duotone" ? "art-photo" : ""}
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
      <div className="art-grain" />
      {overlayText && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "16px 18px",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(11,11,12,0.75) 80%)",
            color: "#f5f4f0",
            fontSize: 12,
            letterSpacing: "0.04em",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          {overlayText}
        </div>
      )}
    </div>
  );
}
