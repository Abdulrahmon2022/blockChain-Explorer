import { getTokenTransfersForAddress } from "@/lib/rpc";
import { ok, fail, handleError, paginate, intParam } from "@/lib/api";
import { isValidAddress } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/**
 * GET /api/addresses/:address/token-transfers?page=1&pageSize=10
 *
 * Reads ERC-20 and ERC-721 Transfer events from a recent block window.
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

    const all = await getTokenTransfersForAddress(address, page * pageSize);
    const slice = all.slice((page - 1) * pageSize, page * pageSize);

    return ok(slice, paginate(page, pageSize, all.length));
  } catch (error) {
    return handleError(error, `GET /api/addresses/${address}/token-transfers`);
  }
}
