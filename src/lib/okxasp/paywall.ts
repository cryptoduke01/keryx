/**
 * Custom HTML paywall for browser 402s.
 * Agents still read Payment-Required / JSON; humans get a clear USDT0 price.
 */

import type { PaywallConfig, PaywallProvider } from "@okxweb3/x402-next";

type PaymentRequiredLike = {
  error?: string;
  resource?: { description?: string; url?: string };
  accepts?: Array<{
    amount?: string;
    network?: string;
    extra?: { name?: string };
    payTo?: string;
  }>;
};

function formatAmount(raw?: string, assetName?: string): string {
  if (!raw) return "see Payment-Required header";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  // USDT0 / USDC-style 6 decimals
  const usd = n / 1_000_000;
  const label = assetName?.includes("USDT") ? "USDT0" : assetName || "USDT0";
  return `$${usd.toFixed(usd < 0.01 ? 4 : 3)} ${label}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const keryxOkxPaywall: PaywallProvider = {
  generateHtml(paymentRequired: unknown, config?: PaywallConfig): string {
    const pr = paymentRequired as PaymentRequiredLike;
    const accept = pr.accepts?.[0];
    const amount = formatAmount(accept?.amount, accept?.extra?.name);
    const network = accept?.network || "eip155:1952";
    const desc = pr.resource?.description || "Paid market tool";
    const app = config?.appName || "Keryx Finance Copilot";
    const url = pr.resource?.url || config?.currentUrl || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Payment required · ${escapeHtml(app)}</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      background: #0b0b0c; color: #f5f4f0;
    }
    .card {
      width: min(440px, 92vw); padding: 28px 26px;
      border: 1px solid rgba(255,255,255,0.12); border-radius: 14px;
      background: #121214;
    }
    .eyebrow {
      font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
      color: #9a9a96; margin-bottom: 10px;
    }
    h1 { font-size: 1.45rem; font-weight: 600; margin: 0 0 10px; letter-spacing: -0.02em; }
    p { margin: 0 0 12px; color: #c8c7c2; line-height: 1.55; font-size: 14.5px; }
    .amount {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 1.25rem; font-weight: 600; color: #b8ff3c; margin: 18px 0 6px;
    }
    .meta { font-size: 12.5px; color: #8a8984; word-break: break-all; }
    a { color: #f5f4f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">${escapeHtml(app)}</div>
    <h1>Payment required</h1>
    <p>${escapeHtml(desc)}</p>
    <div class="amount">${escapeHtml(amount)}</div>
    <p class="meta">Network ${escapeHtml(network)} · settle with Agentic Wallet, then retry.</p>
    ${url ? `<p class="meta">Resource: ${escapeHtml(url)}</p>` : ""}
    <p class="meta" style="margin-top:18px">
      Agents: read the <code>Payment-Required</code> header.
      Humans: <a href="/okxasp/docs">docs</a> · <a href="/okxasp">product</a>
    </p>
  </div>
</body>
</html>`;
  },
};
