import Link from "next/link";

export default function OkxAspFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: 72,
        paddingTop: 48,
        paddingBottom: 40,
        background: "var(--surface-0)",
      }}
    >
      <div className="container-page">
        <div
          className="okx-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-wordmark)",
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--text-primary)",
                marginBottom: 10,
              }}
            >
              Keryx
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-secondary)",
                lineHeight: 1.55,
                maxWidth: 280,
                margin: "0 0 12px",
              }}
            >
              Finance Copilot for AI agents on OKX.AI. Pay per call in USDT0 on
              X Layer.
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: 0,
                fontFamily: "var(--font-mono)",
              }}
            >
              ASP #4759
            </p>
          </div>

          <div>
            <div className="text-eyebrow" style={colHead}>
              Product
            </div>
            <FooterLink href="/okxasp">Finance Copilot</FooterLink>
            <FooterLink href="/okxasp#agent-loop">Agent loop</FooterLink>
            <FooterLink href="/api/okxasp/catalog">Catalog API</FooterLink>
            <FooterExternal href="https://okx.ai/agents/4759">LIVE on OKX.AI</FooterExternal>
          </div>

          <div>
            <div className="text-eyebrow" style={colHead}>
              Builders
            </div>
            <FooterLink href="/okxasp/docs">Integration docs</FooterLink>
            <FooterLink href="/okxasp/whitepaper">Product note</FooterLink>
            <FooterExternal href="https://okx.ai/tutorial/asp">
              ASP tutorial
            </FooterExternal>
            <FooterExternal href="https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk">
              Seller SDK
            </FooterExternal>
          </div>

          <div>
            <div className="text-eyebrow" style={colHead}>
              Keryx
            </div>
            <FooterLink href="/">Main site</FooterLink>
            <FooterLink href="/ask">Ask playground</FooterLink>
            <FooterExternal href="https://x.com/keryxhq">@keryxhq</FooterExternal>
          </div>
        </div>

        <div
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: "var(--text-faint)",
          }}
        >
          <span>© 2026 Keryx · OKX.AI Genesis · X Layer USDT0</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            Finance Copilot A2MCP
          </span>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .okx-f-link { transition: color 0.15s ease; text-decoration: none; }
            .okx-f-link:hover { color: var(--text-primary) !important; }
            @media (max-width: 720px) {
              .okx-footer-grid { grid-template-columns: 1fr 1fr !important; }
            }
            @media (max-width: 480px) {
              .okx-footer-grid { grid-template-columns: 1fr !important; }
            }
          `,
        }}
      />
    </footer>
  );
}

const colHead: React.CSSProperties = {
  marginBottom: 14,
  color: "var(--text-secondary)",
};

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="okx-f-link"
      style={{
        display: "block",
        fontSize: 13.5,
        color: "var(--text-secondary)",
        marginBottom: 10,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

function FooterExternal({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="okx-f-link"
      style={{
        display: "block",
        fontSize: 13.5,
        color: "var(--text-secondary)",
        marginBottom: 10,
        textDecoration: "none",
      }}
    >
      {children}
    </a>
  );
}
