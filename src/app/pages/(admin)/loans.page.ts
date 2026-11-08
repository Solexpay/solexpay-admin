import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideBanknote as Banknote,
  LucideChevronDown as ChevronDown,
  LucideClock as Clock,
  LucideEye as Eye,
  LucideHandCoins as HandCoins,
  LucideLandmark as Landmark,
  LucideLoaderCircle as LoaderCircle,
  LucideSearchX as SearchX,
  LucideTriangleAlert as TriangleAlert,
  LucideCircleAlert as CircleAlert,
  LucideX as X,
} from "@lucide/angular";
import { AdminService, Loan } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";

@Component({
  selector: "app-loans",
  imports: [
    CommonModule,
    LucideDynamicIcon,
    StatusChipComponent,
    MetricCardComponent,
    PageHeaderComponent,
    ModalDirective,
  ],
  template: `
    <app-page-header
      title="Loan Applications"
      [icon]="HandCoinsIcon"
      subtitle="Review and manage student loan applications"
    />

    <div class="space-y-4">
      <!-- Loan stats -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Quick stats</h2>
        </div>
        @if (dashboardQuery.isPending()) {
          <div class="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            @for (n of [1, 2, 3, 4]; track n) {
              <div class="rounded-xl border border-ui-line bg-white p-1.5">
                <div class="mb-3 flex items-center gap-2 px-1.5 pt-1">
                  <div class="ui-skel h-6 w-6 rounded-md"></div>
                  <div class="ui-skel h-3 w-24"></div>
                </div>
                <div class="rounded-lg bg-ui-sunken px-3 py-3">
                  <div class="ui-skel h-6 w-20"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            <app-metric-card
              label="Pending Review"
              [icon]="ClockIcon"
              [value]="pendingCount()"
              [suffix]="hasMore() ? '+' : ''"
            />
            <app-metric-card
              label="Loan portfolio"
              [icon]="LandmarkIcon"
              prefix="₦"
              [value]="dashboardQuery.data()?.totalLoanPortfolio ?? 0"
            />
            <app-metric-card
              label="Active loans"
              [icon]="BanknoteIcon"
              [value]="dashboardQuery.data()?.activeLoans ?? 0"
            />
            <app-metric-card
              label="Overdue loans"
              [icon]="TriangleAlertIcon"
              [value]="dashboardQuery.data()?.overdueLoans ?? 0"
            />
          </div>
        }
      </section>

      <!-- Loans table -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Applications</h2>
          <div class="ui-tabs">
            @for (tab of statusTabs; track tab.value) {
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === tab.value"
                (click)="onStatusFilterChange(tab.value)"
              >
                {{ tab.label }}
              </button>
            }
          </div>
        </div>
        <div class="ui-panel-body overflow-hidden">
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[760px]">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th class="hidden md:table-cell">School</th>
                  <th>Amount</th>
                  <th class="hidden md:table-cell">Tenor</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Credit score</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4]; track n) {
                    <tr>
                      <td><div class="ui-skel h-4 w-32"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-28"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-20"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-16"></div>
                      </td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-16"></div>
                      </td>
                      <td><div class="ui-skel ml-auto h-4 w-16"></div></td>
                    </tr>
                  }
                } @else if (loansQuery.isError()) {
                  <tr>
                    <td colspan="7">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load loans.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="loansQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (loan of filteredLoans(); track loan.id) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-2.5">
                          <span class="ui-avatar">{{
                            loan.userName?.charAt(0) || "?"
                          }}</span>
                          <div class="min-w-0">
                            <button
                              type="button"
                              class="truncate text-left font-medium text-ui-ink hover:text-ui-accent"
                              [title]="loan.userName || ''"
                              (click)="viewLoan(loan)"
                            >
                              {{ loan.userName }}
                            </button>
                            <p class="truncate text-xs text-ui-muted">
                              <span [title]="loan.purpose || ''">{{
                                loan.purpose
                              }}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">
                        <p
                          class="max-w-[150px] truncate"
                          [title]="loan.schoolName || ''"
                        >
                          {{ loan.schoolName }}
                        </p>
                      </td>
                      <td class="whitespace-nowrap">
                        <p class="tabular-nums text-ui-ink">
                          ₦{{ loan.amount | number: "1.0-0" : "en-NG" }}
                        </p>
                        <p class="text-xs text-ui-muted">
                          {{ loan.interestRate }}% APR
                        </p>
                      </td>
                      <td class="hidden whitespace-nowrap md:table-cell">
                        <p>{{ loan.tenorMonths }} months</p>
                        <p class="text-xs tabular-nums text-ui-muted">
                          ₦{{
                            loan.monthlyRepayment | number: "1.0-0" : "en-NG"
                          }}/mo
                        </p>
                      </td>
                      <td><app-status-chip [status]="loan.status" /></td>
                      <td class="hidden md:table-cell">
                        @if (
                          loan.creditScore !== null &&
                          loan.creditScore !== undefined
                        ) {
                          <div class="flex items-center gap-2">
                            <div
                              class="h-1.5 w-16 overflow-hidden rounded-full bg-ui-sunken"
                            >
                              <div
                                class="h-full rounded-full"
                                [class]="
                                  loan.creditScore >= 700
                                    ? 'bg-ui-success'
                                    : loan.creditScore >= 500
                                      ? 'bg-ui-warning'
                                      : 'bg-ui-danger'
                                "
                                [style.width.%]="(loan.creditScore / 850) * 100"
                              ></div>
                            </div>
                            <span class="tabular-nums text-ui-ink">{{
                              loan.creditScore
                            }}</span>
                          </div>
                        } @else {
                          <span class="text-ui-faint">—</span>
                        }
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="viewLoan(loan)"
                            title="View Details"
                            aria-label="View Details"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                          @if (loan.status === "OPS_REVIEW") {
                            <button
                              type="button"
                              class="ui-btn ui-btn-primary ui-btn-sm"
                              (click)="approve(loan)"
                              [disabled]="
                                approveMutation.isPending() &&
                                approveMutation.variables()?.loanId === loan.id
                              "
                            >
                              {{
                                approveMutation.isPending() &&
                                approveMutation.variables()?.loanId === loan.id
                                  ? "Approving…"
                                  : "Approve"
                              }}
                            </button>
                            <button
                              type="button"
                              class="ui-btn ui-btn-danger ui-btn-sm"
                              (click)="reject(loan)"
                              [disabled]="
                                rejectMutation.isPending() &&
                                rejectMutation.variables()?.loanId === loan.id
                              "
                            >
                              {{
                                rejectMutation.isPending() &&
                                rejectMutation.variables()?.loanId === loan.id
                                  ? "Rejecting…"
                                  : "Reject"
                              }}
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="7">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="SearchXIcon"
                            [size]="28"
                            class="text-ui-faint"
                          ></svg>
                          <p>No loans found matching your criteria</p>
                          @if (statusFilter() !== "ALL") {
                            <button
                              type="button"
                              class="ui-btn ui-btn-sm"
                              (click)="onStatusFilterChange('ALL')"
                            >
                              Clear filter
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (hasMore()) {
            <div class="ui-table-foot">
              <span>{{ filteredLoans().length }} shown</span>
              <button
                type="button"
                class="ui-btn ui-btn-sm"
                (click)="loadMore()"
                [disabled]="isLoadingMore()"
              >
                @if (isLoadingMore()) {
                  <svg
                    [lucideIcon]="LoaderIcon"
                    [size]="15"
                    class="animate-spin"
                  ></svg>
                  <span>Loading...</span>
                } @else {
                  <span>Load more</span>
                  <svg [lucideIcon]="ChevronDownIcon" [size]="15"></svg>
                }
              </button>
            </div>
          }
        </div>
      </section>
    </div>

    @if (selectedLoan(); as loan) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedLoan.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedLoan.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Loan details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              aria-label="Close"
              (click)="selectedLoan.set(null)"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>
          <div class="ui-modal-body">
            <dl class="ui-dl">
              <div>
                <dt class="ui-dt">Applicant</dt>
                <dd class="ui-dd">{{ loan.userName || "—" }}</dd>
              </div>
              <div>
                <dt class="ui-dt">School</dt>
                <dd class="ui-dd">{{ loan.schoolName || "—" }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="ui-dt">Purpose</dt>
                <dd class="ui-dd">{{ loan.purpose || "—" }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Amount</dt>
                <dd class="ui-dd">
                  ₦{{ loan.amount | number: "1.0-0" : "en-NG" }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Interest rate</dt>
                <dd class="ui-dd">{{ loan.interestRate ?? "—" }}%</dd>
              </div>
              <div>
                <dt class="ui-dt">Tenor</dt>
                <dd class="ui-dd">
                  {{ loan.tenorMonths ?? loan.tenureMonths ?? "—" }} months
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Monthly repayment</dt>
                <dd class="ui-dd">
                  {{
                    (loan.monthlyRepayment ?? null) === null
                      ? "—"
                      : "₦" +
                        (loan.monthlyRepayment | number: "1.0-0" : "en-NG")
                  }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Credit score</dt>
                <dd class="ui-dd">
                  @if (
                    loan.creditScore !== null && loan.creditScore !== undefined
                  ) {
                    <div class="flex items-center gap-2">
                      <div
                        class="h-1.5 w-24 overflow-hidden rounded-full bg-ui-sunken"
                      >
                        <div
                          class="h-full rounded-full"
                          [class]="
                            loan.creditScore >= 700
                              ? 'bg-ui-success'
                              : loan.creditScore >= 500
                                ? 'bg-ui-warning'
                                : 'bg-ui-danger'
                          "
                          [style.width.%]="(loan.creditScore / 850) * 100"
                        ></div>
                      </div>
                      {{ loan.creditScore }}
                    </div>
                  } @else {
                    —
                  }
                </dd>
              </div>
              @if ((loan.outstandingPrincipal ?? null) !== null) {
                <div>
                  <dt class="ui-dt">Outstanding principal</dt>
                  <dd class="ui-dd">
                    ₦{{ loan.outstandingPrincipal | number: "1.0-0" : "en-NG" }}
                  </dd>
                </div>
              }
              @if ((loan.outstandingInterest ?? null) !== null) {
                <div>
                  <dt class="ui-dt">Outstanding interest</dt>
                  <dd class="ui-dd">
                    ₦{{ loan.outstandingInterest | number: "1.0-0" : "en-NG" }}
                  </dd>
                </div>
              }
              @if (loan.rejectionReason) {
                <div class="sm:col-span-2">
                  <dt class="ui-dt">Rejection reason</dt>
                  <dd class="ui-dd">{{ loan.rejectionReason }}</dd>
                </div>
              }
              <div>
                <dt class="ui-dt">Applied</dt>
                <dd class="ui-dd">
                  {{ loan.appliedAt ?? loan.createdAt | date: "mediumDate" }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="ui-modal-foot">
            @if (loan.status === "OPS_REVIEW") {
              <button
                type="button"
                class="ui-btn ui-btn-primary"
                (click)="approve(loan)"
              >
                Approve</button
              ><button
                type="button"
                class="ui-btn ui-btn-danger"
                (click)="reject(loan)"
              >
                Reject
              </button>
            }
            <button
              type="button"
              class="ui-btn"
              (click)="selectedLoan.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LoansPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  readonly HandCoinsIcon = HandCoins;
  readonly ClockIcon = Clock;
  readonly LandmarkIcon = Landmark;
  readonly BanknoteIcon = Banknote;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly EyeIcon = Eye;
  readonly SearchXIcon = SearchX;
  readonly LoaderIcon = LoaderCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly CircleAlertIcon = CircleAlert;
  readonly XIcon = X;

  private confirm = inject(ConfirmService);
  statusFilter = signal<
    "ALL" | "PENDING" | "OPS_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED"
  >("ALL");
  selectedLoan = signal<Loan | null>(null);

  readonly statusTabs = [
    { label: "All", value: "ALL" as const },
    { label: "Pending", value: "PENDING" as const },
    { label: "Ops Review", value: "OPS_REVIEW" as const },
    { label: "Approved", value: "APPROVED" as const },
    { label: "Rejected", value: "REJECTED" as const },
    { label: "Disbursed", value: "DISBURSED" as const },
  ];

  loansQuery = injectQuery(() => ({
    queryKey: ["loans", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getLoans({
          limit: 20,
          status:
            this.statusFilter() === "ALL" ? undefined : this.statusFilter(),
        }),
      ),
  }));

  dashboardQuery = injectQuery(() => ({
    queryKey: ["dashboard-metrics"],
    queryFn: () => lastValueFrom(this.adminService.getDashboardMetrics()),
  }));

  approveMutation = injectMutation(() => ({
    mutationFn: ({
      loanId,
    }: {
      loanId: string;
      amount: number;
      name: string;
    }) => lastValueFrom(this.adminService.approveLoan(loanId)),
    onSuccess: (_, { name }) => {
      this.toast.show("success", `Loan approved for ${name}`);
      this.resetPages();
      this.selectedLoan.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: () => this.toast.show("error", "Failed to approve loan"),
  }));

  rejectMutation = injectMutation(() => ({
    mutationFn: ({
      loanId,
      reason,
    }: {
      loanId: string;
      reason: string;
      name: string;
    }) => lastValueFrom(this.adminService.rejectLoan(loanId, reason)),
    onSuccess: (_, { name }) => {
      this.toast.show("success", `Loan rejected for ${name}`);
      this.resetPages();
      this.selectedLoan.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: () => this.toast.show("error", "Failed to reject loan"),
  }));

  loading = computed(() => this.loansQuery.isPending());

  rawAppendedLoans = signal<Loan[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.loansQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  loans = computed<Loan[]>(() => {
    const response = this.loansQuery.data();
    const queryItems =
      response?.items ||
      (response as unknown as { content?: Loan[] })?.content ||
      [];
    const all = [...queryItems, ...this.rawAppendedLoans()];
    return all;
  });

  totalItems = computed(
    () =>
      (this.loansQuery.data() as unknown as { totalElements?: number })
        ?.totalElements || this.loans().length,
  );
  totalPages = computed(
    () =>
      (this.loansQuery.data() as unknown as { totalPages?: number })
        ?.totalPages || 1,
  );

  filteredLoans = computed(() => {
    if (this.statusFilter() === "ALL") return this.loans();
    return this.loans().filter((l) => l.status === this.statusFilter());
  });

  pendingCount = computed(
    () =>
      this.loans().filter(
        (l) => l.status === "PENDING" || l.status === "OPS_REVIEW",
      ).length,
  );
  onStatusFilterChange(
    val:
      "ALL" | "PENDING" | "OPS_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED",
  ) {
    this.statusFilter.set(val);
    this.resetPages();
  }

  private resetPages() {
    this.rawAppendedLoans.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  async approve(loan: Loan) {
    const name = loan.userName || "applicant";
    const amount = loan.amount.toLocaleString("en-NG");
    const ok = await this.confirm.ask({
      title: `Approve ₦${amount} loan for ${name}?`,
      message: "It's disbursed after the 24-hour cooling-off period.",
      confirmLabel: "Approve",
      tone: "primary",
    });
    if (ok)
      this.approveMutation.mutate({
        loanId: loan.id,
        amount: loan.amount,
        name,
      });
  }

  async reject(loan: Loan) {
    const name = loan.userName || "applicant";
    const ok = await this.confirm.ask({
      title: `Reject loan for ${name}?`,
      message: "The applicant is notified with the reason you provide.",
      confirmLabel: "Reject",
      tone: "danger",
      reasonLabel: "Reason shown to the applicant",
      reasonPlaceholder: "e.g. Insufficient credit history",
    });
    if (ok)
      this.rejectMutation.mutate({ loanId: loan.id, reason: ok.reason, name });
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.loansQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getLoans({
        status: this.statusFilter() === "ALL" ? undefined : this.statusFilter(),
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedLoans.update((prev) => [
            ...prev,
            ...(res.items || []),
          ]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more loans");
        },
      });
  }

  viewLoan(loan: Loan) {
    this.selectedLoan.set(loan);
  }
}
