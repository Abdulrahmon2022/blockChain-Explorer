"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider as Provider } from "@tanstack/react-query";

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000, // 5 seconds stale time (great for blockchain updates)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <Provider client={queryClient}>{children}</Provider>;
}
