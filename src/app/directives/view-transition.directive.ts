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
  selector: "[viewTransition]",
  standalone: true,
})
export class ViewTransitionDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() viewTransition = "default";
  @Input() transitionDuration = 300;

  private unlistenRouteChange: (() => void) | null = null;

  ngOnInit() {
    const element = this.el.nativeElement;

    // Set view transition name for CSS
    element.style.viewTransitionName = this.viewTransition;

    // Add transition styles
    this.renderer.setStyle(
      element,
      "transition",
      `all ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    );

    // Handle enter animation
    this.animateIn(element);
  }

  private animateIn(element: HTMLElement) {
    // Set initial state
    this.renderer.setStyle(element, "opacity", "0");
    this.renderer.setStyle(
      element,
      "transform",
      "translateY(10px) scale(0.98)",
    );

    // Trigger animation
    requestAnimationFrame(() => {
      this.renderer.setStyle(element, "opacity", "1");
      this.renderer.setStyle(element, "transform", "translateY(0) scale(1)");
    });
  }

  ngOnDestroy() {
    if (this.unlistenRouteChange) {
      this.unlistenRouteChange();
    }
  }
}
