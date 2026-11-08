import { Component, inject } from "@angular/core";
import {
  LucideDynamicIcon,
  LucideCircleAlert as CircleAlert,
  LucideCircleCheck as CircleCheck,
  LucideInfo as Info,
  LucideX as X,
} from "@lucide/angular";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-toast-outlet",
  imports: [LucideDynamicIcon],
  template: `
    <div
      class="pointer-events-none fixed right-4 top-4 z-100 flex flex-col gap-2 sm:bottom-6 sm:right-6 sm:top-auto"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          data-testid="toast"
          class="ui-toast pointer-events-auto flex w-[min(360px,calc(100vw-2rem))] items-start gap-2.5 rounded-xl border border-ui-line bg-white px-3.5 py-3 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]"
          animate.leave="ui-toast-leave"
          [class]="'toast-' + toast.type"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          (mouseenter)="toastService.pause(toast.id)"
          (mouseleave)="toastService.resume(toast.id)"
          (focusin)="toastService.pause(toast.id)"
          (focusout)="toastService.resume(toast.id)"
        >
          <svg
            [lucideIcon]="
              toast.type === 'success'
                ? CheckIcon
                : toast.type === 'error'
                  ? AlertIcon
                  : InfoIcon
            "
            [size]="18"
            class="mt-px"
            [class]="
              toast.type === 'success'
                ? 'text-ui-success'
                : toast.type === 'error'
                  ? 'text-ui-danger'
                  : 'text-ui-accent'
            "
          ></svg>
          <p class="flex-1 text-[13px] font-medium leading-5 text-ui-ink">
            {{ toast.message }}
          </p>
          @if (toast.action) {
            <button
              type="button"
              class="-my-1 shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-ui-accent hover:bg-ui-accent-soft"
              (click)="toastService.runAction(toast)"
            >
              {{ toast.action.label }}
            </button>
          }
          <button
            type="button"
            class="ui-icon-btn -mr-1 -mt-1 h-7 w-7"
            aria-label="Dismiss"
            (click)="toastService.dismiss(toast.id)"
          >
            <svg [lucideIcon]="XIcon" [size]="14"></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  toastService = inject(ToastService);

  readonly CheckIcon = CircleCheck;
  readonly AlertIcon = CircleAlert;
  readonly InfoIcon = Info;
  readonly XIcon = X;
}
