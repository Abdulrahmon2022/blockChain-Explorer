import { TokenInfo, TokenTransfer, ApiResponse } from "@/types";
import { apiGet, query } from "./client";

/**
 * There is no on-chain registry of "all tokens" — that needs an index of
 * contract deployments. Look tokens up by address instead.
 */
export async function getTokens(): Promise<ApiResponse<TokenInfo[]>> {
  return {
    data: [],
    error: "Listing all tokens requires an indexer. Search for a token by address.",
  };
}

export async function getToken(address: string): Promise<ApiResponse<TokenInfo | null>> {
  return apiGet<TokenInfo | null>(`/api/tokens/${encodeURIComponent(address)}`, null);
}

/**
 * Reads Transfer events from a recent block window. `userAddress` is required —
 * scanning every transfer of a single token across all holders is an indexer job.
 */
export async function getTokenTransfers(
  page: number = 1,
  pageSize: number = 10,
  tokenAddress?: string,
  userAddress?: string
): Promise<ApiResponse<TokenTransfer[]>> {
  if (!userAddress) {
    return {
      data: [],
      error: "Token transfers can only be listed for a specific address.",
    };
  }

  const path = `/api/addresses/${encodeURIComponent(userAddress)}/token-transfers`;
  const result = await apiGet<TokenTransfer[]>(`${path}${query({ page, pageSize })}`, []);

  if (!tokenAddress) return result;

  const wanted = tokenAddress.toLowerCase();
  return {
    ...result,
    data: result.data.filter((t) => t.tokenAddress.toLowerCase() === wanted),
  };
}
