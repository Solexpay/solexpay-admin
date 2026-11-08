import { Component, computed, effect, inject, signal } from "@angular/core";
import {
  LucideDynamicIcon,
  LucideTriangleAlert as TriangleAlert,
  LucideX as X,
} from "@lucide/angular";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";

/** Renders ConfirmService requests. Mounted once, in the admin layout. */
@Component({
  selector: "app-confirm-dialog",
  imports: [LucideDynamicIcon, ModalDirective],
  template: `
    @if (confirm.current(); as req) {
      <div class="ui-overlay z-60">
        <div class="ui-backdrop" aria-hidden="true" (click)="cancel()"></div>
        <form
          class="ui-modal sm:max-w-md"
          role="alertdialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="cancel()"
          (submit)="$event.preventDefault(); accept()"
        >
          <div class="ui-modal-head">
            <div class="flex min-w-0 items-center gap-2">
              @if (req.tone === "danger") {
                <svg
                  [lucideIcon]="TriangleAlertIcon"
                  [size]="18"
                  class="shrink-0 text-ui-danger"
                ></svg>
              }
              <h2 class="ui-modal-title">{{ req.title }}</h2>
            </div>
            <button
              type="button"
              class="ui-icon-btn"
              aria-label="Cancel"
              (click)="cancel()"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body space-y-4">
            @if (req.message) {
              <p class="text-sm text-ui-body">{{ req.message }}</p>
            }
            @if (req.reasonLabel) {
              <div>
                <label for="confirm-reason" class="ui-label">
                  {{ req.reasonLabel }}
                  @if (reasonRequired()) {
                    <span class="text-ui-danger" aria-hidden="true">*</span>
                  }
                </label>
                <textarea
                  id="confirm-reason"
                  class="ui-input"
                  rows="3"
                  maxlength="500"
                  data-autofocus
                  [placeholder]="req.reasonPlaceholder ?? ''"
                  [value]="reason()"
                  (input)="reason.set($any($event.target).value)"
                  (keydown.control.enter)="accept()"
                  (keydown.meta.enter)="accept()"
                ></textarea>
              </div>
            }
            @if (req.typeToConfirm) {
              <div>
                <label for="confirm-typed" class="ui-label">
                  Type
                  <span class="font-mono font-semibold text-ui-ink">{{
                    req.typeToConfirm
                  }}</span>
                  to confirm
                </label>
                <input
                  id="confirm-typed"
                  class="ui-input font-mono"
                  autocomplete="off"
                  spellcheck="false"
                  [attr.data-autofocus]="req.reasonLabel ? null : ''"
                  [value]="typed()"
                  (input)="typed.set($any($event.target).value)"
                />
              </div>
            }
          </div>

          <div class="ui-modal-foot">
            <button type="button" class="ui-btn" (click)="cancel()">
              Cancel
            </button>
            <button
              type="submit"
              class="ui-btn"
              [class.ui-btn-danger]="req.tone === 'danger'"
              [class.ui-btn-primary]="req.tone !== 'danger'"
              [disabled]="!canConfirm()"
              [attr.data-autofocus]="
                req.reasonLabel || req.typeToConfirm ? null : ''
              "
            >
              {{ req.confirmLabel ?? "Confirm" }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  confirm = inject(ConfirmService);

  readonly TriangleAlertIcon = TriangleAlert;
  readonly XIcon = X;

  reason = signal("");
  typed = signal("");

  reasonRequired = computed(() => {
    const req = this.confirm.current();
    return !!req?.reasonLabel && req.reasonRequired !== false;
  });

  canConfirm = computed(() => {
    const req = this.confirm.current();
    if (!req) return false;
    if (this.reasonRequired() && !this.reason().trim()) return false;
    if (req.typeToConfirm && this.typed().trim() !== req.typeToConfirm) {
      return false;
    }
    return true;
  });

  constructor() {
    // Start every request with empty fields.
    effect(() => {
      this.confirm.current();
      this.reason.set("");
      this.typed.set("");
    });
  }

  accept() {
    if (!this.canConfirm()) return;
    this.confirm.current()?.resolve({ reason: this.reason().trim() });
  }

  cancel() {
    this.confirm.current()?.resolve(null);
  }
}
