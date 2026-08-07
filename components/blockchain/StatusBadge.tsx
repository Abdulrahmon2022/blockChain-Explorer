"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TransactionStatus } from "@/types";

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "Success":
      return (
        <Badge variant="success" className="gap-1 px-2 py-1">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    case "Failed":
    case "Reverted":
      return (
        <Badge variant="danger" className="gap-1 px-2 py-1">
          <XCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="warning" className="gap-1 px-2 py-1">
          <AlertCircle className="h-3 w-3 animate-pulse" />
          Pending
        </Badge>
      );
    case "Dropped":
      return (
        <Badge variant="secondary" className="gap-1 px-2 py-1">
          <HelpCircle className="h-3 w-3" />
          Dropped
        </Badge>
      );
    default:
      return <Badge variant="primary">{status}</Badge>;
  }
}
