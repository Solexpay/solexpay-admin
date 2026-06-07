import { Directive, ElementRef, Input, inject } from "@angular/core";

@Directive({
  selector: "[shakeOnError]",
  standalone: true,
})
export class ShakeOnErrorDirective {
  private el = inject(ElementRef);
  private isShaking = false;

  @Input() set shakeOnError(hasError: boolean) {
    if (hasError && !this.isShaking) {
      this.triggerShake();
    }
  }

  private triggerShake() {
    this.isShaking = true;
    const element = this.el.nativeElement;
    element.classList.add("animate-shake");

    setTimeout(() => {
      element.classList.remove("animate-shake");
      this.isShaking = false;
    }, 400);
  }
}
