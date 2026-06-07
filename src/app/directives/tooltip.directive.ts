import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  OnInit,
  inject,
} from "@angular/core";

@Directive({
  selector: "[tooltip]",
  standalone: true,
})
export class TooltipDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltipElement: HTMLElement | null = null;

  @Input() tooltip = "";
  @Input() tooltipPosition: "top" | "bottom" | "left" | "right" = "top";
  @Input() tooltipDelay = 300;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    const element = this.el.nativeElement;

    this.renderer.listen(element, "mouseenter", () => {
      this.timeoutId = setTimeout(() => this.showTooltip(), this.tooltipDelay);
    });

    this.renderer.listen(element, "mouseleave", () => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.hideTooltip();
    });

    this.renderer.listen(element, "focus", () => this.showTooltip());
    this.renderer.listen(element, "blur", () => this.hideTooltip());
  }

  private showTooltip() {
    if (!this.tooltip || this.tooltipElement) return;

    const tooltip = this.renderer.createElement("div");
    this.renderer.appendChild(tooltip, this.renderer.createText(this.tooltip));

    // Base styles
    this.renderer.setStyle(tooltip, "position", "fixed");
    this.renderer.setStyle(tooltip, "background", "#191c1d");
    this.renderer.setStyle(tooltip, "color", "#ffffff");
    this.renderer.setStyle(tooltip, "padding", "6px 12px");
    this.renderer.setStyle(tooltip, "border-radius", "6px");
    this.renderer.setStyle(tooltip, "font-size", "12px");
    this.renderer.setStyle(tooltip, "font-weight", "500");
    this.renderer.setStyle(tooltip, "white-space", "nowrap");
    this.renderer.setStyle(tooltip, "z-index", "1000");
    this.renderer.setStyle(tooltip, "pointer-events", "none");
    this.renderer.setStyle(tooltip, "opacity", "0");
    this.renderer.addClass(tooltip, "animate-tooltip-in");

    if (!tooltip) return;

    document.body.appendChild(tooltip);
    this.tooltipElement = tooltip;

    // Position
    const rect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case "top":
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, "top", `${top}px`);
    this.renderer.setStyle(this.tooltipElement, "left", `${left}px`);
    this.renderer.setStyle(this.tooltipElement, "opacity", "1");
  }

  private hideTooltip() {
    if (this.tooltipElement) {
      document.body.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}
