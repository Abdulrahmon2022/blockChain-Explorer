import { Transaction, ApiResponse } from "@/types";
import { mockTransactions } from "./mockData";

export async function getLatestTransactions(limit: number = 10): Promise<ApiResponse<Transaction[]>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    data: mockTransactions.slice(0, limit),
  };
}

export async function getTransactions(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Transaction[]>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = mockTransactions.slice(startIndex, endIndex);

  return {
    data: paginatedTransactions,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: mockTransactions.length,
      totalPages: Math.ceil(mockTransactions.length / pageSize),
    }
  };
}

export async function getTransaction(hash: string): Promise<ApiResponse<Transaction | null>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const hashLower = hash.toLowerCase();
  const tx = mockTransactions.find(t => t.hash.toLowerCase() === hashLower);

  return {
    data: tx || null,
  };
}

export async function getTransactionsByAddress(
  address: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<Transaction[]>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const addrLower = address.toLowerCase();
  
  const filtered = mockTransactions.filter(
    t => t.from.toLowerCase() === addrLower || t.to?.toLowerCase() === addrLower
  );

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
