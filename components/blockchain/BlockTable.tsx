import React from "react";
import Link from "next/link";
import { Block } from "@/types";
import { formatRelativeTime } from "@/lib/utils/dates";
import { formatGas, getGasUsedPercentage } from "@/lib/utils/gas";
import { formatNumber } from "@/lib/utils/numbers";
import { AddressDisplay } from "./AddressDisplay";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";

interface BlockTableProps {
  blocks?: Block[];
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
}

export function BlockTable({
  blocks,
  isLoading,
  isError,
  currentPage,
  totalPages,
  onPageChange,
  onRetry,
}: BlockTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={8} cols={5} />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (!blocks || blocks.length === 0) {
    return <EmptyState title="No blocks found" description="No blocks were generated or found in the indexer." />;
  }

  return (
    <div className="flex flex-col">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Block</TableHead>
              <TableHead className="hidden sm:table-cell">Age</TableHead>
              <TableHead>Txn Count</TableHead>
              <TableHead>Validator</TableHead>
              <TableHead className="text-right">Gas Used</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.map((block) => {
              const gasPercent = getGasUsedPercentage(block.gasUsed, block.gasLimit);
              return (
                <TableRow key={block.number}>
                  <TableCell>
                    <Link
                      href={`/blocks/${block.number}`}
                      className="font-semibold text-zinc-950 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      {block.number}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatRelativeTime(block.timestamp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {block.transactionCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AddressDisplay address={block.miner} shorten={true} charsStart={6} charsEnd={4} showCopy={false} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatGas(block.gasUsed)}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {gasPercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {formatNumber(block.size, 0)} B
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
