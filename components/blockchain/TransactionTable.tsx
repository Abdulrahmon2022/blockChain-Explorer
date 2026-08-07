import React from "react";
import { Transaction } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { TransactionRow } from "./TransactionRow";

interface TransactionTableProps {
  transactions?: Transaction[];
  isLoading: boolean;
  isError: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  showBlock?: boolean;
}

export function TransactionTable({
  transactions,
  isLoading,
  isError,
  currentPage,
  totalPages,
  onPageChange,
  onRetry,
  showBlock = false,
}: TransactionTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={8} cols={6} />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (!transactions || transactions.length === 0) {
    return <EmptyState title="No transactions found" description="No transactions match this address or page." />;
  }

  return (
    <div className="flex flex-col">
      <div className="border border-border-default rounded-xl overflow-hidden bg-bg-tertiary shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tx Hash</TableHead>
              {showBlock && <TableHead>Block</TableHead>}
              <TableHead className="hidden md:table-cell">Age</TableHead>
              <TableHead>From / To</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Gas Price</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TransactionRow key={tx.hash} tx={tx} showBlock={showBlock} />
            ))}
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
