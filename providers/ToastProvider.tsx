"use client";

import React from "react";
import { useToastStore } from "@/stores/toastStore";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast: any) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 rounded-lg shadow-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 pointer-events-auto animate-in slide-in-from-bottom-5 duration-200"
          >
            {isSuccess && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
            {isError && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
            {(isWarning || toast.type === "info") && <Info className="h-5 w-5 text-sky-500 shrink-0" />}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-5">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-4">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 transition-colors p-0.5 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
