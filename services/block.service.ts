import { Block, ApiResponse } from "@/types";
import { apiGet, query } from "./client";

export async function getLatestBlocks(limit: number = 10): Promise<ApiResponse<Block[]>> {
  return apiGet<Block[]>(`/api/blocks${query({ limit })}`, []);
}

export async function getBlocks(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Block[]>> {
  return apiGet<Block[]>(`/api/blocks${query({ page, pageSize })}`, []);
}

export async function getBlock(id: string | number): Promise<ApiResponse<Block | null>> {
  return apiGet<Block | null>(`/api/blocks/${encodeURIComponent(String(id))}`, null);
}
