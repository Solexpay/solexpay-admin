"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useCallback, useState } from "react";

const mocking = process.env.NODE_ENV === "development";

// The ternary lets production builds drop the mock chunk entirely.
const MockWorker = mocking
  ? dynamic(() => import("../mocks/mock-worker"), { ssr: false })
  : null;

/**
 * In development every API call is answered by MSW (src/mocks), so the console
 * runs with no backend. Children render only once the worker is ready, or the
 * first requests would race past it to the real API.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [ready, setReady] = useState(!mocking);
  const markReady = useCallback(() => setReady(true), []);

  return (
    <>
      {MockWorker && !ready && <MockWorker onReady={markReady} />}
      {ready && (
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NuqsAdapter>
      )}
    </>
  );
}
