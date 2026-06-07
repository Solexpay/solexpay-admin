import { Directive, ElementRef, Input, inject } from "@angular/core";

@Directive({
  selector: "[bounceOn]",
  standalone: true,
})
export class BounceOnDirective {
  private el = inject(ElementRef);
  private isBouncing = false;

  @Input() set bounceOn(trigger: boolean) {
    if (trigger && !this.isBouncing) {
      this.triggerBounce();
    }
  }

  @Input() bounceType: "bounce" | "bounce-in" = "bounce";

  private triggerBounce() {
    this.isBouncing = true;
    const element = this.el.nativeElement;
    const animationClass =
      this.bounceType === "bounce-in" ? "animate-bounce-in" : "animate-bounce";

    element.classList.add(animationClass);

    setTimeout(
      () => {
        element.classList.remove(animationClass);
        this.isBouncing = false;
      },
      this.bounceType === "bounce-in" ? 500 : 600,
    );
  }
}
