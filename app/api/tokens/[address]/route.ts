import { getToken } from "@/lib/rpc";
import { ok, fail, handleError } from "@/lib/api";
import { isValidAddress } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/** GET /api/tokens/:address — reads ERC-20 metadata straight off the contract. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ address: string }> },
) {
  const { address } = await ctx.params;

  if (!isValidAddress(address)) {
    return fail("Invalid Ethereum address format");
  }

  try {
    const token = await getToken(address);
    if (!token) return fail(`No ERC-20 token found at "${address}"`, 404);
    return ok(token);
  } catch (error) {
    return handleError(error, `GET /api/tokens/${address}`);
  }
}
