import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  LucideDynamicIcon,
  LucideIcon,
  LucideArrowDown as ArrowDown,
  LucideArrowUp as ArrowUp,
} from "@lucide/angular";

/**
 * A quick-stat card: label with an icon tile, then the value in a sunken box
 * with an optional trend and hint underneath. Put several in a ui-panel.
 */
@Component({
  selector: "app-metric-card",
  imports: [CommonModule, LucideDynamicIcon],
  template: `
    <div class="rounded-xl border border-ui-line bg-white p-1.5">
      <div class="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        @if (icon) {
          <span class="ui-icon-tile h-6 w-6 rounded-md">
            <svg [lucideIcon]="icon" [size]="14"></svg>
          </span>
        }
        <p class="truncate text-[13px] text-ui-muted">{{ label }}</p>
      </div>
      <div class="rounded-lg bg-ui-sunken px-3 py-3">
        <p
          class="truncate text-xl font-semibold tabular-nums text-ui-ink"
          [title]="(prefix || '') + (value | number: '1.0-0' : 'en-NG')"
        >
          {{ prefix }}{{ compactValue(value) }}{{ suffix }}
        </p>
        @if (trend !== undefined || hint) {
          <div class="mt-2 flex min-w-0 items-center gap-1.5 text-[11px]">
            @if (trend !== undefined) {
              <span
                class="inline-flex h-4 w-4 items-center justify-center rounded-full text-white"
                [class]="trend >= 0 ? 'bg-ui-success' : 'bg-ui-danger'"
              >
                <svg
                  [lucideIcon]="trend >= 0 ? ArrowUpIcon : ArrowDownIcon"
                  [size]="10"
                ></svg>
              </span>
              <span
                class="font-medium tabular-nums"
                [class]="trend >= 0 ? 'text-ui-success' : 'text-ui-danger'"
              >
                {{ trend >= 0 ? "+" : "" }}{{ trend | number: "1.0-1" }}%
              </span>
            }
            @if (hint) {
              <span class="truncate text-ui-muted">{{ hint }}</span>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  @Input() label!: string;
  @Input() value!: number;
  @Input() prefix = "";
  @Input() suffix = "";
  @Input() trend?: number;
  @Input() hint = "";
  @Input() icon?: LucideIcon;

  readonly ArrowUpIcon = ArrowUp;
  readonly ArrowDownIcon = ArrowDown;

  compactValue(value: number): string {
    if (!Number.isFinite(value)) return "0";
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
    return Math.round(value).toLocaleString("en-NG");
  }
}
