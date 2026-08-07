import { getBlocks, getLatestBlocks } from "@/lib/rpc";
import { ok, handleError, paginate, intParam } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/blocks?limit=10        -> newest N blocks, unpaginated
 * GET /api/blocks?page=1&pageSize=10 -> paginated, newest first
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    if (url.searchParams.has("limit")) {
      const limit = intParam(url, "limit", 10, 50);
      return ok(await getLatestBlocks(limit));
    }

    const page = intParam(url, "page", 1, 10_000);
    const pageSize = intParam(url, "pageSize", 10, 50);

    const { blocks, totalItems } = await getBlocks(page, pageSize);
    return ok(blocks, paginate(page, pageSize, totalItems));
  } catch (error) {
    return handleError(error, "GET /api/blocks");
  }
}
