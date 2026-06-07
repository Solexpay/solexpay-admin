import { Injectable, signal } from "@angular/core";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: Toast["type"], message: string) {
    const id = crypto.randomUUID();
    this.toasts.update((t) => [...t, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: string) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
