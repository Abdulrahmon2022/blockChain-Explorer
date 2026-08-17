import { getEthPrice } from "@/lib/price";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/price — live ETH/USD market reference (CoinGecko, server-cached). */
export async function GET() {
  try {
    return ok(await getEthPrice());
  } catch (error) {
    return handleError(error, "GET /api/price");
  }
}
