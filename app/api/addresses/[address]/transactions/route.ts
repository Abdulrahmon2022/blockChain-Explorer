import { getTransactionsForAddress } from "@/lib/rpc";
import { ok, fail, handleError, paginate, intParam } from "@/lib/api";
import { isValidAddress } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/**
 * GET /api/addresses/:address/transactions?page=1&pageSize=10
 *
 * Limited to recent blocks — full history would require an indexer.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ address: string }> },
) {
  const { address } = await ctx.params;

  if (!isValidAddress(address)) {
    return fail("Invalid Ethereum address format");
  }

  try {
    const url = new URL(request.url);
    const page = intParam(url, "page", 1, 100);
    const pageSize = intParam(url, "pageSize", 10, 50);

    const all = await getTransactionsForAddress(address, page * pageSize);
    const slice = all.slice((page - 1) * pageSize, page * pageSize);

    return ok(slice, paginate(page, pageSize, all.length));
  } catch (error) {
    return handleError(error, `GET /api/addresses/${address}/transactions`);
  }
}
