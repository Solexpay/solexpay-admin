import { Directive, ElementRef, Input, inject } from "@angular/core";

@Directive({
  selector: "[highlightNew]",
  standalone: true,
})
export class HighlightNewDirective {
  private el = inject(ElementRef);

  @Input() set highlightNew(isNew: boolean) {
    if (isNew) {
      this.triggerHighlight();
    }
  }

  @Input() highlightDelay = 0;

  private triggerHighlight() {
    setTimeout(() => {
      const element = this.el.nativeElement;
      element.classList.add("animate-highlight");

      setTimeout(() => {
        element.classList.remove("animate-highlight");
      }, 1500);
    }, this.highlightDelay);
  }
}
