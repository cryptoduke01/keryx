"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(5, 5, 5, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
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
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: "-0.01em",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, var(--gold-bright), var(--gold-dim))",
              color: "var(--bg-primary)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            K
          </span>
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--gold-bright), var(--gold-dim))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Kēryx
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
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
                  padding: "6px 12px",
                  borderRadius: 6,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  background: active ? "var(--bg-tertiary)" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/ask" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary btn-sm">Ask Kēryx</button>
          </Link>
        </div>
      </div>
    </header>
  );
}
