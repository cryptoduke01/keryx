import type { CSSProperties } from "react";

interface WordmarkProps {
  size?: number;
  showR?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * Kēryx wordmark. Instrument Serif italic — the swashy editorial lockup
 * font, reserved for exactly this use (see brand notes: Obscura uses the
 * same family of face for its "Obscura®" logotype). Never used for body
 * headlines, which stay on Fraunces.
 */
export default function Wordmark({
  size = 22,
  showR = true,
  style,
  className,
}: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-wordmark)",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: size * 1.15,
        letterSpacing: "0.002em",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "baseline",
        color: "inherit",
        ...style,
      }}
    >
      Kēryx
      {showR && (
        <sup
          style={{
            fontSize: "0.4em",
            marginLeft: "0.1em",
            top: "-0.9em",
            fontStyle: "normal",
            fontFamily: "var(--font-sans)",
            opacity: 0.7,
          }}
        >
          ®
        </sup>
      )}
    </span>
  );
}
