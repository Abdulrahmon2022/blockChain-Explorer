import { TokenInfo, TokenTransfer, ApiResponse } from "@/types";
import { mockTokens, mockTokenTransfers } from "./mockData";

export async function getTokens(): Promise<ApiResponse<TokenInfo[]>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { data: mockTokens };
}

export async function getToken(address: string): Promise<ApiResponse<TokenInfo | null>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const addrLower = address.toLowerCase();
  const token = mockTokens.find(t => t.address.toLowerCase() === addrLower);
  return { data: token || null };
}

export async function getTokenTransfers(
  page: number = 1,
  pageSize: number = 10,
  tokenAddress?: string,
  userAddress?: string
): Promise<ApiResponse<TokenTransfer[]>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let filtered = mockTokenTransfers;

  if (tokenAddress) {
    const tokenAddrLower = tokenAddress.toLowerCase();
    filtered = filtered.filter(t => t.tokenAddress.toLowerCase() === tokenAddrLower);
  }

  if (userAddress) {
    const userAddrLower = userAddress.toLowerCase();
    filtered = filtered.filter(
      t => t.from.toLowerCase() === userAddrLower || t.to.toLowerCase() === userAddrLower
    );
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: filtered.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    }
  };
}
