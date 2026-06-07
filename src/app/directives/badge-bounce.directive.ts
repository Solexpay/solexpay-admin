import { Directive, ElementRef, Input, inject } from "@angular/core";

@Directive({
  selector: "[badgeBounce]",
  standalone: true,
})
export class BadgeBounceDirective {
  private el = inject(ElementRef);
  private hasBounced = false;

  @Input() set badgeBounce(trigger: number | boolean) {
    if (trigger && !this.hasBounced) {
      this.triggerBounce();
      this.hasBounced = true;
    }
  }

  private triggerBounce() {
    const element = this.el.nativeElement;
    element.classList.remove("animate-badge-bounce");

    // Force reflow
    void element.offsetWidth;

    element.classList.add("animate-badge-bounce");

    setTimeout(() => {
      element.classList.remove("animate-badge-bounce");
      this.hasBounced = false;
    }, 500);
  }
}
