import { Injectable, signal } from "@angular/core";

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: ToastAction;
}

/** Errors stay long enough to read; the rest clear quickly. */
const DURATION_MS: Record<Toast["type"], number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};
const MAX_TOASTS = 4;

@Injectable({ providedIn: "root" })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private timers = new Map<
    string,
    { handle: ReturnType<typeof setTimeout>; endsAt: number; left: number }
  >();

  show(type: Toast["type"], message: string, action?: ToastAction) {
    // The same message twice in a row only refreshes the existing toast.
    const existing = this.toasts().find(
      (t) => t.type === type && t.message === message,
    );
    if (existing) {
      this.schedule(existing.id, DURATION_MS[type]);
      return existing.id;
    }

    const id = crypto.randomUUID();
    this.toasts.update((t) =>
      [...t, { id, type, message, action }].slice(-MAX_TOASTS),
    );
    this.schedule(id, DURATION_MS[type]);
    return id;
  }

  dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer.handle);
    this.timers.delete(id);
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  /** Hovering or focusing a toast holds it on screen. */
  pause(id: string) {
    const timer = this.timers.get(id);
    if (!timer || timer.endsAt < 0) return;
    clearTimeout(timer.handle);
    timer.left = Math.max(0, timer.endsAt - Date.now());
    timer.endsAt = -1;
  }

  resume(id: string) {
    const timer = this.timers.get(id);
    if (!timer || timer.endsAt >= 0) return;
    this.schedule(id, Math.max(timer.left, 1500));
  }

  runAction(toast: Toast) {
    toast.action?.run();
    this.dismiss(toast.id);
  }

  private schedule(id: string, ms: number) {
    const old = this.timers.get(id);
    if (old) clearTimeout(old.handle);
    this.timers.set(id, {
      handle: setTimeout(() => this.dismiss(id), ms),
      endsAt: Date.now() + ms,
      left: ms,
    });
  }
}
