"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Wordmark from "@/components/Wordmark";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/ask", label: "Ask" },
  { href: "/registry", label: "Registry" },
  { href: "/publish", label: "Publish" },
  { href: "/live", label: "Live" },
  { href: "/docs", label: "Docs" },
] as const;

function isActive(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--surface-glass)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--text-primary)",
          }}
        >
          <Wordmark size={22} showR />
        </Link>

        <nav
          className="hidden md:flex"
          style={{
            alignItems: "center",
            gap: 28,
            minWidth: 0,
          }}
        >
          {NAV.map(({ href, label }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 8 }}
        >
          <Link
            href="/try"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 32,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: isActive(path, "/try") ? "var(--surface-3)" : "var(--surface-2)",
              color: "var(--text-primary)",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.01em",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#10b981",
                display: "inline-block",
                animation: "keryx-pulse 2000ms ease-in-out infinite",
              }}
            />
            Try it live
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden" style={{ alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            style={{
              width: 34,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              {open ? (
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface-0)",
            padding: "8px 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Link
            href="/try"
            onClick={() => setOpen(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 14px",
              margin: "6px 0 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 600,
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "#10b981",
                display: "inline-block",
                animation: "keryx-pulse 2000ms ease-in-out infinite",
              }}
            />
            Try it live
          </Link>
          {NAV.map(({ href, label }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  padding: "12px 4px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
