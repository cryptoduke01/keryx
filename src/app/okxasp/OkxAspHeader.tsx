"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Wordmark from "@/components/Wordmark";
import ThemeToggle from "@/components/ThemeToggle";
import { OKX_ASP_ID, OKX_ASP_LISTING_URL } from "@/lib/okxasp/config";

const NAV = [
  { href: "/okxasp", label: "Copilot", exact: true },
  { href: "/okxasp/for-judges", label: "For judges" },
  { href: "/okxasp/docs", label: "Docs" },
  { href: "/okxasp/whitepaper", label: "Product note" },
  { href: "/api/okxasp/catalog", label: "Catalog", external: true },
  {
    href: OKX_ASP_LISTING_URL,
    label: `LIVE · #${OKX_ASP_ID}`,
    external: true,
  },
] as const;

function isActive(path: string, href: string, exact?: boolean): boolean {
  if (exact) return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export default function OkxAspHeader() {
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
          href="/okxasp"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--text-primary)",
            textDecoration: "none",
          }}
        >
          <Wordmark size={22} showR />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              borderLeft: "1px solid var(--border)",
              paddingLeft: 10,
            }}
          >
            OKX.AI
          </span>
        </Link>

        <nav
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 26 }}
        >
          {NAV.map((item) => {
            const active =
              !("external" in item && item.external) &&
              isActive(path, item.href, "exact" in item ? item.exact : false);
            const style: React.CSSProperties = {
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.01em",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            };
            if ("external" in item && item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  className="okx-nav-link"
                  style={style}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="okx-nav-link"
                style={style}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 8 }}
        >
          <a
            href="/okxasp#agent-loop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 32,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid rgba(184,255,60,0.35)",
              background: "rgba(184,255,60,0.08)",
              color: "var(--text-primary)",
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#b8ff3c",
                display: "inline-block",
              }}
            />
            Agent loop
          </a>
          <ThemeToggle />
        </div>

        <div className="flex md:hidden" style={{ alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
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
                <path
                  d="M4 4L16 16M16 4L4 16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5H17M3 10H17M3 15H17"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
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
          {NAV.map((item) => {
            const style: React.CSSProperties = {
              padding: "12px 4px",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
            };
            if ("external" in item && item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  style={style}
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={style}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .okx-nav-link { transition: color 0.15s ease; }
            .okx-nav-link:hover { color: var(--text-primary) !important; }
          `,
        }}
      />
    </header>
  );
}
