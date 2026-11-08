import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  output,
} from "@angular/core";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open dialogs, innermost last, so Escape only closes the top one. */
const stack: ModalDirective[] = [];

/**
 * Dialog behaviour for a `.ui-modal` element:
 * - Escape emits `uiModalClose` (only for the topmost dialog);
 * - focus moves into the dialog (a [data-autofocus] child first), Tab stays
 *   inside it, and focus returns to the opener when it closes;
 * - the page behind stops scrolling while any dialog is open;
 * - the dialog is labelled by its `.ui-modal-title`.
 *
 *   <div class="ui-modal" role="dialog" aria-modal="true"
 *        uiModal (uiModalClose)="close()">
 */
@Directive({
  selector: "[uiModal]",
  host: {
    tabindex: "-1",
    // On the document so Escape works even after a click on the backdrop.
    "(document:keydown)": "onKeydown($event)",
  },
})
export class ModalDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private opener: HTMLElement | null = null;

  uiModalClose = output<void>();

  ngOnInit() {
    const host = this.el.nativeElement;
    this.opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    stack.push(this);
    if (stack.length === 1) lockScroll(true);

    const title = host.querySelector<HTMLElement>(".ui-modal-title");
    if (title && !host.hasAttribute("aria-labelledby")) {
      title.id ||= `modal-title-${Math.random().toString(36).slice(2, 9)}`;
      host.setAttribute("aria-labelledby", title.id);
    }

    // Wait a frame so @if content inside the dialog has rendered.
    requestAnimationFrame(() => {
      const target =
        host.querySelector<HTMLElement>("[data-autofocus]") ??
        this.focusables().find((el) => !el.closest(".ui-modal-head")) ??
        host;
      target.focus();
    });
  }

  ngOnDestroy() {
    const i = stack.indexOf(this);
    if (i >= 0) stack.splice(i, 1);
    if (stack.length === 0) lockScroll(false);
    if (this.opener?.isConnected) this.opener.focus();
  }

  onKeydown(event: KeyboardEvent) {
    if (stack[stack.length - 1] !== this) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.uiModalClose.emit();
      return;
    }
    if (event.key !== "Tab") return;
    const items = this.focusables();
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (!this.el.nativeElement.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => !el.closest("[hidden]"));
  }
}

/** The console scrolls inside <main>, so lock that as well as the body. */
function lockScroll(locked: boolean) {
  const value = locked ? "hidden" : "";
  document.body.style.overflow = value;
  const main = document.querySelector("main");
  if (main) main.style.overflow = value;
}
