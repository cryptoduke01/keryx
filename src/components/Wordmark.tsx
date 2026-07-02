import type { CSSProperties } from "react";

interface WordmarkProps {
  size?: number;
  showR?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * Kēryx wordmark. Rendered as text so it stays crisp at every size and
 * inherits color. Italic Fraunces with the SOFT axis softened, small caps
 * off, ligatures on. The macron on the ē is a real Unicode glyph so it
 * copies cleanly.
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
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 500,
        fontOpticalSizing: "auto",
        fontSize: size,
        letterSpacing: "-0.015em",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "baseline",
        color: "inherit",
        fontFeatureSettings: '"ss01", "swsh", "salt"',
        ...style,
      }}
    >
      Kēryx
      {showR && (
        <sup
          style={{
            fontSize: "0.42em",
            marginLeft: "0.08em",
            top: "-0.85em",
            fontStyle: "normal",
            opacity: 0.75,
            fontFamily: "var(--font-display)",
          }}
        >
          ®
        </sup>
      )}
    </span>
  );
}
