import OkxAspHeader from "./OkxAspHeader";
import OkxAspFooter from "./OkxAspFooter";

/** OKX.AI Finance Copilot surface: own nav + footer. */
export default function OkxAspLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="okxasp-shell">
      <OkxAspHeader />
      {/* Root layout already clears the fixed header (paddingTop: 56). */}
      <div style={{ minHeight: "70vh" }}>{children}</div>
      <OkxAspFooter />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .okx-link {
              color: var(--text-primary);
              text-decoration: none;
              border-bottom: 1px solid transparent;
              transition: border-color 0.15s ease;
            }
            .okx-link:hover { border-bottom-color: var(--text-primary); }
          `,
        }}
      />
    </div>
  );
}
