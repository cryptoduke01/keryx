"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CounterProps {
  /** Final numeric value to count up to. */
  value: number;
  /** Rendered prefix, e.g. "$". */
  prefix?: string;
  /** Rendered suffix, e.g. "%" or "×". */
  suffix?: string;
  /** Decimal places to show. */
  decimals?: number;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}

/** Animated count-up, triggered once when scrolled into view. */
export default function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 900,
  style,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
