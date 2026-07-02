import type { CSSProperties } from "react";

interface KerykeionProps {
  size?: number;
  style?: CSSProperties;
  className?: string;
  /** How opaque the linework is. */
  opacity?: number;
}

/**
 * The kērykeion — the herald's staff. In classical Greek iconography a
 * winged rod with two coiled snakes; the ancestor of the Roman caduceus.
 * Drawn as stroked SVG so it inherits `color` and can be tinted per
 * placement (gold on dark hero, cobalt on inverted section).
 */
export default function Kerykeion({
  size = 320,
  style,
  className,
  opacity = 1,
}: KerykeionProps) {
  const stroke = "currentColor";
  const s = 1.5;
  return (
    <svg
      viewBox="0 0 200 400"
      width={size}
      height={size * 2}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", opacity, ...style }}
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="orb" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.65" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central staff */}
      <line
        x1="100"
        y1="30"
        x2="100"
        y2="370"
        stroke={stroke}
        strokeWidth={s * 1.6}
        strokeLinecap="round"
      />

      {/* Crowning orb */}
      <circle cx="100" cy="30" r="9" fill="url(#orb)" stroke={stroke} strokeWidth={s} />
      <circle cx="100" cy="30" r="3" fill={stroke} />

      {/* Wings — mirrored, upper section */}
      {/* left wing */}
      <path
        d="M100 60
           C 78 58, 62 52, 48 44
           C 60 60, 70 74, 92 82
           Z"
        fill="none"
        stroke={stroke}
        strokeWidth={s}
        strokeLinejoin="round"
      />
      <path
        d="M100 68
           C 82 68, 68 66, 52 60
           C 66 78, 78 88, 96 92"
        fill="none"
        stroke={stroke}
        strokeWidth={s * 0.9}
        strokeLinecap="round"
      />
      <path
        d="M100 76
           C 86 78, 76 78, 62 76"
        fill="none"
        stroke={stroke}
        strokeWidth={s * 0.8}
        strokeLinecap="round"
      />
      {/* right wing */}
      <path
        d="M100 60
           C 122 58, 138 52, 152 44
           C 140 60, 130 74, 108 82
           Z"
        fill="none"
        stroke={stroke}
        strokeWidth={s}
        strokeLinejoin="round"
      />
      <path
        d="M100 68
           C 118 68, 132 66, 148 60
           C 134 78, 122 88, 104 92"
        fill="none"
        stroke={stroke}
        strokeWidth={s * 0.9}
        strokeLinecap="round"
      />
      <path
        d="M100 76
           C 114 78, 124 78, 138 76"
        fill="none"
        stroke={stroke}
        strokeWidth={s * 0.8}
        strokeLinecap="round"
      />

      {/* Two intertwined snakes coiling down the staff.
          Each snake is a smooth zig with periodic S-curves.
          Left snake begins at 100 offset -22, right at +22, and
          they cross at ~y intervals of 40. */}
      {[0, 1].map((idx) => {
        const dir = idx === 0 ? -1 : 1;
        const path = buildSnake(dir);
        return (
          <path
            key={idx}
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={s * 1.05}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Snake heads */}
      <g stroke={stroke} strokeWidth={s * 0.9} fill="none" strokeLinecap="round">
        <path d="M78 108 Q 72 100 78 96 L 88 100" />
        <path d="M122 108 Q 128 100 122 96 L 112 100" />
      </g>

      {/* Ornamental bindings on the staff (three thin cross-lines) */}
      {[130, 210, 290].map((y) => (
        <g key={y} stroke={stroke} strokeWidth={s * 0.6}>
          <line x1="90" y1={y} x2="110" y2={y} />
          <line x1="90" y1={y + 3} x2="110" y2={y + 3} opacity="0.5" />
        </g>
      ))}

      {/* Pommel */}
      <circle cx="100" cy="370" r="6" fill="none" stroke={stroke} strokeWidth={s} />
      <circle cx="100" cy="370" r="2" fill={stroke} />
    </svg>
  );
}

/** Build a serpentine path from y=110 down to y=340 for one of two
 *  intertwined snakes. `dir` is -1 for the left snake, +1 for the right. */
function buildSnake(dir: -1 | 1): string {
  const amp = 22;
  const start = { x: 100 + dir * amp, y: 110 };
  const pts: string[] = [`M ${start.x} ${start.y}`];
  const yTop = 110;
  const yBot = 340;
  const steps = 6;
  const stepH = (yBot - yTop) / steps;
  for (let i = 1; i <= steps; i++) {
    const y = yTop + i * stepH;
    const swing = dir * (i % 2 === 0 ? 1 : -1) * amp;
    const cx1 = 100 + swing * 1.15;
    const cx2 = 100 + swing * 1.15;
    pts.push(`C ${cx1} ${y - stepH * 0.66}, ${cx2} ${y - stepH * 0.33}, ${100 + (i % 2 === 0 ? dir : -dir) * amp} ${y}`);
  }
  return pts.join(" ");
}
