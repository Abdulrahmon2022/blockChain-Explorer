import { getBlockTransactions, withReceipts } from "@/lib/rpc";
import { ok, fail, handleError, paginate, intParam } from "@/lib/api";
import { isValidHash, isValidBlockNumber } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/** GET /api/blocks/:id/transactions?page=1&pageSize=10 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!isValidHash(id) && !isValidBlockNumber(id)) {
    return fail("Block id must be a block number or a 32-byte hash");
  }

  try {
    const url = new URL(request.url);
    const page = intParam(url, "page", 1, 10_000);
    const pageSize = intParam(url, "pageSize", 10, 50);

    const all = await getBlockTransactions(id);
    // Receipts only for the rows actually returned — a full block would be
    // hundreds of extra RPC calls.
    const slice = await withReceipts(all.slice((page - 1) * pageSize, page * pageSize));

    return ok(slice, paginate(page, pageSize, all.length));
  } catch (error) {
    return handleError(error, `GET /api/blocks/${id}/transactions`);
  }
}
