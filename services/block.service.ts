import { Block, ApiResponse } from "@/types";
import { mockBlocks } from "./mockData";

export async function getLatestBlocks(limit: number = 10): Promise<ApiResponse<Block[]>> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    data: mockBlocks.slice(0, limit),
  };
}

export async function getBlocks(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Block[]>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBlocks = mockBlocks.slice(startIndex, endIndex);

  return {
    data: paginatedBlocks,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: mockBlocks.length,
      totalPages: Math.ceil(mockBlocks.length / pageSize),
    }
  };
}

export async function getBlock(id: string | number): Promise<ApiResponse<Block | null>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const idStr = String(id).toLowerCase();
  
  const block = mockBlocks.find(
    b => String(b.number) === idStr || b.hash.toLowerCase() === idStr
  );

  return {
    data: block || null,
  };
}
