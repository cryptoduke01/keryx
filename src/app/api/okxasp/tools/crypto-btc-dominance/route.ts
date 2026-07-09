import { createOkxPaidToolHandlers } from "@/lib/okxasp/paid-route";

export const runtime = "nodejs";

const { GET, POST } = createOkxPaidToolHandlers("crypto.btc-dominance");
export { GET, POST };
