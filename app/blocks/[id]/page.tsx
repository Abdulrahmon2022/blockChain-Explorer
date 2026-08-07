import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlock } from "@/services/block.service";
import { formatDateTime } from "@/lib/utils/dates";
import { formatGas, getGasUsedPercentage } from "@/lib/utils/gas";
import { formatNumber, weiToEth, weiToGwei } from "@/lib/utils/numbers";
import { AddressDisplay } from "@/components/blockchain/AddressDisplay";
import { HashDisplay } from "@/components/blockchain/HashDisplay";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight, Layers, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function BlockPage(props: PageProps<"/blocks/[id]">) {
  const { id } = await props.params;
  const decodedId = decodeURIComponent(id);

  const blockRes = await getBlock(decodedId);
  const block = blockRes.data;

  if (!block) {
    notFound();
  }

  const gasPercent = getGasUsedPercentage(block.gasUsed, block.gasLimit);

  const breadcrumbs = [
    { label: "Blocks", href: "/" },
    { label: `#${block.number}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Breadcrumbs items={breadcrumbs} />
          <h1 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent-block" />
            Block #{block.number}
          </h1>
        </div>
        
        {/* Previous / Next Block buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 p-2" disabled={block.number <= 0}>
            <Link href={`/blocks/${block.number - 1}`} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 p-2">
            <Link href={`/blocks/${block.number + 1}`} className="flex items-center gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Details Card */}
      <Card>
        <CardContent className="p-0 divide-y divide-border-default/60 text-xs sm:text-sm">
          {/* Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Block Height</span>
            <span className="md:col-span-2 font-bold text-text-primary">{block.number}</span>
          </div>

          {/* Timestamp */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Timestamp</span>
            <span className="md:col-span-2 text-text-primary flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-text-tertiary" />
              {formatDateTime(block.timestamp)}
            </span>
          </div>

          {/* Transactions count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Transactions</span>
            <span className="md:col-span-2 text-text-primary font-semibold">
              {block.transactionCount} transactions in this block
            </span>
          </div>

          {/* Miner / Validator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Fee Recipient</span>
            <span className="md:col-span-2">
              <AddressDisplay address={block.miner} shorten={false} />
            </span>
          </div>

          {/* Gas details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Gas Used</span>
            <div className="md:col-span-2 space-y-2">
              <span className="font-bold text-text-primary">
                {formatGas(block.gasUsed)} ({gasPercent}%)
              </span>
              <div className="w-full max-w-md bg-bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    gasPercent > 90 ? "bg-state-error" : gasPercent > 70 ? "bg-state-warning" : "bg-state-success"
                  }`}
                  style={{ width: `${Math.min(100, gasPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gas Limit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Gas Limit</span>
            <span className="md:col-span-2 font-mono text-text-secondary">
              {formatGas(block.gasLimit)}
            </span>
          </div>

          {/* Base Fee Per Gas */}
          {block.baseFeePerGas !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
              <span className="font-semibold text-text-secondary">Base Fee Per Gas</span>
              <span className="md:col-span-2 text-text-primary font-mono">
                {weiToGwei(block.baseFeePerGas)} Gwei ({weiToEth(block.baseFeePerGas)} ETH)
              </span>
            </div>
          )}

          {/* Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Size</span>
            <span className="md:col-span-2 text-text-primary">
              {formatNumber(block.size, 0)} bytes
            </span>
          </div>

          {/* Hash */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Hash</span>
            <span className="md:col-span-2">
              <HashDisplay hash={block.hash} type="block" shorten={false} />
            </span>
          </div>

          {/* Parent Hash */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Parent Hash</span>
            <span className="md:col-span-2">
              <HashDisplay hash={block.parentHash} type="block" shorten={false} />
            </span>
          </div>

          {/* Extra Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-5">
            <span className="font-semibold text-text-secondary">Extra Data</span>
            <span className="md:col-span-2 font-mono text-xs text-text-secondary break-all p-3 rounded-md bg-bg-secondary border border-border-default">
              {block.extraData}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
