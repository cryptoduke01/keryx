"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  /** Text to copy to clipboard. */
  text: string;
  /** Label override. Defaults to "Copy" / "Copied". */
  label?: string;
  /** Small tag rendered next to the button (language, filename, etc). */
  tag?: string;
}

/**
 * Icon-first copy button used inside code blocks. Falls back to a synthetic
 * textarea + document.execCommand if navigator.clipboard is unavailable
 * (older browsers, insecure contexts). Debounced revert to idle at 1500ms.
 */
export default function CopyButton({ text, label, tag }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "err">("idle");

  const copy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setState("copied");
    } catch {
      setState("err");
    }
    window.setTimeout(() => setState("idle"), 1500);
  }, [text]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {tag && (
        <span
          className="text-mono"
          style={{
            fontSize: 10.5,
            color: "var(--text-faint)",
            letterSpacing: "0.04em",
          }}
        >
          {tag}
        </span>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label={state === "copied" ? "Copied" : "Copy to clipboard"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background:
            state === "copied"
              ? "rgba(16, 185, 129, 0.14)"
              : "var(--surface-2)",
          color:
            state === "copied" ? "#10b981" : "var(--text-secondary)",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "background 120ms ease, color 120ms ease",
          fontFamily: "var(--font-sans)",
        }}
      >
        {state === "copied" ? (
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 10.5L8 14.5L16 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect
              x="6"
              y="6"
              width="10"
              height="11"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4 13V4C4 3.44772 4.44772 3 5 3H13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {state === "copied" ? label ?? "Copied" : label ?? "Copy"}
      </button>
    </div>
  );
}
