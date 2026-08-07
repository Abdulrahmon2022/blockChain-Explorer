import { getAddressInfo } from "@/lib/rpc";
import { ok, fail, handleError } from "@/lib/api";
import { isValidAddress } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/** GET /api/addresses/:address */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ address: string }> },
) {
  const { address } = await ctx.params;

  if (!isValidAddress(address)) {
    return fail("Invalid Ethereum address format");
  }

  try {
    return ok(await getAddressInfo(address));
  } catch (error) {
    return handleError(error, `GET /api/addresses/${address}`);
  }
}
