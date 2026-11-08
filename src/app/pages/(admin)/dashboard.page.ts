import { Component, inject, computed } from "@angular/core";
import { CommonModule, formatDate } from "@angular/common";
import { RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideActivity as Activity,
  LucideArrowLeftRight as ArrowLeftRight,
  LucideArrowRight as ArrowRight,
  LucideBanknote as Banknote,
  LucideCircleAlert as CircleAlert,
  LucideHandCoins as HandCoins,
  LucideLayoutDashboard as LayoutDashboard,
  LucideRefreshCw as RefreshCw,
  LucideShieldCheck as ShieldCheck,
  LucideUsers as Users,
} from "@lucide/angular";
import { AdminService } from "../../services/admin.service";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { DidYouKnowComponent } from "../../components/ui/did-you-know.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { StatusChipComponent } from "../../components/ui/status-chip.component";

@Component({
  selector: "app-dashboard",
  imports: [
    CommonModule,
    RouterLink,
    LucideDynamicIcon,
    MetricCardComponent,
    DidYouKnowComponent,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  template: `
    <app-page-header
      title="Dashboard"
      crumb="Overview"
      [icon]="LayoutDashboardIcon"
      [meta]="reportLabel()"
    >
      <button
        type="button"
        class="ui-btn"
        [disabled]="metricsQuery.isFetching()"
        (click)="metricsQuery.refetch()"
      >
        <svg
          [lucideIcon]="RefreshIcon"
          [size]="15"
          [class]="metricsQuery.isFetching() ? 'animate-spin' : ''"
        ></svg>
        Refresh
      </button>
    </app-page-header>

    <div class="space-y-4">
      @if (metricsQuery.isError()) {
        <div class="ui-alert ui-alert-danger">
          <svg
            [lucideIcon]="CircleAlertIcon"
            [size]="16"
            class="mt-0.5 shrink-0"
          ></svg>
          <div
            class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>Couldn't load the dashboard.</span>
            <button
              type="button"
              class="ui-btn ui-btn-sm"
              (click)="metricsQuery.refetch()"
            >
              Try again
            </button>
          </div>
        </div>
      }

      <!-- Quick stats -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Quick stats</h2>
        </div>
        <div class="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
          @if (loading()) {
            @for (n of [1, 2, 3, 4, 5, 6]; track n) {
              <div class="rounded-xl border border-ui-line bg-white p-1.5">
                <div class="ui-skel mx-1.5 mb-3 mt-1.5 h-3 w-20"></div>
                <div class="ui-skel h-[68px] rounded-lg"></div>
              </div>
            }
          } @else {
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/users"
            >
              <app-metric-card
                label="Total users"
                [icon]="UsersIcon"
                [value]="metrics()?.totalUsers || 0"
                [trend]="usersTrend()"
                [hint]="'+' + (metrics()?.newUsersToday ?? 0) + ' today'"
              />
            </a>
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/users"
            >
              <app-metric-card
                label="Active today"
                [icon]="ActivityIcon"
                [value]="
                  metrics()?.activeUsersToday ?? metrics()?.activeUsers ?? 0
                "
                hint="signed in today"
              />
            </a>
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/transactions"
            >
              <app-metric-card
                label="Volume this month"
                [icon]="BanknoteIcon"
                prefix="₦"
                [value]="volumeThisMonth()"
                [trend]="volumeTrend()"
                hint="vs last month"
              />
            </a>
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/transactions"
            >
              <app-metric-card
                label="Volume today"
                [icon]="ArrowLeftRightIcon"
                prefix="₦"
                [value]="metrics()?.transactionVolumeToday ?? 0"
                [hint]="
                  (metrics()?.transactionCountToday ?? 0) + ' transactions'
                "
              />
            </a>
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/loans"
            >
              <app-metric-card
                label="Active loans"
                [icon]="HandCoinsIcon"
                [value]="metrics()?.activeLoans || 0"
                [trend]="loansTrend()"
                [hint]="(metrics()?.overdueLoans ?? 0) + ' overdue'"
              />
            </a>
            <a
              class="block rounded-xl focus-visible:outline-2 hover:[&>*]:border-ui-line-strong"
              routerLink="/kyc"
            >
              <app-metric-card
                label="Pending KYC"
                [icon]="ShieldCheckIcon"
                [value]="metrics()?.pendingKyc || 0"
                hint="awaiting review"
              />
            </a>
          }
        </div>
      </section>

      <app-did-you-know />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Volume chart -->
        <section class="ui-panel flex flex-col lg:col-span-2">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Transaction volume</h2>
            <span class="ui-meta">Last 7 days</span>
          </div>
          <div class="ui-panel-body flex flex-1 flex-col justify-end p-4">
            @if (loading()) {
              <div class="ui-skel h-[168px]"></div>
            } @else if (volumeData().length === 0) {
              <div class="ui-empty h-[168px] py-0">No volume yet</div>
            } @else {
              <div class="flex h-[168px] items-end gap-2 sm:gap-3">
                @for (day of volumeData(); track day.date) {
                  <a
                    class="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                    routerLink="/transactions"
                    [queryParams]="{ from: day.date, to: day.date }"
                    [title]="barTitle(day)"
                    [attr.aria-label]="barTitle(day)"
                  >
                    <span
                      class="text-[10px] font-medium tabular-nums text-ui-muted group-hover:text-ui-ink"
                      >{{ compactAmount(day.amount) }}</span
                    >
                    <div
                      class="w-full max-w-[44px] rounded-md bg-ui-accent/20 transition-colors group-hover:bg-ui-accent"
                      [style.height.px]="barHeightPx(day.amount) || 2"
                    ></div>
                    <span class="text-[11px] text-ui-muted">{{
                      day.date | date: "EEE"
                    }}</span>
                  </a>
                }
              </div>
            }
          </div>
        </section>

        <!-- Books -->
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Books</h2>
            <a routerLink="/loans" class="ui-btn ui-btn-ghost ui-btn-sm">
              Loans
              <svg [lucideIcon]="ArrowRightIcon" [size]="14"></svg>
            </a>
          </div>
          <div class="ui-panel-body divide-y divide-ui-line">
            @for (row of books(); track row.label) {
              @if (row.link) {
                <a
                  [routerLink]="row.link"
                  class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ui-rail"
                >
                  <span class="text-[13px] text-ui-muted">{{ row.label }}</span>
                  @if (loading()) {
                    <span class="ui-skel h-4 w-20"></span>
                  } @else {
                    <span
                      class="text-sm font-semibold tabular-nums"
                      [class]="row.danger ? 'text-ui-danger' : 'text-ui-ink'"
                      >{{ row.value }}</span
                    >
                  }
                </a>
              } @else {
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                  <span class="text-[13px] text-ui-muted">{{ row.label }}</span>
                  @if (loading()) {
                    <span class="ui-skel h-4 w-20"></span>
                  } @else {
                    <span
                      class="text-sm font-semibold tabular-nums"
                      [class]="row.danger ? 'text-ui-danger' : 'text-ui-ink'"
                      >{{ row.value }}</span
                    >
                  }
                </div>
              }
            }
            @for (item of pendingKycItems(); track item.id) {
              <a
                routerLink="/kyc"
                class="flex items-center gap-3 px-4 py-3 hover:bg-ui-rail"
              >
                <span class="ui-avatar">{{ initials(item.name) }}</span>
                <span class="min-w-0 flex-1">
                  <span
                    class="block truncate text-[13px] font-medium text-ui-ink"
                    >{{ item.name }}</span
                  >
                  <span class="block text-xs text-ui-muted"
                    >{{ item.type }} · KYC</span
                  >
                </span>
                <span class="ui-meta">{{ item.time }}</span>
              </a>
            }
          </div>
        </section>
      </div>

      <!-- Recent transactions -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Recent transactions</h2>
          <a routerLink="/transactions" class="ui-btn ui-btn-sm">
            View all
            <svg [lucideIcon]="ArrowRightIcon" [size]="14"></svg>
          </a>
        </div>
        <div class="ui-panel-body overflow-hidden">
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[640px]">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th class="hidden md:table-cell">Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4, 5]; track n) {
                    <tr>
                      <td><div class="ui-skel h-4 w-36"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-16"></div></td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-20"></div>
                      </td>
                    </tr>
                  }
                } @else {
                  @for (tx of recentTransactions(); track tx.id) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-2.5">
                          <span class="ui-avatar">{{
                            initials(tx.userName)
                          }}</span>
                          <span class="truncate font-medium text-ui-ink">{{
                            tx.userName
                          }}</span>
                        </div>
                      </td>
                      <td class="hidden whitespace-nowrap md:table-cell">
                        {{ typeLabel(tx.type) }}
                      </td>
                      <td class="whitespace-nowrap tabular-nums text-ui-ink">
                        ₦{{ tx.amount | number: "1.0-2" : "en-NG" }}
                      </td>
                      <td><app-status-chip [status]="tx.status" /></td>
                      <td
                        class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                      >
                        {{ tx.createdAt | date: "MMM d, HH:mm" }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5">
                        <div class="ui-empty">No transactions yet</div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class DashboardPageComponent {
  private adminService = inject(AdminService);

  readonly LayoutDashboardIcon = LayoutDashboard;
  readonly RefreshIcon = RefreshCw;
  readonly UsersIcon = Users;
  readonly ActivityIcon = Activity;
  readonly BanknoteIcon = Banknote;
  readonly CircleAlertIcon = CircleAlert;
  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly HandCoinsIcon = HandCoins;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ArrowRightIcon = ArrowRight;

  metricsQuery = injectQuery(() => ({
    queryKey: ["dashboard-metrics"],
    queryFn: () => lastValueFrom(this.adminService.getDashboardMetrics()),
  }));

  loading = computed(() => this.metricsQuery.isPending());
  metrics = computed(() => this.metricsQuery.data());
  usersTrend = computed(() => this.metrics()?.trends?.["users"]);
  volumeTrend = computed(() => this.metrics()?.trends?.["volume"]);
  loansTrend = computed(() => this.metrics()?.trends?.["loans"]);

  volumeThisMonth = computed(() => {
    const m = this.metrics();
    return m?.transactionVolumeThisMonth ?? m?.totalVolume ?? 0;
  });

  reportLabel = computed(() => {
    const date = this.metrics()?.reportDate;
    const base = date ? `Report for ${date}` : "";
    const updatedAt = this.metricsQuery.dataUpdatedAt();
    if (!updatedAt) return base;
    const updated = `Updated ${formatDate(updatedAt, "HH:mm", "en-US")}`;
    return base ? `${base} · ${updated}` : updated;
  });

  books = computed(
    (): {
      label: string;
      value: string;
      danger?: boolean;
      link?: string;
    }[] => {
      const m = this.metrics();
      return [
        { label: "Loan portfolio", value: this.naira(m?.totalLoanPortfolio) },
        { label: "Savings held", value: this.naira(m?.totalSavingsBalance) },
        {
          label: "Overdue loans",
          value: String(m?.overdueLoans ?? 0),
          danger: (m?.overdueLoans ?? 0) > 0,
          link: "/loans",
        },
      ];
    },
  );

  volumeData = computed(() => this.metrics()?.volumeByDay ?? []);

  maxVolume = computed(() => {
    const values = this.volumeData().map((d) => d.amount);
    return values.length ? Math.max(...values) : 0;
  });

  pendingKycItems = computed(() => this.metrics()?.pendingKycItems ?? []);

  recentTransactions = computed(() => this.metrics()?.recentTransactions ?? []);

  barHeightPx(amount: number): number {
    const max = this.maxVolume();
    return max > 0 ? Math.round((amount / max) * 120) : 0;
  }

  barTitle(day: { date: string; amount: number }): string {
    const amount = day.amount.toLocaleString("en-NG");
    return `${formatDate(day.date, "MMM d, yyyy", "en-US")} ₦${amount}`;
  }

  compactAmount(amount: number): string {
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
    return `₦${amount}`;
  }

  typeLabel(type: string): string {
    const words = (type ?? "").replace(/_/g, " ").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  initials(name: string): string {
    const parts = (name ?? "").trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "") || "?";
  }

  private naira(value: number | undefined): string {
    return `₦${(value ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  }
}
