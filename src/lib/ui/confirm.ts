import { useSyncExternalStore } from "react";

export type ConfirmTone = "danger" | "primary";

export interface ConfirmOptions {
  title: string;
  /** One or two sentences on what will happen. */
  message?: string;
  confirmLabel?: string;
  /** "danger" for anything that blocks, removes or cannot be undone. */
  tone?: ConfirmTone;
  /** Ask for a reason; validated in dialog. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Defaults to true when reasonLabel is set. */
  reasonRequired?: boolean;
  /** For the riskiest actions: the admin must type this text exactly. */
  typeToConfirm?: string;
}

export interface ConfirmRequest extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

interface ConfirmState {
  current: ConfirmRequest | null;
  lastReason: string;
}

let state: ConfirmState = {
  current: null,
  lastReason: "",
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Trigger the console-wide confirm dialog.
 * Resolves to true if accepted, false if dismissed or cancelled.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  // A second request replaces the first; the first resolves as cancelled.
  if (state.current) {
    state.current.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `confirm-${Date.now()}`;

    state = {
      ...state,
      current: {
        ...options,
        id,
        resolve: (result: boolean) => {
          state = { ...state, current: null };
          emit();
          resolve(result);
        },
      },
    };
    emit();
  });
}

export function acceptConfirm(reason = ""): void {
  if (!state.current) return;
  state.lastReason = reason.trim();
  state.current.resolve(true);
}

export function cancelConfirm(): void {
  if (!state.current) return;
  state.current.resolve(false);
}

export function getLastConfirmReason(): string {
  return state.lastReason;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConfirmRequest | null {
  return state.current;
}

function getServerSnapshot(): ConfirmRequest | null {
  return null;
}

export function useConfirm(): {
  current: ConfirmRequest | null;
  accept: (reason?: string) => void;
  cancel: () => void;
} {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    current,
    accept: acceptConfirm,
    cancel: cancelConfirm,
  };
}
