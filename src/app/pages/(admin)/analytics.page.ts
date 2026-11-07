import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService } from "../../services/admin.service";

type WindowDays = 7 | 30 | 90;

@Component({
  selector: "app-product-analytics",
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="space-y-6">
      <header
        class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 class="text-2xl font-bold text-on-surface">Product usage</h1>
          <p class="mt-1 text-sm text-on-surface-variant">
            Aggregate app activity to guide feature improvements and roadmap
            decisions.
          </p>
        </div>
        <div class="flex gap-2" aria-label="Analytics date range">
          @for (window of windows; track window) {
            <button
              type="button"
              (click)="selectWindow(window)"
              [attr.aria-pressed]="days() === window"
              [class]="
                days() === window
                  ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary'
                  : 'rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high'
              "
            >
              {{ window }} days
            </button>
          }
        </div>
      </header>

      @if (query.isPending()) {
        <div
          class="rounded-xl bg-surface-container-lowest p-8 text-sm text-on-surface-variant"
          role="status"
        >
          Loading product metrics…
        </div>
      } @else if (query.isError()) {
        <div
          class="rounded-xl border border-error/30 bg-error/5 p-6 text-sm text-error"
          role="alert"
        >
          Product analytics could not be loaded. Your role must have access to
          aggregate usage analytics.
        </div>
      } @else {
        @if (data(); as usage) {
          <section
            class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Usage summary"
          >
            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <p class="text-sm text-on-surface-variant">Active users</p>
              <p class="mt-2 text-3xl font-bold text-on-surface">
                {{ usage.activeUsers ?? "—" }}
              </p>
              @if (
                usage.activeUsers === undefined || usage.activeUsers === null
              ) {
                <p class="mt-2 text-xs text-on-surface-variant">
                  Hidden until at least 10 users are in this cohort.
                </p>
              }
            </article>
            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <p class="text-sm text-on-surface-variant">
                Avg. successful logins / user
              </p>
              <p class="mt-2 text-3xl font-bold text-on-surface">
                {{
                  usage.avgLoginsPerActiveUser === undefined ||
                  usage.avgLoginsPerActiveUser === null
                    ? "—"
                    : (usage.avgLoginsPerActiveUser | number: "1.1-1")
                }}
              </p>
            </article>
            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <p class="text-sm text-on-surface-variant">
                Median foreground session
              </p>
              <p class="mt-2 text-3xl font-bold text-on-surface">
                {{ formatDuration(usage.medianForegroundSessionSeconds) }}
              </p>
            </article>
            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <p class="text-sm text-on-surface-variant">
                Average foreground session
              </p>
              <p class="mt-2 text-3xl font-bold text-on-surface">
                {{ formatDuration(usage.avgForegroundSessionSeconds) }}
              </p>
            </article>
          </section>

          <section class="grid gap-6 xl:grid-cols-2">
            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <h2 class="text-lg font-bold text-on-surface">
                Daily active users
              </h2>
              <p class="mb-5 mt-1 text-xs text-on-surface-variant">
                Days with fewer than 10 users are suppressed.
              </p>
              @if (usage.dailyActive.length === 0) {
                <p class="py-10 text-center text-sm text-on-surface-variant">
                  No reportable daily cohorts yet.
                </p>
              } @else {
                <div
                  class="flex h-44 items-end gap-1.5"
                  role="img"
                  aria-label="Daily active users bar chart"
                >
                  @for (point of usage.dailyActive; track point.date) {
                    <div
                      class="group flex h-full min-w-0 flex-1 flex-col justify-end"
                      [title]="
                        point.date + ': ' + point.users + ' active users'
                      "
                    >
                      <div
                        class="w-full rounded-t bg-primary/70"
                        [style.height.%]="
                          barHeight(point.users, usage.dailyActive)
                        "
                      ></div>
                      <span
                        class="mt-2 truncate text-center text-[10px] text-on-surface-variant"
                        >{{ point.date | date: "d/M" }}</span
                      >
                    </div>
                  }
                </div>
              }
            </article>

            <article
              class="rounded-xl bg-surface-container-lowest p-5 shadow-sm"
            >
              <h2 class="text-lg font-bold text-on-surface">Feature reach</h2>
              <p class="mb-5 mt-1 text-xs text-on-surface-variant">
                Unique users who opened each feature, within the selected
                period.
              </p>
              @if (usage.featureUsage.length === 0) {
                <p class="py-10 text-center text-sm text-on-surface-variant">
                  No feature cohort has reached 10 users yet.
                </p>
              } @else {
                <div class="space-y-4">
                  @for (feature of usage.featureUsage; track feature.feature) {
                    <div>
                      <div class="mb-1 flex justify-between gap-3 text-sm">
                        <span class="font-medium capitalize text-on-surface">{{
                          feature.feature.replaceAll("_", " ")
                        }}</span>
                        <span class="shrink-0 text-on-surface-variant"
                          >{{ feature.users }} users ·
                          {{ feature.events }} opens</span
                        >
                      </div>
                      <div
                        class="h-2 overflow-hidden rounded-full bg-surface-container-high"
                      >
                        <div
                          class="h-full rounded-full bg-primary"
                          [style.width.%]="
                            share(feature.users, usage.activeUsers)
                          "
                          role="presentation"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </article>
          </section>

          <section
            class="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
          >
            <div class="border-b border-outline-variant/30 p-5">
              <h2 class="text-lg font-bold text-on-surface">Flow outcomes</h2>
              <p class="mt-1 text-xs text-on-surface-variant">
                A flow is counted as completed when the app reaches a terminal
                success or accepted-pending state.
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[680px] text-left text-sm">
                <thead
                  class="bg-surface-container-low text-xs uppercase text-on-surface-variant"
                >
                  <tr>
                    <th class="px-5 py-3">Flow</th>
                    <th class="px-4 py-3">Started</th>
                    <th class="px-4 py-3">Completed</th>
                    <th class="px-4 py-3">Failed</th>
                    <th class="px-4 py-3">Abandoned</th>
                    <th class="px-5 py-3">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  @for (flow of usage.flowUsage; track flow.flow) {
                    <tr class="border-t border-outline-variant/20">
                      <th
                        scope="row"
                        class="px-5 py-4 font-semibold capitalize text-on-surface"
                      >
                        {{ flow.flow.replaceAll("_", " ") }}
                      </th>
                      <td class="px-4 py-4 text-on-surface-variant">
                        {{ flow.started }}
                      </td>
                      <td class="px-4 py-4 text-on-surface-variant">
                        {{ flow.completed }}
                      </td>
                      <td class="px-4 py-4 text-on-surface-variant">
                        {{ flow.failed }}
                      </td>
                      <td class="px-4 py-4 text-on-surface-variant">
                        {{ flow.abandoned }}
                      </td>
                      <td class="px-5 py-4 font-semibold text-on-surface">
                        {{ flow.completionRate | percent: "1.0-0" }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td
                        colspan="6"
                        class="px-5 py-10 text-center text-on-surface-variant"
                      >
                        No flow cohorts have reached 10 users yet.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
          <p class="text-xs text-on-surface-variant">
            Only staging and production traffic is included. Small cohorts are
            suppressed; this view contains no user-level activity or financial
            decision data.
          </p>
        }
      }
    </main>
  `,
})
export class AnalyticsPageComponent {
  private readonly admin = inject(AdminService);
  readonly windows: WindowDays[] = [7, 30, 90];
  readonly days = signal<WindowDays>(30);
  readonly query = injectQuery(() => ({
    queryKey: ["admin", "product-usage", this.days()],
    queryFn: () => lastValueFrom(this.admin.getUsageAnalytics(this.days())),
  }));
  readonly data = computed(() => this.query.data());

  selectWindow(days: WindowDays): void {
    this.days.set(days);
  }

  formatDuration(seconds?: number): string {
    if (seconds == null) return "—";
    const value = Math.max(0, Math.round(seconds));
    if (value < 60) return `${value}s`;
    const minutes = Math.floor(value / 60);
    const remainder = value % 60;
    return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
  }

  barHeight(value: number, points: { users: number }[]): number {
    const max = Math.max(1, ...points.map((point) => point.users));
    return Math.max(4, (value / max) * 100);
  }

  share(users: number, total?: number): number {
    return total && total > 0 ? Math.min(100, (users / total) * 100) : 0;
  }
}
