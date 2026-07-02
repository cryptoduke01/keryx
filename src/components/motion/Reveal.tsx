"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Play immediately on mount instead of waiting for scroll (above the fold). */
  immediate?: boolean;
}

/**
 * Scroll-triggered fade + rise. Uses useInView (fires once) with a
 * fallback timer: if the IntersectionObserver hasn't fired within 2s
 * (backgrounded tab, prerender, throttled automation context), we show
 * the content anyway. Content should never be permanently stuck at
 * opacity 0 — that's a worse failure mode than a missed animation.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  style,
  immediate = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [forced, setForced] = useState(immediate);

  useEffect(() => {
    if (immediate || inView) return;
    const t = setTimeout(() => setForced(true), 2000);
    return () => clearTimeout(t);
  }, [immediate, inView]);

  const shown = immediate || inView || forced;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
