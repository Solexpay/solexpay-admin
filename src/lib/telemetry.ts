import { API_BASE } from "./api-base";
import { getAccessToken } from "./auth/session";

export type ClientEvent = {
  type: "page_view" | "error" | "action";
  path: string;
  at: string;
  name?: string;
  message?: string;
  stack?: string;
  detail?: Record<string, string | number | boolean>;
};

type QueuedEvent = { event: ClientEvent; retries: number };

const MAX_QUEUE_SIZE = 200;
const BATCH_SIZE = 50;
const FLUSH_THRESHOLD = 20;
const MAX_DETAIL_KEYS = 20;
const queue: QueuedEvent[] = [];
let enabledForTests = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let flushInFlight = false;
let lastError: { signature: string; at: number } | null = null;

function active(): boolean {
  return (
    typeof window !== "undefined" &&
    (process.env.NODE_ENV !== "test" || enabledForTests)
  );
}

function truncate(value: string, limit: number): string {
  return value.slice(0, limit);
}

function safePath(path: string): string {
  let pathname = path;
  try {
    if (/^https?:\/\//i.test(path)) pathname = new URL(path).pathname;
    else pathname = path.split(/[?#]/, 1)[0] ?? "/";
  } catch {
    pathname = path.split(/[?#]/, 1)[0] ?? "/";
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return truncate(pathname, 256);
}

function currentPath(): string {
  return typeof window === "undefined"
    ? "/"
    : safePath(window.location.pathname);
}

function normalizeDetail(
  detail?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!detail) return undefined;
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(detail).slice(0, MAX_DETAIL_KEYS)) {
    if (typeof value === "string")
      result[truncate(key, 64)] = truncate(value, 200);
    else if (typeof value === "number" || typeof value === "boolean")
      result[truncate(key, 64)] = value;
  }
  return result;
}

function makeEvent(
  type: ClientEvent["type"],
  options: Omit<ClientEvent, "type" | "path" | "at"> & { path?: string } = {},
): ClientEvent {
  const event: ClientEvent = {
    type,
    path: safePath(options.path ?? currentPath()),
    at: new Date().toISOString(),
  };
  if (options.name !== undefined) event.name = truncate(options.name, 64);
  if (options.message !== undefined)
    event.message = truncate(options.message, 500);
  if (options.stack !== undefined) event.stack = truncate(options.stack, 4000);
  const detail = normalizeDetail(options.detail);
  if (detail && Object.keys(detail).length > 0) event.detail = detail;
  return event;
}

function enqueue(event: ClientEvent): void {
  if (!active()) return;
  queue.push({ event, retries: 0 });
  if (queue.length > MAX_QUEUE_SIZE)
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  ensureFlushTimer();
  if (queue.length >= FLUSH_THRESHOLD) void flush();
}

function ensureFlushTimer(): void {
  if (!active() || intervalId !== null) return;
  intervalId = setInterval(() => void flush(), 10_000);
}

export function trackPageView(path: string): void {
  enqueue(makeEvent("page_view", { path }));
}

export function trackError(
  error: unknown,
  context?: Record<string, string>,
): void {
  if (!active()) return;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unknown client error occurred";
  const stack = error instanceof Error ? error.stack : undefined;
  const detail = context ? normalizeDetail(context) : undefined;
  const signature = JSON.stringify([message, stack ?? "", detail ?? {}]);
  const now = Date.now();
  if (lastError?.signature === signature && now - lastError.at <= 5_000) return;
  lastError = { signature, at: now };
  enqueue(makeEvent("error", { message, stack, detail }));
}

export function trackAction(
  name: string,
  detail?: Record<string, string | number | boolean>,
): void {
  enqueue(makeEvent("action", { name, detail }));
}

export function trackExport(input: {
  resource: string;
  rows: number;
  filters: Record<string, string | number | boolean>;
}): void {
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.filters))
    filters[key] = String(value);
  trackAction("export", {
    resource: input.resource,
    rows: input.rows,
    ...filters,
  });
}

async function flush(): Promise<void> {
  if (!active() || flushInFlight || queue.length === 0) return;
  let token: string | null;
  try {
    token = getAccessToken();
  } catch {
    return;
  }
  if (!token) return;
  flushInFlight = true;
  try {
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      try {
        const response = await fetch(`${API_BASE}/admin/client-events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ events: batch.map(({ event }) => event) }),
          keepalive: true,
        });
        if (!response.ok) retry(batch);
      } catch {
        retry(batch);
      }
    }
  } catch {
    // Telemetry must never affect the admin UI.
  } finally {
    flushInFlight = false;
  }
}

function retry(batch: QueuedEvent[]): void {
  const retriable = batch
    .filter((item) => item.retries < 1)
    .map((item) => ({ ...item, retries: item.retries + 1 }));
  if (retriable.length === 0) return;
  queue.unshift(...retriable);
  if (queue.length > MAX_QUEUE_SIZE)
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
}

function flushWhenHidden(): void {
  if (typeof document !== "undefined" && document.visibilityState === "hidden")
    void flush();
}

function flushOnPageHide(): void {
  void flush();
}

export function __setTelemetryEnabledForTests(enabled: boolean): void {
  enabledForTests = enabled;
  if (!enabled) {
    queue.length = 0;
    lastError = null;
    flushInFlight = false;
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = null;
  }
}

export function __installTelemetryLifecycle(): () => void {
  if (!active()) return () => undefined;
  ensureFlushTimer();
  document.addEventListener("visibilitychange", flushWhenHidden);
  window.addEventListener("pagehide", flushOnPageHide);
  return () => {
    document.removeEventListener("visibilitychange", flushWhenHidden);
    window.removeEventListener("pagehide", flushOnPageHide);
  };
}
