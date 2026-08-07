"use client";

import React, { use, useState } from "react";
import { getAddress } from "@/services/address.service";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastStore } from "@/stores/toastStore";
import { FileCode, Play, Eye } from "lucide-react";

export default function ContractPage(props: PageProps<"/contracts/[address]">) {
  const { address } = use(props.params);
  const decodedAddress = decodeURIComponent(address);
  const addToast = useToastStore((state) => state.addToast);

  const [ownerAddress, setOwnerAddress] = useState("");
  const [balanceResult, setBalanceResult] = useState<string | null>(null);

  const [writeTo, setWriteTo] = useState("");
  const [writeAmount, setWriteAmount] = useState("");
  const [isSubmittingWrite, setIsSubmittingWrite] = useState(false);

  const { data: addressRes } = useQuery({
    queryKey: ["addressContract", decodedAddress],
    queryFn: () => getAddress(decodedAddress),
  });

  const handleReadBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerAddress.trim()) return;
    
    // Simulate reading contract state
    setBalanceResult("250.45 WETH");
    addToast({
      type: "success",
      title: "Query Successful",
      description: "Fetched balance from contract state.",
    });
  };

  const handleWriteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeTo.trim() || !writeAmount.trim()) return;

    setIsSubmittingWrite(true);
    
    setTimeout(() => {
      setIsSubmittingWrite(false);
      addToast({
        type: "success",
        title: "Transaction Broadcasted",
        description: `Successfully simulated transfer of ${writeAmount} tokens to ${writeTo.substring(0, 8)}...`,
      });
      setWriteTo("");
      setWriteAmount("");
    }, 1200);
  };

  const breadcrumbs = [
    { label: "Addresses", href: `/addresses/${decodedAddress}` },
    { label: "Contract Shell" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
          <FileCode className="h-6 w-6 text-emerald-500" />
          Contract Interface: <span className="font-mono text-sm sm:text-base">{decodedAddress}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Read Contract */}
        <Card>
          <CardHeader className="py-4">
            <span className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-500" />
              Read State Methods
            </span>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* decimals() */}
            <div className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">1. decimals()</span>
                <span className="font-semibold text-zinc-550 dark:text-zinc-400">18 (uint8)</span>
              </div>
            </div>

            {/* symbol() */}
            <div className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">2. symbol()</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-450">WETH (string)</span>
              </div>
            </div>

            {/* balanceOf() query */}
            <div className="space-y-3">
              <span className="font-bold font-mono text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                3. balanceOf(owner address)
              </span>
              <form onSubmit={handleReadBalance} className="flex gap-2">
                <Input
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  placeholder="0x..."
                  className="h-9 !py-1 text-xs"
                />
                <Button variant="outline" size="sm" type="submit" className="h-9 font-bold shrink-0">
                  Query
                </Button>
              </form>
              {balanceResult && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Result: <span className="font-mono text-zinc-950 dark:text-white">{balanceResult}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Write Contract */}
        <Card>
          <CardHeader className="py-4">
            <span className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Play className="h-4 w-4 text-emerald-500 animate-pulse" />
              Write State Transitions
            </span>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <span className="font-bold font-mono text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                1. transfer(to address, amount)
              </span>
              <form onSubmit={handleWriteTransfer} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase">Recipient (address)</label>
                  <Input
                    value={writeTo}
                    onChange={(e) => setWriteTo(e.target.value)}
                    placeholder="0x..."
                    className="h-9 !py-1 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase">Amount (uint250)</label>
                  <Input
                    value={writeAmount}
                    onChange={(e) => setWriteAmount(e.target.value)}
                    placeholder="0.0"
                    type="number"
                    step="any"
                    className="h-9 !py-1 text-xs"
                    required
                  />
                </div>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingWrite} className="w-full font-bold">
                  {isSubmittingWrite ? "Broadcasting..." : "Transact"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
