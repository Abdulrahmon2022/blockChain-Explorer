import type { ApiResponse, ChartPoint } from "@/types";
import { formatUnits } from "ethers";
import { mockBlocks, mockTransactions } from "../mockData";
import { getEthereumProvider } from "./provider";

export interface NetworkStats {
  latestBlockNumber: number;
  totalTransactions: number;
  gasPriceGwei: string;
  tps: number;
  marketCapUsd: string;
  ethPriceUsd: number;
  blockTimeSec: number;
  networkName: string;
  chainId: number;
  averageGasPriceGwei: string;
  baseFeeGwei: string;
  timestamp: number;
  difficulty: string | null;
}

export async function getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const latestBlock = mockBlocks[0];
    return {
      data: {
        latestBlockNumber: latestBlock?.number ?? 0,
        totalTransactions: 0,
        gasPriceGwei: "0",
        tps: 0,
        marketCapUsd: "0",
        ethPriceUsd: 0,
        blockTimeSec: 0,
        networkName: "Unavailable",
        chainId: 0,
        averageGasPriceGwei: "0",
        baseFeeGwei: "0",
        timestamp: Math.floor(Date.now() / 1000),
        difficulty: null,
      },
    };
  }

  try {
    const [latestBlockNumber, feeData, latestBlock, network] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
      provider.getBlock("latest"),
      provider.getNetwork(),
    ]);

    const gasPrice = feeData.gasPrice ?? 0n;
    const averageGasPriceGwei = formatUnits(gasPrice, "gwei");
    const baseFeePerGas = latestBlock?.baseFeePerGas ?? 0n;
    const baseFeeGwei = formatUnits(baseFeePerGas, "gwei");
    const latestBlockTimestamp = latestBlock?.timestamp ? Number(latestBlock.timestamp) : Math.floor(Date.now() / 1000);
    const previousBlock = latestBlockNumber > 0 ? await provider.getBlock(latestBlockNumber - 1) : null;
    const blockTimeSec = previousBlock && latestBlock
      ? Math.max(1, Math.round(latestBlockTimestamp - Number(previousBlock.timestamp) || 12))
      : 12;

    return {
      data: {
        latestBlockNumber,
        totalTransactions: latestBlock?.transactions?.length ?? 0,
        gasPriceGwei: averageGasPriceGwei,
        tps: 0,
        marketCapUsd: "0",
        ethPriceUsd: 0,
        blockTimeSec,
        networkName: network.name || "Ethereum",
        chainId: Number(network.chainId),
        averageGasPriceGwei,
        baseFeeGwei,
        timestamp: latestBlockTimestamp,
        difficulty: latestBlock?.difficulty ? latestBlock.difficulty.toString() : null,
      },
    };
  } catch {
    const latestBlock = mockBlocks[0];
    return {
      data: {
        latestBlockNumber: latestBlock?.number ?? 0,
        totalTransactions: 0,
        gasPriceGwei: "0",
        tps: 0,
        marketCapUsd: "0",
        ethPriceUsd: 0,
        blockTimeSec: 0,
        networkName: "Unavailable",
        chainId: 0,
        averageGasPriceGwei: "0",
        baseFeeGwei: "0",
        timestamp: Math.floor(Date.now() / 1000),
        difficulty: null,
      },
    };
  }
}

export async function getChartStats(metric: "tps" | "gas" | "volume"): Promise<ApiResponse<ChartPoint[]>> {
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
