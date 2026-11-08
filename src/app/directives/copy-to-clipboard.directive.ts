import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  inject,
  OnInit,
} from "@angular/core";
import { ToastService } from "../services/toast.service";

/**
 * Copies on click, Enter or Space. Pass the exact value when the element
 * shows a label or a masked form of it:
 *
 *   <p [copyToClipboard]="user.id">ID: {{ user.id }}</p>
 */
@Directive({
  selector: "[copyToClipboard]",
  standalone: true,
  host: {
    role: "button",
    tabindex: "0",
  },
})
export class CopyToClipboardDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private toast = inject(ToastService);

  @Input("copyToClipboard") customText: string | null = null;

  private isCopied = false;

  ngOnInit() {
    const element = this.el.nativeElement;
    this.renderer.setStyle(element, "cursor", "pointer");

    const copy = (event: Event) => {
      event.stopPropagation(); // Prevent trigger parent click events (like accordion toggle)
      const textToCopy = this.customText || element.textContent?.trim() || "";
      if (textToCopy) {
        this.copyToClipboard(textToCopy);
      }
    };

    this.renderer.listen(element, "click", copy);
    this.renderer.listen(element, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        copy(event);
      }
    });
  }

  private async copyToClipboard(text: string) {
    if (this.isCopied) return;

    try {
      await navigator.clipboard.writeText(text);
      this.isCopied = true;

      // Visual feedback
      const element = this.el.nativeElement;
      element.classList.add("animate-copy-feedback");

      // Show toast
      this.toast.show("success", "Copied to clipboard!");

      setTimeout(() => {
        element.classList.remove("animate-copy-feedback");
        this.isCopied = false;
      }, 300);
    } catch {
      this.toast.show("error", "Failed to copy");
    }
  }
}
