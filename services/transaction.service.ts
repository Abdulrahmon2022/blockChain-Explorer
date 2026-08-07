import { Transaction, ApiResponse } from "@/types";
import { apiGet, query } from "./client";

export async function getLatestTransactions(limit: number = 10): Promise<ApiResponse<Transaction[]>> {
  return apiGet<Transaction[]>(`/api/transactions${query({ limit })}`, []);
}

export async function getTransactions(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Transaction[]>> {
  return apiGet<Transaction[]>(`/api/transactions${query({ page, pageSize })}`, []);
}

export async function getTransaction(hash: string): Promise<ApiResponse<Transaction | null>> {
  return apiGet<Transaction | null>(`/api/transactions/${encodeURIComponent(hash)}`, null);
}

export async function getBlockTransactions(
  id: string | number,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<Transaction[]>> {
  const path = `/api/blocks/${encodeURIComponent(String(id))}/transactions`;
  return apiGet<Transaction[]>(`${path}${query({ page, pageSize })}`, []);
}

/**
 * Only covers recent blocks — see the API route. An address with no activity in
 * that window returns an empty list rather than an error.
 */
export async function getTransactionsByAddress(
  address: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<Transaction[]>> {
  const path = `/api/addresses/${encodeURIComponent(address)}/transactions`;
  return apiGet<Transaction[]>(`${path}${query({ page, pageSize })}`, []);
}
