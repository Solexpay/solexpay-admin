import {
  Directive,
  ElementRef,
  Input,
  SimpleChanges,
  inject,
  OnChanges,
} from "@angular/core";

@Directive({ selector: "[countUp]", standalone: true })
export class CountUpDirective implements OnChanges {
  @Input() countUp = 0;
  @Input() duration = 1200;
  @Input() prefix = "";
  @Input() suffix = "";
  @Input() compact = false;

  private el = inject(ElementRef);
  private hasAnimated = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes["countUp"] && !this.hasAnimated) {
      this.hasAnimated = true;
      this.animate();
    }
  }

  private format(value: number): string {
    if (this.compact) {
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return `${Math.round(value)}`;
    }
    return Math.floor(value).toLocaleString("en-NG");
  }

  private animate() {
    const start = performance.now();
    const target = this.countUp;
    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / this.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.el.nativeElement.textContent =
        this.prefix + this.format(eased * target) + this.suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}
