"use client";

import { useEffect } from "react";

/**
 * Toggles a class on <body> for the duration of the pitch page. Global CSS
 * uses body.pitch-mode to hide the site header + footer so the deck renders
 * without chrome, and to force dark theme regardless of the user's setting.
 */
export default function PitchLayoutBoot() {
  useEffect(() => {
    document.body.classList.add("pitch-mode");
    const priorTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      document.body.classList.remove("pitch-mode");
      if (priorTheme) document.documentElement.setAttribute("data-theme", priorTheme);
    };
  }, []);
  return null;
}
