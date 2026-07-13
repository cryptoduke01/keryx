import type { Metadata } from "next";
import OkxAspHeader from "./OkxAspHeader";
import OkxAspFooter from "./OkxAspFooter";
import { okxAspMetadata } from "@/lib/okxasp/metadata";

/**
 * OKX.AI Finance Copilot surface: own nav + footer + social metadata.
 * Metadata here overrides root Arc/USDC registry tags so /okxasp shares
 * never look like the main Keryx product.
 */
export const metadata: Metadata = okxAspMetadata();

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
