import { getChainStats } from "@/lib/rpc";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/stats — network summary for the homepage. */
export async function GET() {
  try {
    return ok(await getChainStats());
  } catch (error) {
    return handleError(error, "GET /api/stats");
  }
}
