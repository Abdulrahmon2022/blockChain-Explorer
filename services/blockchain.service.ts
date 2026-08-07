import { ApiResponse, ChartPoint } from "@/types";
import { apiGet, query } from "./client";
import { weiToGwei } from "@/lib/utils/numbers";

export interface NetworkStats {
  latestBlockNumber: number;
  totalTransactions: number;
  gasPriceGwei: string;
  tps: number;
  marketCapUsd: string;
  ethPriceUsd: number;
  blockTimeSec: number;
}

interface ChainStats {
  latestBlockNumber: number;
  gasPriceWei: bigint;
  blockTimeSec: number;
  tps: number;
  totalTransactions: number;
}

const EMPTY: ChainStats = {
  latestBlockNumber: 0,
  gasPriceWei: 0n,
  blockTimeSec: 0,
  tps: 0,
  totalTransactions: 0,
};

export async function getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
  const { data, error } = await apiGet<ChainStats>("/api/stats", EMPTY);

  return {
    data: {
      latestBlockNumber: data.latestBlockNumber,
      // Transactions seen in the sampled blocks, not a chain-wide total —
      // that would require an indexer.
      totalTransactions: data.totalTransactions,
      gasPriceGwei: weiToGwei(data.gasPriceWei),
      tps: data.tps,
      blockTimeSec: data.blockTimeSec,
      // Sepolia ETH has no market value and there is no on-chain price feed here.
      marketCapUsd: "N/A",
      ethPriceUsd: 0,
    },
    error,
  };
}

export async function getChartStats(
  metric: "tps" | "gas" | "volume"
): Promise<ApiResponse<ChartPoint[]>> {
  return apiGet<ChartPoint[]>(`/api/stats/chart${query({ metric })}`, []);
}
