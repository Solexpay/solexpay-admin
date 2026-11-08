import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

const DURATION_MS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};

const MAX_TOASTS = 4;

interface ToastTimer {
  handle: ReturnType<typeof setTimeout>;
  endsAt: number;
  left: number;
}

let toasts: Toast[] = [];
const timers = new Map<string, ToastTimer>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function schedule(id: string, ms: number): void {
  const old = timers.get(id);
  if (old) {
    clearTimeout(old.handle);
  }

  timers.set(id, {
    handle: setTimeout(() => {
      dismiss(id);
    }, ms),
    endsAt: Date.now() + ms,
    left: ms,
  });
}

function show(type: ToastType, message: string, action?: ToastAction): string {
  const existing = toasts.find((t) => t.type === type && t.message === message);
  if (existing) {
    schedule(existing.id, DURATION_MS[type]);
    return existing.id;
  }

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  toasts = [...toasts, { id, type, message, action }].slice(-MAX_TOASTS);
  schedule(id, DURATION_MS[type]);
  emit();
  return id;
}

function dismiss(id: string): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer.handle);
    timers.delete(id);
  }
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
}

function pause(id: string): void {
  const timer = timers.get(id);
  if (!timer || timer.endsAt < 0) {
    return;
  }
  clearTimeout(timer.handle);
  timer.left = Math.max(0, timer.endsAt - Date.now());
  timer.endsAt = -1;
}

function resume(id: string): void {
  const timer = timers.get(id);
  if (!timer || timer.endsAt >= 0) {
    return;
  }
  schedule(id, Math.max(timer.left, 1500));
}

function runAction(toastItem: Toast): void {
  toastItem.action?.run();
  dismiss(toastItem.id);
}

function clear(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer.handle);
  }
  timers.clear();
  if (toasts.length > 0) {
    toasts = [];
    emit();
  }
}

export const toast = {
  show,
  success: (message: string, action?: ToastAction): string =>
    show("success", message, action),
  error: (message: string, action?: ToastAction): string =>
    show("error", message, action),
  info: (message: string, action?: ToastAction): string =>
    show("info", message, action),
  dismiss,
  pause,
  resume,
  runAction,
  clear,
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Toast[] {
  return toasts;
}

const SERVER_SNAPSHOT: Toast[] = [];

function getServerSnapshot(): Toast[] {
  return SERVER_SNAPSHOT;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
