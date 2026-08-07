import React from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Transaction } from "@/types";
import { formatRelativeTime } from "@/lib/utils/dates";
import { formatNativeCurrency } from "@/lib/utils/numbers";
import { AddressDisplay } from "./AddressDisplay";
import { HashDisplay } from "./HashDisplay";
import { StatusBadge } from "./StatusBadge";
import { TableRow, TableCell } from "@/components/ui/Table";

interface TransactionRowProps {
  tx: Transaction;
  showBlock?: boolean;
}

export function TransactionRow({ tx, showBlock = false }: TransactionRowProps) {
  return (
    <TableRow>
      <TableCell className="max-w-[120px] sm:max-w-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-zinc-500">
            <FileText className="h-4 w-4" />
          </div>
          <HashDisplay hash={tx.hash} type="transaction" shorten={true} />
        </div>
      </TableCell>
      
      {showBlock && (
        <TableCell>
          <Link
            href={`/blocks/${tx.blockNumber}`}
            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            {tx.blockNumber}
          </Link>
        </TableCell>
      )}

      <TableCell className="hidden md:table-cell">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatRelativeTime(tx.timestamp)}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <AddressDisplay address={tx.from} shorten={true} charsStart={4} charsEnd={4} showCopy={false} />
          <ArrowRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600 hidden sm:inline shrink-0" />
          {tx.to ? (
            <AddressDisplay address={tx.to} shorten={true} charsStart={4} charsEnd={4} showCopy={false} isContract={tx.to === "0x2810c876E100053C3775b14429E2F9c1cCFB487A"} />
          ) : (
            <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/30">
              Contract Creation
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <span className="text-xs font-bold text-zinc-900 dark:text-white">
          {formatNativeCurrency(tx.value)}
        </span>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-right">
        <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
          {parseFloat(tx.gasPrice.toString()) / 1e9} Gwei
        </span>
      </TableCell>

      <TableCell className="text-right">
        <StatusBadge status={tx.status} />
      </TableCell>
    </TableRow>
  );
}

// Inline import for Next Link since we want it for the block numbers
import Link from "next/link";
