import { Directive, ElementRef, Input, OnInit, inject } from "@angular/core";

type PulseType = "ring" | "soft";

@Directive({
  selector: "[pulseAnimation]",
  standalone: true,
})
export class PulseAnimationDirective implements OnInit {
  private el = inject(ElementRef);

  @Input() pulseAnimation: PulseType | "true" = "ring";
  @Input() pulseColor = "#005bbf";

  ngOnInit() {
    const element = this.el.nativeElement;
    const type = this.pulseAnimation === "true" ? "ring" : this.pulseAnimation;

    if (type === "ring") {
      element.classList.add("animate-pulse-ring");
      if (this.pulseColor) {
        element.style.setProperty("--pulse-color", this.pulseColor);
      }
    } else {
      element.classList.add("animate-pulse-soft");
    }
  }
}
