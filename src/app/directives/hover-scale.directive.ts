import { Directive, ElementRef, Input, OnInit, inject } from "@angular/core";

type HoverScaleSize = "sm" | "md" | "lg";

@Directive({
  selector: "[hoverScale]",
  standalone: true,
})
export class HoverScaleDirective implements OnInit {
  private el = inject(ElementRef);

  @Input() hoverScale: HoverScaleSize | "true" = "md";
  @Input() hoverLift = false;

  ngOnInit() {
    const element = this.el.nativeElement;
    const size = this.hoverScale === "true" ? "md" : this.hoverScale;

    element.classList.add("hover-scale");

    if (size === "sm") {
      element.classList.add("hover-scale-sm");
    }

    if (this.hoverLift) {
      element.classList.add("hover-lift");
      element.classList.remove("hover-scale");
    }

    // Add cursor pointer for better UX
    element.style.cursor = "pointer";
  }
}
