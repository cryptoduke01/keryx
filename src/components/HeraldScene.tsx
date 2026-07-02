interface HeraldSceneProps {
  className?: string;
}

/**
 * The hero art scene: a temple facade at dusk, a radiant coin-sun behind
 * it, and the herald's staff standing at the threshold. Composed as
 * layered SVG silhouettes so the CSS duotone gradient underneath (gold
 * sky → cobalt night) shows through the negative space exactly like a
 * halftone-processed photograph would. The staff is drawn natively at
 * scene scale (not nested via foreignObject) so its linework stays bold
 * and legible at any panel size.
 */
export default function HeraldScene({ className }: HeraldSceneProps) {
  const columnXs = [140, 260, 380, 500, 620, 980, 1100, 1220, 1340, 1460];
  const staffX = 800;
  const staffTopY = 195;
  const staffBotY = 640;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="sunCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.04" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
        <linearGradient id="stepFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.82" />
        </linearGradient>
      </defs>

      {/* Sunburst rays — reeded coin edge, radiating from behind the staff */}
      <g stroke="#000" strokeOpacity="0.26" strokeWidth="2.5">
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          const r1 = 150;
          const r2 = i % 2 === 0 ? 340 : 285;
          const cx = staffX;
          const cy = 300;
          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1 * 0.6;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2 * 0.6;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Coin-sun disc */}
      <circle cx={staffX} cy="300" r="130" fill="url(#sunCore)" />
      <circle cx={staffX} cy="300" r="130" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="3" />
      <circle cx={staffX} cy="300" r="110" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.5" />

      {/* ============ Herald's staff — bold native linework ============ */}
      <g stroke="#000" strokeOpacity="0.82" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* central rod */}
        <line x1={staffX} y1={staffTopY} x2={staffX} y2={staffBotY} strokeWidth="7" />

        {/* crowning orb */}
        <circle cx={staffX} cy={staffTopY - 24} r="16" fill="#000" fillOpacity="0.7" stroke="none" />

        {/* wings, left */}
        <path
          d={`M${staffX} ${staffTopY + 10}
              C ${staffX - 90} ${staffTopY + 4}, ${staffX - 150} ${staffTopY - 20}, ${staffX - 200} ${staffTopY - 55}
              C ${staffX - 160} ${staffTopY + 10}, ${staffX - 120} ${staffTopY + 45}, ${staffX - 40} ${staffTopY + 55}
              Z`}
          fill="#000"
          fillOpacity="0.5"
          stroke="none"
        />
        <path
          d={`M${staffX} ${staffTopY + 24}
              C ${staffX - 70} ${staffTopY + 26}, ${staffX - 115} ${staffTopY + 12}, ${staffX - 150} ${staffTopY - 6}`}
          strokeWidth="3.5"
        />
        {/* wings, right */}
        <path
          d={`M${staffX} ${staffTopY + 10}
              C ${staffX + 90} ${staffTopY + 4}, ${staffX + 150} ${staffTopY - 20}, ${staffX + 200} ${staffTopY - 55}
              C ${staffX + 160} ${staffTopY + 10}, ${staffX + 120} ${staffTopY + 45}, ${staffX + 40} ${staffTopY + 55}
              Z`}
          fill="#000"
          fillOpacity="0.5"
          stroke="none"
        />
        <path
          d={`M${staffX} ${staffTopY + 24}
              C ${staffX + 70} ${staffTopY + 26}, ${staffX + 115} ${staffTopY + 12}, ${staffX + 150} ${staffTopY - 6}`}
          strokeWidth="3.5"
        />

        {/* two coiling snakes, drawn as a repeating serpentine down the rod */}
        {[-1, 1].map((dir) => {
          const amp = 46;
          const steps = 6;
          const segH = (staffBotY - 90 - (staffTopY + 60)) / steps;
          const top = staffTopY + 60;
          let d = `M ${staffX + dir * amp} ${top}`;
          for (let i = 1; i <= steps; i++) {
            const y = top + i * segH;
            const swing = (i % 2 === 0 ? dir : -dir) * amp;
            d += ` C ${staffX + swing * 1.1} ${y - segH * 0.66}, ${staffX + swing * 1.1} ${y - segH * 0.33}, ${staffX + (i % 2 === 0 ? dir : -dir) * amp} ${y}`;
          }
          return <path key={dir} d={d} strokeWidth="5.5" />;
        })}

        {/* snake heads near the top */}
        <path d={`M${staffX - 40} ${staffTopY + 96} Q ${staffX - 54} ${staffTopY + 82} ${staffX - 40} ${staffTopY + 74} L ${staffX - 20} ${staffTopY + 82}`} strokeWidth="4" />
        <path d={`M${staffX + 40} ${staffTopY + 96} Q ${staffX + 54} ${staffTopY + 82} ${staffX + 40} ${staffTopY + 74} L ${staffX + 20} ${staffTopY + 82}`} strokeWidth="4" />

        {/* ornamental bindings */}
        {[staffTopY + 220, staffTopY + 320, staffTopY + 400].map((y) => (
          <line key={y} x1={staffX - 16} y1={y} x2={staffX + 16} y2={y} strokeWidth="3" />
        ))}

        {/* pommel */}
        <circle cx={staffX} cy={staffBotY} r="10" fill="#000" fillOpacity="0.6" stroke="none" />
      </g>

      {/* Temple facade — columns + entablature + pediment, silhouette */}
      <g fill="#000" fillOpacity="0.74">
        <rect x="80" y="620" width="1440" height="28" />
        <polygon points="700,620 800,540 900,620" />
        {columnXs.map((x) => (
          <rect key={x} x={x - 14} y={628} width={28} height={230} rx={3} />
        ))}
        <rect x="60" y="856" width="1480" height="14" />
        <rect x="20" y="872" width="1560" height="16" />
      </g>

      {/* Ground fade so the steps recede into shadow */}
      <rect x="0" y="620" width="1600" height="280" fill="url(#stepFade)" />

      {/* A pair of small bird silhouettes for scale + life, upper right */}
      <g stroke="#000" strokeOpacity="0.38" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M1180 170 Q1192 158 1204 170 Q1216 158 1228 170" />
        <path d="M1240 212 Q1250 202 1260 212 Q1270 202 1280 212" />
      </g>
    </svg>
  );
}
