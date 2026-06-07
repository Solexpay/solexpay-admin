import { Directive, HostListener } from "@angular/core";

@Directive({ selector: "[solexRipple]", standalone: true })
export class RippleDirective {
  @HostListener("click", ["$event"])
  onClick(e: MouseEvent) {
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
      background: rgba(255,255,255,0.25);
      animation: ripple 0.6s linear forwards;
      pointer-events: none;
    `;
    button.style.position = "relative";
    button.style.overflow = "hidden";
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
}
