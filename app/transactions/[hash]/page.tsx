"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction } from "@/services/transaction.service";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/dates";
import { formatNativeCurrency, weiToEth, weiToGwei } from "@/lib/utils/numbers";
import { formatGas, formatGasFee } from "@/lib/utils/gas";
import { AddressDisplay } from "@/components/blockchain/AddressDisplay";
import { HashDisplay } from "@/components/blockchain/HashDisplay";
import { StatusBadge } from "@/components/blockchain/StatusBadge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/Card";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { Database, Calendar, Terminal } from "lucide-react";

export default async function TransactionPage(props: PageProps<"/transactions/[hash]">) {
  const { hash } = await props.params;
  const decodedHash = decodeURIComponent(hash);

  const txRes = await getTransaction(decodedHash);
  const tx = txRes.data;

  if (!tx) {
    notFound();
  }

  const breadcrumbs = [
    { label: "Transactions", href: "/" },
    { label: hash },
  ];

  // Calculate actual tx fee
  const gasUsed = tx.gasUsed || 21000n;

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Navigation */}
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
          <Database className="h-6 w-6 text-brand-primary" />
          Transaction Details
        </h1>
      </div>

      {/* Main Details Card */}
      <Card>
        <CardContent className="p-0 divide-y divide-border-default/60 text-xs sm:text-sm">
          {/* Hash */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Transaction Hash</span>
            <span className="md:col-span-2">
              <HashDisplay hash={tx.hash} type="transaction" shorten={false} />
            </span>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Result</span>
            <span className="md:col-span-2">
              <StatusBadge status={tx.status} />
            </span>
          </div>

          {/* Block */}
          {tx.blockNumber !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
              <span className="font-semibold text-text-secondary">Block</span>
              <span className="md:col-span-2">
                <Link
                  href={`/blocks/${tx.blockNumber}`}
                  className="font-bold text-accent-block hover:text-brand-primary transition-colors"
                >
                  {tx.blockNumber}
                </Link>
              </span>
            </div>
          )}

          {/* Timestamp */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Timestamp</span>
            <span className="md:col-span-2 text-text-primary flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-text-tertiary" />
              {formatDateTime(tx.timestamp)} ({formatRelativeTime(tx.timestamp)})
            </span>
          </div>

          {/* From */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">From</span>
            <span className="md:col-span-2">
              <AddressDisplay address={tx.from} shorten={false} />
            </span>
          </div>

          {/* To */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">To</span>
            <span className="md:col-span-2">
              {tx.to ? (
                <AddressDisplay address={tx.to} shorten={false} />
              ) : tx.contractAddress ? (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-semibold text-accent-contract bg-accent-contract/5 px-2 py-0.5 rounded border border-accent-contract/15">
                    [Contract Created]
                  </span>
                  <AddressDisplay address={tx.contractAddress} shorten={false} isContract={true} />
                </div>
              ) : (
                <span className="text-text-disabled">Contract Creation</span>
              )}
            </span>
          </div>

          {/* Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Value</span>
            <span className="md:col-span-2 font-bold text-text-primary">
              {formatNativeCurrency(tx.value)} ({weiToEth(tx.value)} ETH)
            </span>
          </div>

          {/* Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Transaction Fee</span>
            <span className="md:col-span-2 font-bold text-state-success font-mono">
              {formatGasFee(gasUsed, tx.gasPrice)}
            </span>
          </div>

          {/* Gas Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Gas Price</span>
            <span className="md:col-span-2 text-text-primary font-mono">
              {weiToGwei(tx.gasPrice)} Gwei ({weiToEth(tx.gasPrice)} ETH)
            </span>
          </div>

          {/* Gas Limit & Usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Gas Limit & Usage</span>
            <span className="md:col-span-2 text-text-primary">
              {formatGas(tx.gas)} | {formatGas(gasUsed)} ({((Number(gasUsed) / Number(tx.gas)) * 100).toFixed(2)}%)
            </span>
          </div>

          {/* Transaction Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Tx Type</span>
            <span className="md:col-span-2 text-text-primary font-semibold">
              {TRANSACTION_TYPES[tx.type] || "Legacy"} (Type {tx.type})
            </span>
          </div>

          {/* Nonce */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Nonce</span>
            <span className="md:col-span-2 text-text-primary font-mono">
              {tx.nonce}
            </span>
          </div>

          {/* Input Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary flex items-center gap-1">
              <Terminal className="h-4 w-4 text-text-tertiary shrink-0" />
              Input Data
            </span>
            <div className="md:col-span-2 space-y-2">
              <textarea
                readOnly
                className="w-full h-24 p-3 font-mono text-xs text-text-secondary bg-bg-secondary border border-border-default rounded-lg focus:outline-none"
                value={tx.input}
              />
              <span className="text-[10px] text-text-tertiary block font-medium">
                Hex representation of contract invocation payload data
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
