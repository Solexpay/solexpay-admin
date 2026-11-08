"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  __installTelemetryLifecycle,
  trackError,
  trackPageView,
} from "@/lib/telemetry";

export function AdminTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackError(event.error ?? event.message, {
        source: event.filename ?? "",
        line: String(event.lineno),
        column: String(event.colno),
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(event.reason, { source: "unhandledrejection" });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    const cleanupLifecycle = __installTelemetryLifecycle();
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      cleanupLifecycle();
    };
  }, []);

  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  return null;
}
