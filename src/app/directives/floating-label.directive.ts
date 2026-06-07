import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";

@Directive({
  selector: "[floatingLabel]",
  standalone: true,
})
export class FloatingLabelDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private unlistenFocus: (() => void) | null = null;
  private unlistenBlur: (() => void) | null = null;
  private unlistenInput: (() => void) | null = null;
  private label: HTMLElement | null = null;

  ngOnInit() {
    const input = this.el.nativeElement;
    const parent = input.parentElement;

    if (!parent) return;

    // Create floating label
    this.label = this.renderer.createElement("label");
    const placeholder = input.getAttribute("placeholder") || "";
    this.renderer.setProperty(this.label, "textContent", placeholder);

    // Style the label
    this.renderer.setStyle(this.label, "position", "absolute");
    this.renderer.setStyle(this.label, "left", "40px");
    this.renderer.setStyle(this.label, "top", "50%");
    this.renderer.setStyle(this.label, "transform", "translateY(-50%)");
    this.renderer.setStyle(this.label, "color", "#727785");
    this.renderer.setStyle(this.label, "fontSize", "14px");
    this.renderer.setStyle(this.label, "fontWeight", "500");
    this.renderer.setStyle(this.label, "pointerEvents", "none");
    this.renderer.setStyle(
      this.label,
      "transition",
      "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
    );
    this.renderer.setStyle(this.label, "background", "transparent");
    this.renderer.setStyle(this.label, "padding", "0 4px");

    // Insert label before input
    parent.insertBefore(this.label, input);

    // Remove placeholder from input
    input.removeAttribute("placeholder");

    // Add padding to input to accommodate label when floated
    input.style.paddingTop = "20px";
    input.style.paddingBottom = "8px";

    // Event listeners
    this.unlistenFocus = this.renderer.listen(input, "focus", () => {
      this.floatLabel(true);
    });

    this.unlistenBlur = this.renderer.listen(input, "blur", () => {
      if (!input.value) {
        this.floatLabel(false);
      }
    });

    this.unlistenInput = this.renderer.listen(input, "input", () => {
      if (input.value) {
        this.floatLabel(true);
      }
    });

    // Check initial value
    if (input.value) {
      this.floatLabel(true);
    }
  }

  private floatLabel(shouldFloat: boolean) {
    if (!this.label) return;

    if (shouldFloat) {
      this.renderer.setStyle(this.label, "top", "12px");
      this.renderer.setStyle(
        this.label,
        "transform",
        "translateY(0) scale(0.75)",
      );
      this.renderer.setStyle(this.label, "color", "#005bbf");
      this.renderer.setStyle(this.label, "left", "16px");
    } else {
      this.renderer.setStyle(this.label, "top", "50%");
      this.renderer.setStyle(
        this.label,
        "transform",
        "translateY(-50%) scale(1)",
      );
      this.renderer.setStyle(this.label, "color", "#727785");
      this.renderer.setStyle(this.label, "left", "40px");
    }
  }

  ngOnDestroy() {
    if (this.unlistenFocus) this.unlistenFocus();
    if (this.unlistenBlur) this.unlistenBlur();
    if (this.unlistenInput) this.unlistenInput();
  }
}
