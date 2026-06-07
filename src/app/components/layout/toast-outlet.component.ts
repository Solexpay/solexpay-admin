import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-toast-outlet",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(25,28,29,0.12)]
                    animate-toast-in min-w-64 max-w-sm"
          [class]="{
            'bg-tertiary text-on-tertiary': toast.type === 'success',
            'bg-error text-on-error': toast.type === 'error',
            'bg-primary text-on-primary': toast.type === 'info',
          }"
        >
          <span
            class="material-symbols-outlined text-xl"
            style="font-variation-settings: 'FILL' 1"
          >
            {{
              toast.type === "success"
                ? "check_circle"
                : toast.type === "error"
                  ? "error"
                  : "info"
            }}
          </span>
          <p class="text-sm font-semibold flex-1">{{ toast.message }}</p>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="opacity-70 hover:opacity-100 transition-opacity"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  toastService = inject(ToastService);
}
