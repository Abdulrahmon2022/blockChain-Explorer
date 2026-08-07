import { useState, useCallback } from "react";
import { useToastStore } from "@/stores/toastStore";

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const addToast = useToastStore((state:  any) => state.addToast);

  const copy = useCallback((text: string, message = "Copied to clipboard") => {
    if (!navigator.clipboard) {
      addToast({
        type: "error",
        title: "Copy Failed",
        description: "Clipboard API not supported on this browser.",
      });
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        addToast({
          type: "success",
          title: "Copied!",
          description: message,
        });
        setTimeout(() => setCopied(false), timeout);
      },
      (err) => {
        addToast({
          type: "error",
          title: "Copy Failed",
          description: err.message || "An error occurred while copying.",
        });
      }
    );
  }, [addToast, timeout]);

  return { copied, copy };
}
