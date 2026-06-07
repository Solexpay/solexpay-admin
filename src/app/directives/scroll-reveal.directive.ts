import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";

@Directive({
  selector: "[scrollReveal]",
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private observer: IntersectionObserver | null = null;

  ngOnInit() {
    const element = this.el.nativeElement;

    // Add initial state
    this.renderer.setStyle(element, "opacity", "0");
    this.renderer.setStyle(element, "transform", "translateY(24px)");
    this.renderer.setStyle(
      element,
      "transition",
      "opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.setStyle(element, "opacity", "1");
            this.renderer.setStyle(element, "transform", "translateY(0)");
            // Only animate once
            this.observer?.unobserve(element);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    this.observer.observe(element);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
