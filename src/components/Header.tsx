"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";

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
        background: "rgba(11, 11, 12, 0.72)",
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
          style={{
            display: "flex",
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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/ask" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary btn-sm">Get started</button>
          </Link>
        </div>
      </div>
    </header>
  );
}
