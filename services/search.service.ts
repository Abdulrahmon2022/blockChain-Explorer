import { SearchResult, ApiResponse } from "@/types";
import { validateSearchQuery } from "@/lib/utils/validators";
import { getBlock } from "./block.service";
import { getTransaction } from "./transaction.service";
import { getAddress } from "./address.service";
import { getToken } from "./token.service";

export async function searchBlockchain(query: string): Promise<ApiResponse<SearchResult>> {
  const result = validateSearchQuery(query);

  if (!result.isValid) {
    return { data: result, error: "Invalid search query. Try entering an address, transaction hash, block number, or token name." };
  }

  // Let's verify that the entity exists (or simulate exist check)
  if (result.type === "block") {
    const block = await getBlock(result.query);
    if (!block.data) {
      return { data: { ...result, isValid: false }, error: `Block "${query}" not found.` };
    }
  } else if (result.type === "transaction") {
    const tx = await getTransaction(result.query);
    if (!tx.data) {
      // In a real explorer, a search for a hash might check if it's a block hash too
      const block = await getBlock(result.query);
      if (block.data) {
        return {
          data: {
            type: "block",
            query: result.query,
            redirectUrl: `/blocks/${result.query}`,
            isValid: true
          }
        };
      }
      return { data: { ...result, isValid: false }, error: `Transaction hash "${query}" not found.` };
    }
  } else if (result.type === "address") {
    const addr = await getAddress(result.query);
    if (!addr.data) {
      return { data: { ...result, isValid: false }, error: `Address "${query}" not found.` };
    }
  } else if (result.type === "token") {
    const token = await getToken(result.query);
    if (!token.data) {
      // For token search, if not found, we redirect to general query
      result.redirectUrl = `/search?q=${encodeURIComponent(query)}`;
    }
  }

  return { data: result };
}
