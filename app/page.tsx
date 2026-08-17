"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getNetworkStats,
  getChartStats,
  getMarketPrice
} from "@/services/blockchain.service";
import { getLatestBlocks } from "@/services/block.service";
import { getLatestTransactions } from "@/services/transaction.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActivityChart } from "@/components/charts/ActivityChart";
import { AddressDisplay } from "@/components/blockchain/AddressDisplay";
import { HashDisplay } from "@/components/blockchain/HashDisplay";
import { StatusBadge } from "@/components/blockchain/StatusBadge";
import { formatRelativeTime } from "@/lib/utils/dates";
import { formatNativeCurrency } from "@/lib/utils/numbers";
import {
  Database,
  Layers,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw
} from "lucide-react";

/** Dashboard cards refresh on their own; these intervals mirror each query's server-side cache TTL. */
const STATS_POLL_MS = 15_000;
const LIST_POLL_MS = 12_000;
const CHART_POLL_MS = 30_000;
const PRICE_POLL_MS = 30_000;

export default function Dashboard() {
  const [chartMetric, setChartMetric] = useState<"tps" | "gas" | "volume">("tps");

  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["networkStats"],
    queryFn: () => getNetworkStats(),
    refetchInterval: STATS_POLL_MS,
  });

  const { data: priceRes, isLoading: priceLoading, refetch: refetchPrice } = useQuery({
    queryKey: ["marketPrice"],
    queryFn: () => getMarketPrice(),
    refetchInterval: PRICE_POLL_MS,
  });

  const { data: blocksRes, isLoading: blocksLoading, refetch: refetchBlocks } = useQuery({
    queryKey: ["latestBlocks"],
    queryFn: () => getLatestBlocks(8),
    refetchInterval: LIST_POLL_MS,
  });

  const { data: txsRes, isLoading: txsLoading, refetch: refetchTxs } = useQuery({
    queryKey: ["latestTransactions"],
    queryFn: () => getLatestTransactions(8),
    refetchInterval: LIST_POLL_MS,
  });

  const { data: chartRes, isLoading: chartLoading, refetch: refetchChart } = useQuery({
    queryKey: ["chartStats", chartMetric],
    queryFn: () => getChartStats(chartMetric),
    refetchInterval: CHART_POLL_MS,
  });

  const stats = statsRes?.data;
  const price = priceRes?.data;
  const blocks = blocksRes?.data || [];
  const transactions = txsRes?.data || [];
  const chartData = chartRes?.data || [];

  const handleRefresh = () => {
    refetchStats();
    refetchPrice();
    refetchBlocks();
    refetchTxs();
    refetchChart();
  };

  // Shared hover treatment for card-like surfaces
  const hoverCard =
    "transition-colors duration-150 ease-out " +
    "hover:border-brand-primary/40 hover:bg-bg-secondary/40";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Title / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
            Blockchain <span className="text-brand-primary">Analytics</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            Real-time explorer and dashboard for block validation, gas fee tracking, and transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className={`gap-1.5 font-semibold ${hoverCard}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Overview Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Block Card */}
        <Card className="relative overflow-hidden bg-bg-primary/40 border-border-default/50 hover:border-brand-primary/30 transition-all duration-200">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">
                  Latest Block
                </span>
                <h3 className="text-2xl font-extrabold text-text-primary">
                  {statsLoading ? <Skeleton className="h-8 w-28" /> : `#${stats?.latestBlockNumber}`}
                </h3>
              </div>
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">
              ~{stats?.blockTimeSec}s avg block time
            </p>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="relative overflow-hidden bg-bg-primary/40 border-border-default/50 hover:border-brand-primary/30 transition-all duration-200">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">
                  Total Transactions
                </span>
                <h3 className="text-2xl font-extrabold text-text-primary">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    new Intl.NumberFormat("en-US").format(stats?.totalTransactions || 0)
                  )}
                </h3>
              </div>
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Database className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">
              {stats?.tps} TPS average
            </p>
          </CardContent>
        </Card>

        {/* Gas Price Card */}
        <Card className="relative overflow-hidden bg-bg-primary/40 border-border-default/50 hover:border-brand-primary/30 transition-all duration-200">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">
                  Average Gas Price
                </span>
                <h3 className="text-2xl font-extrabold text-text-primary flex items-baseline gap-1">
                  {statsLoading ? <Skeleton className="h-8 w-20" /> : `${stats?.gasPriceGwei}`}
                  <span className="text-xs font-semibold text-text-secondary">Gwei</span>
                </h3>
              </div>
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">
              Safe low: {stats ? parseFloat(stats.gasPriceGwei) * 0.9 : 0} Gwei
            </p>
          </CardContent>
        </Card>

        {/* Network Activity/Price Card */}
        <Card className="relative overflow-hidden bg-bg-primary/40 border-border-default/50 hover:border-brand-primary/30 transition-all duration-200">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block">
                  ETH Market Price
                </span>
                <h3 className="text-2xl font-extrabold text-text-primary flex items-baseline gap-1">
                  {priceLoading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    `$${(price?.ethPriceUsd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  )}
                  <span className="text-xs font-semibold text-text-secondary">USD</span>
                </h3>
              </div>
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-full flex items-center justify-center shrink-0">
                {(price?.change24hPct ?? 0) < 0 ? (
                  <TrendingDown className="h-5 w-5 text-state-error" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-brand-primary" />
                )}
              </div>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">
              Cap: ${(price?.marketCapUsd ?? 0).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}
              {" · "}
              <span className={(price?.change24hPct ?? 0) < 0 ? "text-state-error" : "text-state-success"}>
                {(price?.change24hPct ?? 0) >= 0 ? "+" : ""}
                {(price?.change24hPct ?? 0).toFixed(2)}% 24h
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Activity Chart & Metrics Selector */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-4 bg-bg-primary/40 border border-border-default/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-primary" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Network History
              </h3>
            </div>
            <div className="flex gap-2 p-1.5 bg-bg-secondary/60 rounded-lg border border-border-default/60">
              {(["tps", "gas", "volume"] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setChartMetric(metric)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all duration-150 ease-out ${
                    chartMetric === metric
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          {chartLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ActivityChart
              data={chartData}
              title={`${chartMetric} index`}
              valueSuffix={chartMetric === "tps" ? "TPS" : chartMetric === "gas" ? "Gwei" : "k Tx"}
            />
          )}
        </div>
      </div>

      {/* Latest Blocks & Transactions side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <span className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              Latest Blocks
            </span>
            <span className="text-[10px] text-text-tertiary font-semibold uppercase">Real-time Feed</span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border-default/40 flex-1 animate-in fade-in duration-300">
            {blocksLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-4 flex gap-4 animate-pulse">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              blocks.map((block) => (
                <div
                  key={block.number}
                  className={`p-4 flex items-center justify-between gap-4 border border-transparent ${hoverCard}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-bg-secondary border border-border-default flex flex-col items-center justify-center shrink-0">
                      <Layers className="h-4 w-4 text-accent-block" />
                      <span className="text-[9px] font-bold text-text-tertiary mt-0.5">BK</span>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href={`/blocks/${block.number}`}
                        className="text-xs font-bold text-accent-block hover:text-brand-primary"
                      >
                        {block.number}
                      </Link>
                      <p className="text-[10px] text-text-tertiary">
                        {formatRelativeTime(block.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-left sm:flex sm:items-center sm:gap-6">
                    <div className="space-y-1 hidden sm:block">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-text-tertiary">Validator:</span>
                        <AddressDisplay address={block.miner} shorten={true} charsStart={4} charsEnd={4} showCopy={false} />
                      </div>
                      <p className="text-[10px] text-text-secondary font-medium">
                        {block.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold bg-bg-secondary border border-border-default px-2 py-1 rounded text-text-primary">
                        {(parseFloat(block.gasUsed.toString()) / 1e6).toFixed(2)}M Gas
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <span className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              Latest Transactions
            </span>
            <span className="text-[10px] text-text-tertiary font-semibold uppercase">Live Feed</span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border-default/40 flex-1 animate-in fade-in duration-300">
            {txsLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-4 flex gap-4 animate-pulse">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className={`p-4 flex items-center justify-between gap-4 border border-transparent ${hoverCard}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-bg-secondary border border-border-default flex flex-col items-center justify-center shrink-0">
                      <Database className="h-4 w-4 text-accent-transaction" />
                      <span className="text-[9px] font-bold text-text-tertiary mt-0.5">TX</span>
                    </div>
                    <div className="space-y-1">
                      <HashDisplay hash={tx.hash} type="transaction" shorten={true} showCopy={false} />
                      <p className="text-[10px] text-text-tertiary">
                        {formatRelativeTime(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-left sm:flex sm:items-center sm:gap-6 flex-1 justify-end">
                    <div className="space-y-1 hidden md:block">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-text-tertiary">From:</span>
                        <AddressDisplay address={tx.from} shorten={true} charsStart={4} charsEnd={4} showCopy={false} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-text-tertiary">To:</span>
                        {tx.to ? (
                          <AddressDisplay address={tx.to} shorten={true} charsStart={4} charsEnd={4} showCopy={false} />
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-accent-contract bg-accent-contract/5 border border-accent-contract/10 px-1 rounded">Contract</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <span className="text-xs font-bold text-text-primary font-mono">
                        {formatNativeCurrency(tx.value)}
                      </span>
                      <p className="text-[10px] text-text-tertiary">
                        {/* formatNativeCurrency can return "< 0.0001 ETH", which parseFloat turns into NaN */}
                        Fee: {formatNativeCurrency(tx.gasUsed ? tx.gasUsed * tx.gasPrice : 21000n * tx.gasPrice)}
                      </p>
                    </div>
                    <div className="shrink-0 hidden sm:block">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}