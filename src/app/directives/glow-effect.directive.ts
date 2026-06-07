import { Directive, ElementRef, Input, OnInit, inject } from "@angular/core";

@Directive({
  selector: "[glowEffect]",
  standalone: true,
})
export class GlowEffectDirective implements OnInit {
  private el = inject(ElementRef);

  @Input() glowEffect: "true" | "hover" | "always" = "always";
  @Input() glowColor = "#005bbf";

  ngOnInit() {
    const element = this.el.nativeElement;

    if (this.glowEffect === "always") {
      element.classList.add("animate-glow");
    } else if (this.glowEffect === "hover") {
      element.addEventListener("mouseenter", () => {
        element.classList.add("animate-glow");
      });
      element.addEventListener("mouseleave", () => {
        element.classList.remove("animate-glow");
      });
    }

    // Set custom glow color if provided
    if (this.glowColor) {
      element.style.setProperty("--glow-color", this.glowColor);
    }
  }
}
