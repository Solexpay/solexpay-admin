import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService } from "../../services/admin.service";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { ShimmerSkeletonComponent } from "../../components/ui/shimmer-skeleton.component";
import { CountUpDirective } from "../../directives/count-up.directive";
import { HoverScaleDirective } from "../../directives/hover-scale.directive";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { PulseAnimationDirective } from "../../directives/pulse-animation.directive";
import { ScrollRevealDirective } from "../../directives/scroll-reveal.directive";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MetricCardComponent,
    StatusChipComponent,
    ShimmerSkeletonComponent,
    CountUpDirective,
    HoverScaleDirective,
    TooltipDirective,
    PulseAnimationDirective,
    ScrollRevealDirective,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            Dashboard
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Overview of your system metrics and activity
          </p>
        </div>
        <div class="text-xs sm:text-sm text-on-surface-variant">
          Last updated: {{ now | date: "medium" }}
        </div>
      </div>

      <!-- Metric Cards Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        scrollReveal
      >
        @if (loading()) {
          @for (n of [1, 2, 3, 4]; track n; let i = $index) {
            <div
              class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-surface-container-high skeleton-peak"
              [style.animation-delay]="i * 100 + 'ms'"
            >
              <div
                class="h-3 w-24 bg-surface-container-high rounded-full mb-4"
              ></div>
              <div
                class="h-8 w-20 bg-surface-container-high rounded-full"
              ></div>
            </div>
          }
        } @else {
          <app-metric-card
            label="Total Users"
            [value]="metrics()?.totalUsers || 0"
            color="primary"
            [trend]="usersTrend()"
            [style.animation-delay]="0 + 'ms'"
            hoverScale="md"
            class="animate-fade-slide-up"
          />

          <app-metric-card
            label="Total Volume"
            [value]="metrics()?.totalVolume || 0"
            prefix="₦"
            color="tertiary"
            [trend]="volumeTrend()"
            [style.animation-delay]="100 + 'ms'"
            hoverScale="md"
            class="animate-fade-slide-up"
          />

          <app-metric-card
            label="Active Loans"
            [value]="metrics()?.activeLoans || 0"
            color="secondary"
            [trend]="loansTrend()"
            [style.animation-delay]="200 + 'ms'"
            hoverScale="md"
            class="animate-fade-slide-up"
          />

          <app-metric-card
            label="Pending KYC"
            [value]="metrics()?.pendingKyc || 0"
            color="error"
            hoverScale="md"
          />
        }
      </div>

      <!-- Charts and Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Transaction Volume Chart -->
        <div
          class="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <h3 class="text-lg font-bold text-on-surface mb-4">
            Transaction Volume (Last 7 Days)
          </h3>

          @if (loading()) {
            <div
              class="h-48 bg-surface-container-high rounded-xl animate-skeleton-pulse"
            ></div>
          } @else {
            <div class="flex flex-col gap-0">
              <!-- Amount labels row -->
              <div class="flex gap-1.5 mb-1">
                @for (day of volumeData(); track day.date) {
                  <div class="flex-1 text-center">
                    <span
                      class="text-[9px] font-semibold text-primary tabular-nums"
                      >{{ compactAmount(day.amount) }}</span
                    >
                  </div>
                }
              </div>
              <!-- Bars -->
              <div class="flex items-end gap-1.5" style="height:120px">
                @for (day of volumeData(); track day.date; let i = $index) {
                  <div class="flex-1 flex flex-col items-center">
                    <div
                      class="w-full bg-primary/25 hover:bg-primary/50 rounded-t-md transition-colors duration-150 animate-bar-grow"
                      [style.animation-delay]="i * 60 + 'ms'"
                      [style.height.px]="barHeightPx(day.amount)"
                    ></div>
                  </div>
                }
              </div>
              <!-- Day labels -->
              <div class="flex gap-1.5 mt-1.5">
                @for (day of volumeData(); track day.date) {
                  <div class="flex-1 text-center">
                    <span class="text-[10px] text-on-surface-variant">{{
                      day.date | date: "EEE"
                    }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pending KYC Queue -->
        <div
          class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)] hover-lift transition-all duration-200"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2"
          >
            <h3 class="text-base sm:text-lg font-bold text-on-surface">
              Pending KYC
            </h3>
            <a
              routerLink="/kyc"
              class="text-xs sm:text-sm text-primary hover:underline"
              tooltip="View all KYC submissions"
              tooltipPosition="left"
              >View All</a
            >
          </div>

          @if (loading()) {
            @for (n of [1, 2, 3]; track n) {
              <div
                class="p-3 mb-2 bg-surface-container-high rounded-xl animate-skeleton-pulse"
              >
                <div
                  class="h-4 w-32 bg-surface-container rounded-full mb-2"
                ></div>
                <div class="h-3 w-24 bg-surface-container rounded-full"></div>
              </div>
            }
          } @else {
            <div class="space-y-2">
              @for (item of pendingKycItems(); track item.id; let i = $index) {
                <div
                  class="p-3 hover:bg-surface-container-low rounded-xl transition-colors duration-200 cursor-pointer animate-stagger-in opacity-0"
                  [style.animation-delay]="i * 80 + 'ms'"
                  [style.animation-fill-mode]="'forwards'"
                  tabindex="0"
                  (click)="goToKyc()"
                  (keydown.enter)="goToKyc()"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center"
                      >
                        <span
                          class="material-symbols-outlined text-primary text-sm"
                          >person</span
                        >
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-on-surface">
                          {{ item.name }}
                        </p>
                        <p class="text-xs text-on-surface-variant">
                          {{ item.type }}
                        </p>
                      </div>
                    </div>
                    <span class="text-xs text-on-surface-variant">{{
                      item.time
                    }}</span>
                  </div>
                </div>
              }

              @if (pendingKycItems().length === 0) {
                <div class="text-center py-8">
                  <span
                    class="material-symbols-outlined text-4xl text-surface-variant"
                    >verified_user</span
                  >
                  <p class="text-sm text-on-surface-variant mt-2">
                    No pending KYC verifications
                  </p>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Recent Transactions -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)] hover-lift transition-all duration-200"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2"
        >
          <h3 class="text-lg font-bold text-on-surface">Recent Transactions</h3>
          <a
            routerLink="/transactions"
            class="text-sm text-primary hover:underline"
            tooltip="View all transactions"
            tooltipPosition="left"
            >View All</a
          >
        </div>

        <div class="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          @if (loading()) {
            <div class="space-y-2 min-w-[600px]">
              @for (n of [1, 2, 3, 4, 5]; track n; let i = $index) {
                <div
                  class="flex items-center gap-4 p-3 animate-skeleton-pulse"
                  [style.animation-delay]="i * 150 + 'ms'"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-surface-container-high"
                  ></div>
                  <div class="flex-1">
                    <div
                      class="h-4 w-32 bg-surface-container-high rounded-full mb-2"
                    ></div>
                    <div
                      class="h-3 w-24 bg-surface-container-high rounded-full"
                    ></div>
                  </div>
                  <div
                    class="h-4 w-20 bg-surface-container-high rounded-full"
                  ></div>
                </div>
              }
            </div>
          } @else {
            <div class="space-y-2 min-w-[600px]">
              @for (tx of recentTransactions(); track tx.id; let i = $index) {
                <div
                  class="flex items-center gap-4 p-3 hover:bg-surface-container-low rounded-xl transition-colors duration-200 animate-stagger-in opacity-0"
                  [style.animation-delay]="i * 40 + 'ms'"
                  [style.animation-fill-mode]="'forwards'"
                >
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    [class]="
                      tx.status === 'SUCCESS'
                        ? 'bg-tertiary-fixed'
                        : tx.status === 'PENDING'
                          ? 'bg-secondary-fixed'
                          : 'bg-error-container'
                    "
                  >
                    <span
                      class="material-symbols-outlined text-sm"
                      [class]="
                        tx.status === 'SUCCESS'
                          ? 'text-tertiary'
                          : tx.status === 'PENDING'
                            ? 'text-secondary'
                            : 'text-error'
                      "
                    >
                      {{ getTransactionIcon(tx.type) }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-on-surface truncate">
                      {{ tx.userName }}
                    </p>
                    <p class="text-xs text-on-surface-variant">
                      {{ tx.type }} • {{ tx.createdAt | date: "short" }}
                    </p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-sm font-bold text-on-surface">
                      <span class="text-on-surface-variant">₦</span
                      >{{ tx.amount | number: "1.0-0" : "en-NG" }}
                    </span>
                    <app-status-chip [status]="tx.status"></app-status-chip>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardPageComponent {
  private adminService = inject(AdminService);

  now = new Date();
  chartVisible = signal(true);

  metricsQuery = injectQuery(() => ({
    queryKey: ["dashboard-metrics"],
    queryFn: () => lastValueFrom(this.adminService.getDashboardMetrics()),
  }));

  loading = computed(() => this.metricsQuery.isPending());
  metrics = computed(() => this.metricsQuery.data());
  usersTrend = computed(() => this.metrics()?.trends?.["users"]);
  volumeTrend = computed(() => this.metrics()?.trends?.["volume"]);
  loansTrend = computed(() => this.metrics()?.trends?.["loans"]);

  volumeData = computed(() => {
    const m = this.metrics();
    if (m?.volumeByDay) return m.volumeByDay;
    return [];
  });

  maxVolume = computed(() => {
    const values = this.volumeData().map(
      (d: { date: string; amount: number }) => d.amount,
    );
    return values.length ? Math.max(...values) : 0;
  });

  pendingKycItems = computed(() => {
    const m = this.metrics();
    return m?.pendingKycItems || [];
  });

  recentTransactions = computed(() => {
    const m = this.metrics();
    if (m?.recentTransactions) return m.recentTransactions;
    return [];
  });

  barHeightPx(amount: number): number {
    const max = this.maxVolume();
    return max > 0 ? Math.round((amount / max) * 120) : 0;
  }

  compactAmount(amount: number): string {
    if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
    return `₦${amount}`;
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      WALLET_FUNDING: "add_circle",
      LOAN_DISBURSEMENT: "payments",
      NIP_TRANSFER: "send_money",
      LOAN_REPAYMENT: "account_balance",
      BILL_PAYMENT: "receipt",
      P2P_TRANSFER: "swap_horiz",
    };
    return icons[type] || "payment";
  }

  goToKyc() {
    console.log("Navigating to KYC details...");
  }
}
