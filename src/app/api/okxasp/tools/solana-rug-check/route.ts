import { createOkxPaidToolHandlers } from "@/lib/okxasp/paid-route";

export const runtime = "nodejs";

const { GET, POST } = createOkxPaidToolHandlers("solana.rug-check");
export { GET, POST };
