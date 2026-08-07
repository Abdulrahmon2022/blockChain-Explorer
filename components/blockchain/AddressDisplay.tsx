"use client"

import React from "react";
import Link from "next/link";
import { FileCode } from "lucide-react";
import { shortenAddress } from "@/lib/utils/addresses";
import { CopyButton } from "@/components/ui/CopyButton";
import { Badge } from "@/components/ui/Badge";

interface AddressDisplayProps {
  address: string;
  isContract?: boolean;
  ensName?: string;
  shorten?: boolean;
  charsStart?: number;
  charsEnd?: number;
  showCopy?: boolean;
}

export function AddressDisplay({
  address,
  isContract = false,
  ensName,
  shorten = true,
  charsStart = 6,
  charsEnd = 4,
  showCopy = true,
}: AddressDisplayProps) {
  if (!address) return null;

  const displayName = ensName || (shorten ? shortenAddress(address, charsStart, charsEnd) : address);

  return (
    <div className="inline-flex items-center gap-1.5 max-w-full">
      {isContract && (
        <Badge variant="outline" className="gap-0.5 px-1 py-0 text-[9px] shrink-0 font-bold border-accent-contract/20 text-accent-contract bg-accent-contract/5">
          <FileCode className="h-2.5 w-2.5" />
          Contract
        </Badge>
      )}
      <Link
        href={`/addresses/${address}`}
        title={address}
        className="font-mono text-xs font-semibold text-accent-address hover:text-brand-primary transition-colors underline decoration-dotted underline-offset-2 shrink-0 truncate"
      >
        {displayName}
      </Link>
      {showCopy && (
        <CopyButton
          value={address}
          tooltipText="Copy address"
          successMessage="Address copied to clipboard"
          className="shrink-0"
        />
      )}
    </div>
  );
}
