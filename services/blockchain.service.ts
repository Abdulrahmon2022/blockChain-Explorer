import { ApiResponse, ChartPoint } from "@/types";
import { apiGet, query } from "./client";
import { weiToGwei } from "@/lib/utils/numbers";

export interface NetworkStats {
  latestBlockNumber: number;
  totalTransactions: number;
  gasPriceGwei: string;
  tps: number;
  blockTimeSec: number;
}

export interface MarketPrice {
  ethPriceUsd: number;
  marketCapUsd: number;
  change24hPct: number;
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
    },
    error,
  };
}

export async function getChartStats(
  metric: "tps" | "gas" | "volume"
): Promise<ApiResponse<ChartPoint[]>> {
  return apiGet<ChartPoint[]>(`/api/stats/chart${query({ metric })}`, []);
}

interface RawEthPrice {
  usd: number;
  usdMarketCap: number;
  usd24hChange: number;
}

const EMPTY_PRICE: RawEthPrice = { usd: 0, usdMarketCap: 0, usd24hChange: 0 };

/**
 * Real ETH/USD market reference (mainnet price via CoinGecko) — Sepolia ETH
 * itself has no market value, so this is shown as context, not a testnet price.
 */
export async function getMarketPrice(): Promise<ApiResponse<MarketPrice>> {
  const { data, error } = await apiGet<RawEthPrice>("/api/price", EMPTY_PRICE);

  return {
    data: {
      ethPriceUsd: data.usd,
      marketCapUsd: data.usdMarketCap,
      change24hPct: data.usd24hChange,
    },
    error,
  };
}
