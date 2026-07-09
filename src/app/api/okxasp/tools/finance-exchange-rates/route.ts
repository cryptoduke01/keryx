import { createOkxPaidToolHandlers } from "@/lib/okxasp/paid-route";

export const runtime = "nodejs";

const { GET, POST } = createOkxPaidToolHandlers("finance.exchange-rates");
export { GET, POST };
