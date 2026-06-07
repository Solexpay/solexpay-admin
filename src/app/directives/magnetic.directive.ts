import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  inject,
} from "@angular/core";

@Directive({
  selector: "[magnetic]",
  standalone: true,
})
export class MagneticDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseLeave: (() => void) | null = null;

  ngOnInit() {
    const element = this.el.nativeElement;
    const strength = 0.3;

    this.unlistenMouseMove = this.renderer.listen(
      element,
      "mousemove",
      (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        element.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      },
    );

    this.unlistenMouseLeave = this.renderer.listen(
      element,
      "mouseleave",
      () => {
        element.style.transform = "translate(0, 0)";
        element.style.transition =
          "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
      },
    );

    this.renderer.listen(element, "mouseenter", () => {
      element.style.transition = "transform 0.1s ease-out";
    });
  }

  ngOnDestroy() {
    if (this.unlistenMouseMove) this.unlistenMouseMove();
    if (this.unlistenMouseLeave) this.unlistenMouseLeave();
  }
}
