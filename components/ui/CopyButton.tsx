"use client";

import React from "react";
import { useClipboard } from "@/hooks/useClipboard";
import { Copy, Check } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface CopyButtonProps {
  value: string;
  tooltipText?: string;
  successMessage?: string;
  className?: string;
}

export function CopyButton({
  value,
  tooltipText = "Copy to clipboard",
  successMessage,
  className = "",
}: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <Tooltip content={copied ? "Copied!" : tooltipText}>
      <button
        onClick={() => copy(value, successMessage)}
        type="button"
        className={`text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </Tooltip>
  );
}
