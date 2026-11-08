import { Component, Input } from "@angular/core";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";

/**
 * Top of every console page: a breadcrumb row (icon, section name, optional
 * meta on the right) above the page title and its actions.
 *
 *   <app-page-header title="Users" [icon]="UsersIcon" meta="Updated 2m ago">
 *     <button class="ui-btn">Export</button>
 *   </app-page-header>
 */
@Component({
  selector: "app-page-header",
  imports: [LucideDynamicIcon],
  template: `
    <header class="mb-5">
      <div class="flex items-center justify-between gap-3 text-[13px]">
        <div class="flex min-w-0 items-center gap-2 text-ui-body">
          @if (icon) {
            <svg [lucideIcon]="icon" [size]="16" class="text-ui-muted"></svg>
          }
          <span class="truncate">{{ crumb || title }}</span>
        </div>
        @if (meta) {
          <span class="ui-meta hidden shrink-0 sm:inline">{{ meta }}</span>
        }
      </div>
      <div
        class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <h1 class="text-xl font-semibold tracking-tight text-ui-ink">
            {{ title }}
          </h1>
          @if (subtitle) {
            <p class="mt-0.5 text-[13px] text-ui-muted">{{ subtitle }}</p>
          }
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ng-content />
        </div>
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() crumb = "";
  @Input() subtitle = "";
  @Input() meta = "";
  @Input() icon?: LucideIcon;
}
