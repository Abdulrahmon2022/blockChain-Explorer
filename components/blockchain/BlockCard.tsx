import React from "react";
import Link from "next/link";
import { Cpu, Calendar, Hash, FileText } from "lucide-react";
import { Block } from "@/types";
import { formatRelativeTime } from "@/lib/utils/dates";
import { getGasUsedPercentage, formatGas } from "@/lib/utils/gas";
import { AddressDisplay } from "./AddressDisplay";
import { Card, CardContent } from "@/components/ui/Card";

interface BlockCardProps {
  block: Block;
}

export function BlockCard({ block }: BlockCardProps) {
  const gasPercent = getGasUsedPercentage(block.gasUsed, block.gasLimit);

  return (
    <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/blocks/${block.number}`}
            className="flex items-center gap-1.5 font-bold text-sm text-zinc-950 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <Hash className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            Block #{block.number}
          </Link>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatRelativeTime(block.timestamp)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 dark:text-zinc-500 font-medium">Validator</span>
            <AddressDisplay address={block.miner} shorten={true} charsStart={4} charsEnd={4} showCopy={false} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 dark:text-zinc-500 font-medium">Transactions</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
              {block.transactionCount} txs
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-xs border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-500">
            <span>Gas Used</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-300">
              {formatGas(block.gasUsed)} / {formatGas(block.gasLimit)} ({gasPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                gasPercent > 90
                  ? "bg-rose-500"
                  : gasPercent > 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, gasPercent)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
