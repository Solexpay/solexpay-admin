"use client";

import { useEffect } from "react";

/**
 * Starts the MSW browser worker. Loaded only in development, and only on the
 * client (next/dynamic with ssr: false): msw/browser has no Node export, so it
 * must never be pulled into the server render.
 */
// Strict Mode runs effects twice in development; MSW must start only once.
let started: Promise<unknown> | undefined;

export default function MockWorker({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let cancelled = false;
    started ??= import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledFrame: "bypass", quiet: true }),
    );
    void started.then(() => {
      if (!cancelled) onReady();
    });
    return () => {
      cancelled = true;
    };
  }, [onReady]);
  return null;
}
