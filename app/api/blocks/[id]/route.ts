import { getBlock } from "@/lib/rpc";
import { ok, fail, handleError } from "@/lib/api";
import { isValidHash, isValidBlockNumber } from "@/lib/utils/addresses";

export const dynamic = "force-dynamic";

/** GET /api/blocks/:id — id is a block number or a block hash. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!isValidHash(id) && !isValidBlockNumber(id)) {
    return fail("Block id must be a block number or a 32-byte hash");
  }

  try {
    const block = await getBlock(id);
    if (!block) return fail(`Block "${id}" not found`, 404);
    return ok(block);
  } catch (error) {
    return handleError(error, `GET /api/blocks/${id}`);
  }
}
