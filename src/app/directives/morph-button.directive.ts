import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";

@Directive({
  selector: "[morphButton]",
  standalone: true,
})
export class MorphButtonDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private unlistenClick: (() => void) | null = null;
  private originalContent = "";
  private originalWidth = "";

  @Input() morphButton: "loading" | "success" | "error" | null = null;
  @Input() morphDuration = 2000;

  ngOnInit() {
    const element = this.el.nativeElement;
    this.originalContent = element.innerHTML;
    this.originalWidth = element.style.width;

    this.unlistenClick = this.renderer.listen(element, "click", () => {
      if (this.morphButton === "loading") {
        this.morphToLoading(element);
      }
    });
  }

  @Input() set morphState(state: "loading" | "success" | "error" | null) {
    const element = this.el.nativeElement;

    if (state === "loading") {
      this.morphToLoading(element);
    } else if (state === "success") {
      this.morphToSuccess(element);
    } else if (state === "error") {
      this.morphToError(element);
    } else if (state === null) {
      this.restoreOriginal(element);
    }
  }

  private morphToLoading(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;

    element.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;
    element.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.borderRadius = "50%";
    element.style.width = "44px";
    element.style.padding = "0";
    element.style.display = "flex";
    element.style.alignItems = "center";
    element.style.justifyContent = "center";
  }

  private morphToSuccess(element: HTMLElement) {
    element.innerHTML = `
      <svg class="h-5 w-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `;
    element.style.backgroundColor = "#00c853";

    setTimeout(() => {
      this.restoreOriginal(element);
    }, 1500);
  }

  private morphToError(element: HTMLElement) {
    element.innerHTML = `
      <svg class="h-5 w-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    element.style.backgroundColor = "#ff1744";
    element.classList.add("animate-shake");

    setTimeout(() => {
      element.classList.remove("animate-shake");
      this.restoreOriginal(element);
    }, 1500);
  }

  private restoreOriginal(element: HTMLElement) {
    element.style.width = this.originalWidth;
    element.style.height = "";
    element.style.borderRadius = "";
    element.style.padding = "";
    element.style.display = "";
    element.style.alignItems = "";
    element.style.justifyContent = "";
    element.style.backgroundColor = "";
    element.innerHTML = this.originalContent;

    // Re-apply ripple if exists
    if (element.hasAttribute("solexRipple")) {
      element.setAttribute("solexRipple", "");
    }
  }

  ngOnDestroy() {
    if (this.unlistenClick) this.unlistenClick();
  }
}
