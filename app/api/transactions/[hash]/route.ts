import { getTransaction } from "@/lib/rpc";
import { ok, fail, handleError } from "@/lib/api";
import { isValidHash } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/** GET /api/transactions/:hash */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ hash: string }> },
) {
  const { hash } = await ctx.params;

  if (!isValidHash(hash)) {
    return fail("Transaction hash must be 32 bytes of hex");
  }

  try {
    const tx = await getTransaction(hash);
    if (!tx) return fail(`Transaction "${hash}" not found`, 404);
    return ok(tx);
  } catch (error) {
    return handleError(error, `GET /api/transactions/${hash}`);
  }
}
