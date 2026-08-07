import React from "react";
import Link from "next/link";
import { shortenHash } from "@/lib/utils/addresses";
import { CopyButton } from "@/components/ui/CopyButton";

interface HashDisplayProps {
  hash: string;
  type?: "transaction" | "block";
  shorten?: boolean;
  charsStart?: number;
  charsEnd?: number;
  showCopy?: boolean;
}

export function HashDisplay({
  hash,
  type = "transaction",
  shorten = true,
  charsStart = 8,
  charsEnd = 6,
  showCopy = true,
}: HashDisplayProps) {
  if (!hash) return null;

  const displayName = shorten ? shortenHash(hash, charsStart, charsEnd) : hash;
  const path = type === "block" ? `/blocks/${hash}` : `/transactions/${hash}`;
  const colorClass = type === "block" ? "text-accent-block" : "text-accent-transaction";

  return (
    <div className="inline-flex items-center gap-1.5 max-w-full">
      <Link
        href={path}
        title={hash}
        className={`font-mono text-xs font-semibold ${colorClass} hover:text-brand-primary transition-colors shrink-0 truncate`}
      >
        {displayName}
      </Link>
      {showCopy && (
        <CopyButton
          value={hash}
          tooltipText={`Copy ${type} hash`}
          successMessage={`${type.charAt(0).toUpperCase() + type.slice(1)} hash copied`}
          className="shrink-0"
        />
      )}
    </div>
  );
}
