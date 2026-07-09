import { createOkxPaidToolHandlers } from "@/lib/okxasp/paid-route";

export const runtime = "nodejs";

const { GET, POST } = createOkxPaidToolHandlers("okx.wallet-recent-pnl");
export { GET, POST };
