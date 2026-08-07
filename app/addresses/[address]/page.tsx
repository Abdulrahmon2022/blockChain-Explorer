"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAddress } from "@/services/address.service";
import { getTransactionsByAddress } from "@/services/transaction.service";
import { getTokenTransfers } from "@/services/token.service";
import { formatNativeCurrency, formatTokenAmount } from "@/lib/utils/numbers";
import { shortenAddress } from "@/lib/utils/addresses";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { TransactionTable } from "@/components/blockchain/TransactionTable";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CopyButton } from "@/components/ui/CopyButton";
import { Badge } from "@/components/ui/Badge";
import { Landmark, Coins, FileCode, ArrowRight, ArrowLeft } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";

export default function AddressPage(props: PageProps<"/addresses/[address]">) {
  const { address } = use(props.params);
  const decodedAddress = decodeURIComponent(address);

  const [activeTab, setActiveTab] = useState("transactions");
  
  // Pagination for transactions
  const txPage = usePagination({ initialPage: 1, initialPageSize: 10 });
  // Pagination for transfers
  const transferPage = usePagination({ initialPage: 1, initialPageSize: 10 });

  // Query address information
  const { data: addressRes, isLoading: addressLoading } = useQuery({
    queryKey: ["addressInfo", decodedAddress],
    queryFn: () => getAddress(decodedAddress),
  });

  // Query transactions list
  const { data: txsRes, isLoading: txsLoading } = useQuery({
    queryKey: ["addressTransactions", decodedAddress, txPage.currentPage],
    queryFn: () => getTransactionsByAddress(decodedAddress, txPage.currentPage, txPage.pageSize),
  });

  // Query token transfers list
  const { data: transfersRes, isLoading: transfersLoading } = useQuery({
    queryKey: ["addressTransfers", decodedAddress, transferPage.currentPage],
    queryFn: () => getTokenTransfers(transferPage.currentPage, transferPage.pageSize, undefined, decodedAddress),
  });

  const info = addressRes?.data;
  const txs = txsRes?.data || [];
  const totalTxPages = txsRes?.pagination?.totalPages || 1;

  const transfers = transfersRes?.data || [];
  const totalTransferPages = transfersRes?.pagination?.totalPages || 1;

  const breadcrumbs = [
    { label: "Addresses", href: "/" },
    { label: decodedAddress },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2 truncate max-w-full">
            <Landmark className="h-6 w-6 text-brand-primary shrink-0" />
            Address <span className="font-mono text-base sm:text-xl break-all">{decodedAddress}</span>
          </h1>
          <div className="flex gap-1.5 shrink-0">
            <CopyButton value={decodedAddress} successMessage="Address copied" />
            {info?.ensName && (
              <Badge variant="success">
                {info.ensName}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Eth balance card */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Balance (ETH)
              </span>
              <h3 className="text-lg font-black text-text-primary">
                {addressLoading ? "Loading..." : info ? formatNativeCurrency(info.balance) : "0 ETH"}
              </h3>
              <p className="text-[10px] text-text-secondary font-medium">
                ~${info ? (parseFloat(formatNativeCurrency(info.balance).split(" ")[0]) * 2450).toFixed(2) : "0.00"} USD
              </p>
            </div>
            <div className="p-3 bg-bg-secondary border border-border-default rounded-lg text-text-secondary">
              <Landmark className="h-5 w-5 text-brand-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Tokens valuation card */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                Token Holdings
              </span>
              <h3 className="text-lg font-black text-text-primary">
                {addressLoading ? "Loading..." : info ? `$${info.tokenBalance.toLocaleString()}` : "$0.00"}
              </h3>
              <p className="text-[10px] text-text-secondary font-medium">
                Estimated multiholding valuation
              </p>
            </div>
            <div className="p-3 bg-bg-secondary border border-border-default rounded-lg text-text-secondary">
              <Coins className="h-5 w-5 text-accent-token" />
            </div>
          </CardContent>
        </Card>

        {/* Type / Contract indicator */}
        {info?.isContract && (
          <Card className="border-accent-contract/20 bg-accent-contract/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-accent-contract uppercase tracking-widest">
                  Smart Contract
                </span>
                <h3 className="text-sm font-bold text-text-primary">
                  Verified Creator:
                </h3>
                <div className="text-[10px] text-text-secondary truncate">
                  <Link href={`/addresses/${info.contractCreator}`} className="hover:underline text-accent-address font-mono font-semibold">
                    {info.contractCreator ? shortenAddress(info.contractCreator) : ""}
                  </Link>
                </div>
              </div>
              <div className="p-3 bg-bg-secondary border border-border-default rounded-lg text-accent-contract">
                <FileCode className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tabbed List */}
      <Tabs defaultValue="transactions">
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <TabsList>
            <TabsTrigger value="transactions" onClick={() => setActiveTab("transactions")}>
              Transactions
            </TabsTrigger>
            <TabsTrigger value="transfers" onClick={() => setActiveTab("transfers")}>
              Token Transfers
            </TabsTrigger>
            {info?.isContract && (
              <TabsTrigger value="contract" onClick={() => setActiveTab("contract")}>
                Contract Execution
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <TransactionTable
            transactions={txs}
            isLoading={txsLoading}
            isError={false}
            currentPage={txPage.currentPage}
            totalPages={totalTxPages}
            onPageChange={(p) => txPage.setPage(p, totalTxPages)}
            showBlock={true}
          />
        </TabsContent>

        {/* Token Transfers Tab */}
        <TabsContent value="transfers">
          {transfersLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : transfers.length === 0 ? (
            <EmptyState title="No token transfers" description="This address has not initiated or received token transfers." />
          ) : (
            <div className="flex flex-col">
              <div className="border border-border-default rounded-lg overflow-hidden bg-bg-tertiary shadow-sm animate-in fade-in duration-300">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tx Hash</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>From / To</TableHead>
                      <TableHead className="text-right font-bold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((item, idx) => {
                      const isOutgoing = item.from.toLowerCase() === decodedAddress.toLowerCase();
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Link href={`/transactions/${item.transactionHash}`} className="font-semibold text-accent-transaction hover:text-brand-primary font-mono transition-colors">
                              {item.transactionHash.substring(0, 10)}...
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-text-primary">
                              {item.tokenSymbol} ({item.tokenName})
                            </span>
                          </TableCell>
                          <TableCell>
                            {isOutgoing ? (
                              <Badge variant="warning" className="gap-1 px-1.5 py-0.5">
                                <ArrowRight className="h-3 w-3" />
                                OUT
                              </Badge>
                            ) : (
                              <Badge variant="success" className="gap-1 px-1.5 py-0.5">
                                <ArrowLeft className="h-3 w-3" />
                                IN
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                              <span className="text-xs font-medium text-text-tertiary">
                                {isOutgoing ? "To:" : "From:"}
                              </span>
                              <Link
                                href={`/addresses/${isOutgoing ? item.to : item.from}`}
                                className="font-mono text-xs text-accent-address hover:text-brand-primary font-semibold underline decoration-dotted transition-colors"
                              >
                                {shortenAddress(isOutgoing ? item.to : item.from)}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-text-primary">
                            {item.value ? formatTokenAmount(item.value, item.tokenDecimals) : item.tokenId ? `NFT #${item.tokenId}` : "0"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-xs text-text-secondary">
                  Page <span className="font-semibold">{transferPage.currentPage}</span> of {totalTransferPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={transferPage.currentPage <= 1} onClick={transferPage.prevPage}>
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={transferPage.currentPage >= totalTransferPages} onClick={() => transferPage.nextPage(totalTransferPages)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Contract Read/Write Tab */}
        {info?.isContract && (
          <TabsContent value="contract">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Smart Contract Execution Shell
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Interact directly with verified variables and state transitions of contract code payload.
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="primary">
                    <Link href={`/contracts/${decodedAddress}`} className="flex items-center gap-1.5 font-bold">
                      <FileCode className="h-4 w-4" />
                      Read / Write Contract Controls
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
