import { ApiResponse, ChartPoint } from "@/types";
import { mockBlocks, mockTransactions } from "./mockData";
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

export async function getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const latestBlock = mockBlocks[0];
  const latestBlockNum = latestBlock ? latestBlock.number : 0;
  
  // Calculate average gas price of recent blocks
  let totalGasPrice = 0n;
  const recentTxCount = Math.min(20, mockTransactions.length);
  for (let i = 0; i < recentTxCount; i++) {
    totalGasPrice += mockTransactions[i].gasPrice;
  }
  const avgGasPrice = recentTxCount > 0 ? totalGasPrice / BigInt(recentTxCount) : 30000000000n;

  return {
    data: {
      latestBlockNumber: latestBlockNum,
      totalTransactions: mockTransactions.length + 540203914, // static offset + mock count
      gasPriceGwei: weiToGwei(avgGasPrice),
      tps: 12.4,
      marketCapUsd: "284,510,230,490",
      ethPriceUsd: 2450.25,
      blockTimeSec: 12.1,
    }
  };
}

export async function getChartStats(metric: "tps" | "gas" | "volume"): Promise<ApiResponse<ChartPoint[]>> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const days = ["Aug 1", "Aug 2", "Aug 3", "Aug 4", "Aug 5", "Aug 6", "Aug 7"];
  
  let points: ChartPoint[] = [];

  if (metric === "tps") {
    points = [
      { label: days[0], value: 11.2 },
      { label: days[1], value: 12.5 },
      { label: days[2], value: 10.8 },
      { label: days[3], value: 13.1 },
      { label: days[4], value: 12.4 },
      { label: days[5], value: 14.2 },
      { label: days[6], value: 12.4 },
    ];
  } else if (metric === "gas") {
    points = [
      { label: days[0], value: 24 },
      { label: days[1], value: 31 },
      { label: days[2], value: 28 },
      { label: days[3], value: 45 },
      { label: days[4], value: 35 },
      { label: days[5], value: 22 },
      { label: days[6], value: 29 },
    ];
  } else {
    // transaction volume in thousands
    points = [
      { label: days[0], value: 1120 },
      { label: days[1], value: 1250 },
      { label: days[2], value: 1080 },
      { label: days[3], value: 1310 },
      { label: days[4], value: 1240 },
      { label: days[5], value: 1420 },
      { label: days[6], value: 1195 },
    ];
  }

  return { data: points };
}
