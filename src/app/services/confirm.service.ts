import { Injectable, signal } from "@angular/core";

export interface ConfirmOptions {
  title: string;
  /** One or two sentences on what will happen. */
  message?: string;
  confirmLabel?: string;
  /** "danger" for anything that blocks, removes or cannot be undone. */
  tone?: "danger" | "primary";
  /** Ask for a reason; it is returned in the result. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Defaults to true when reasonLabel is set. */
  reasonRequired?: boolean;
  /** For the riskiest actions: the admin must type this text exactly. */
  typeToConfirm?: string;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (result: ConfirmResult | null) => void;
}

export interface ConfirmResult {
  /** Trimmed reason, or "" when none was asked for. */
  reason: string;
}

/**
 * One confirm dialog for the whole console (rendered by the admin layout).
 *
 *   const ok = await this.confirm.ask({
 *     title: "Suspend Ada Obi?", tone: "danger", confirmLabel: "Suspend",
 *     reasonLabel: "Reason (shown to compliance)",
 *   });
 *   if (!ok) return;
 *   this.suspend.mutate({ id, reason: ok.reason });
 */
@Injectable({ providedIn: "root" })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(options: ConfirmOptions): Promise<ConfirmResult | null> {
    // A second request replaces the first; the first resolves as cancelled.
    this.current()?.resolve(null);
    return new Promise((resolve) => {
      this.current.set({
        ...options,
        resolve: (result) => {
          this.current.set(null);
          resolve(result);
        },
      });
    });
  }
}
