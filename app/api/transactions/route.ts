import { getTransactions, getLatestTransactions } from "@/lib/rpc";
import { ok, handleError, paginate, intParam } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/transactions?limit=10          -> newest N transactions
 * GET /api/transactions?page=1&pageSize=10 -> paginated, newest first
 *
 * Bounded by how far the data layer walks back from the chain head, so deep
 * pages return fewer rows rather than reaching genesis.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    if (url.searchParams.has("limit")) {
      const limit = intParam(url, "limit", 10, 50);
      return ok(await getLatestTransactions(limit));
    }

    const page = intParam(url, "page", 1, 100);
    const pageSize = intParam(url, "pageSize", 10, 50);

    const { transactions, totalItems } = await getTransactions(page, pageSize);
    return ok(transactions, paginate(page, pageSize, totalItems));
  } catch (error) {
    return handleError(error, "GET /api/transactions");
  }
}
