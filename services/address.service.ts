import { AddressInfo, ApiResponse } from "@/types";
import { apiGet } from "./client";
import { isValidAddress } from "@/lib/utils/addresses";

export async function getAddress(address: string): Promise<ApiResponse<AddressInfo | null>> {
  if (!isValidAddress(address)) {
    return { data: null, error: "Invalid Ethereum address format" };
  }

  return apiGet<AddressInfo | null>(`/api/addresses/${encodeURIComponent(address)}`, null);
}
