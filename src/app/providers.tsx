"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useEffect, useState } from "react";

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
  const mocking = process.env.NODE_ENV === "development";
  const [ready, setReady] = useState(!mocking);

  useEffect(() => {
    if (!mocking) return;
    let cancelled = false;
    import("../mocks/browser").then(({ worker }) =>
      worker.start({ onUnhandledFrame: "bypass", quiet: true }).then(() => {
        if (!cancelled) setReady(true);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [mocking]);

  if (!ready) return null;
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  );
}
