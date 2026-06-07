import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-shimmer-skeleton",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="shimmer-wrapper overflow-hidden relative"
      [class]="wrapperClass"
    >
      <ng-content></ng-content>
      <div class="shimmer absolute inset-0"></div>
    </div>
  `,
  styles: [
    `
      .shimmer-wrapper {
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.4) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .shimmer {
        background: linear-gradient(
          110deg,
          transparent 20%,
          rgba(255, 255, 255, 0.3) 40%,
          rgba(255, 255, 255, 0.5) 50%,
          rgba(255, 255, 255, 0.3) 60%,
          transparent 80%
        );
        animation: shimmer-diagonal 2s infinite;
      }

      @keyframes shimmer-diagonal {
        0% {
          transform: translateX(-100%) skewX(-15deg);
        }
        100% {
          transform: translateX(200%) skewX(-15deg);
        }
      }
    `,
  ],
})
export class ShimmerSkeletonComponent {
  @Input() wrapperClass = "";
}
