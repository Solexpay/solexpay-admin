import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService, Loan } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";
import { CountUpDirective } from "../../directives/count-up.directive";

@Component({
  selector: "app-loans",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusChipComponent,
    RippleDirective,
    CountUpDirective,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            Loan Applications
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Review and manage student loan applications
          </p>
        </div>
      </div>

      <!-- Loan Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-primary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Pending Review
          </p>
          <p
            class="text-2xl font-bold text-on-surface mt-1"
            [countUp]="pendingCount()"
          >
            0
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-secondary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Total Portfolio
          </p>
          <p class="text-2xl font-bold text-on-surface mt-1">
            <span class="text-lg opacity-50">₦</span
            >{{ totalPortfolio() | number: "1.0-0" : "en-NG" }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-tertiary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Disbursed This Month
          </p>
          <p class="text-2xl font-bold text-on-surface mt-1">
            <span class="text-lg opacity-50">₦</span
            >{{ disbursedTotal() | number: "1.0-0" : "en-NG" }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-error shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">Overdue Loans</p>
          <p
            class="text-2xl font-bold text-on-surface mt-1"
            [countUp]="overdueCount()"
          >
            0
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <div class="flex gap-2 p-1 bg-surface-container rounded-xl">
          @for (tab of statusTabs; track tab.value) {
            <button
              (click)="statusFilter.set(tab.value)"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              [class]="
                statusFilter() === tab.value
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              "
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loans Table -->
      <div
        class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead>
              <tr class="bg-surface-container text-left">
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Applicant
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  School
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Tenor
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Credit Score
                </th>
                <th
                  class="px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (n of [1, 2, 3, 4]; track n; let i = $index) {
                  <tr class="border-t border-surface-container">
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-32 bg-surface-container-high rounded-full animate-skeleton-pulse"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-28 bg-surface-container-high rounded-full animate-skeleton-pulse"
                        [style.animation-delay]="100 + 'ms'"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-20 bg-surface-container-high rounded-full animate-skeleton-pulse"
                        [style.animation-delay]="200 + 'ms'"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-16 bg-surface-container-high rounded-full animate-skeleton-pulse"
                        [style.animation-delay]="300 + 'ms'"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-20 bg-surface-container-high rounded-full animate-skeleton-pulse"
                        [style.animation-delay]="400 + 'ms'"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-16 bg-surface-container-high rounded-full animate-skeleton-pulse"
                        [style.animation-delay]="500 + 'ms'"
                      ></div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div
                        class="h-4 w-16 bg-surface-container-high rounded-full ml-auto animate-skeleton-pulse"
                        [style.animation-delay]="600 + 'ms'"
                      ></div>
                    </td>
                  </tr>
                }
              } @else {
                @for (loan of filteredLoans(); track loan.id; let i = $index) {
                  <tr
                    class="border-t border-surface-container hover:bg-surface-container-low transition-colors duration-150 animate-stagger-in opacity-0"
                    [style.animation-delay]="i * 40 + 'ms'"
                    [style.animation-fill-mode]="'forwards'"
                  >
                    <td class="px-4 sm:px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0"
                        >
                          <span class="text-sm font-bold text-primary">{{
                            loan.userName[0]
                          }}</span>
                        </div>
                        <div class="min-w-0">
                          <p
                            class="text-sm font-semibold text-on-surface truncate"
                          >
                            {{ loan.userName }}
                          </p>
                          <p class="text-xs text-on-surface-variant truncate">
                            {{ loan.purpose }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm text-on-surface truncate max-w-[150px]">
                        {{ loan.schoolName }}
                      </p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm font-bold text-on-surface">
                        <span class="text-on-surface-variant">₦</span
                        >{{ loan.amount | number: "1.0-0" : "en-NG" }}
                      </p>
                      <p class="text-xs text-on-surface-variant">
                        {{ loan.interestRate }}% APR
                      </p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <p class="text-sm text-on-surface">
                        {{ loan.tenorMonths }} months
                      </p>
                      <p class="text-xs text-on-surface-variant">
                        ₦{{
                          loan.monthlyRepayment | number: "1.0-0" : "en-NG"
                        }}/mo
                      </p>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <app-status-chip [status]="loan.status"></app-status-chip>
                    </td>
                    <td class="px-4 sm:px-6 py-4">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-12 sm:w-16 h-2 bg-surface-container-high rounded-full overflow-hidden"
                        >
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            [class]="
                              loan.creditScore >= 700
                                ? 'bg-tertiary'
                                : loan.creditScore >= 500
                                  ? 'bg-secondary'
                                  : 'bg-error'
                            "
                            [style.width.%]="(loan.creditScore / 850) * 100"
                          ></div>
                        </div>
                        <span class="text-sm font-semibold text-on-surface">{{
                          loan.creditScore
                        }}</span>
                      </div>
                    </td>
                    <td class="px-4 sm:px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          (click)="viewLoan(loan)"
                          class="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="View Details"
                        >
                          <span
                            class="material-symbols-outlined text-on-surface-variant text-sm"
                            >visibility</span
                          >
                        </button>
                        @if (loan.status === "OPS_REVIEW") {
                          <button
                            solexRipple
                            (click)="approveMutation.mutate(loan.id)"
                            [disabled]="approveMutation.isPending()"
                            class="px-2 sm:px-3 py-1.5 bg-tertiary text-on-tertiary rounded-lg text-xs font-bold transition-all hover:brightness-110 disabled:opacity-50 whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            solexRipple
                            (click)="rejectMutation.mutate(loan.id)"
                            [disabled]="rejectMutation.isPending()"
                            class="px-2 sm:px-3 py-1.5 bg-error-container text-on-error-container rounded-lg text-xs font-bold transition-all hover:bg-error hover:text-on-error disabled:opacity-50 whitespace-nowrap"
                          >
                            Reject
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

        @if (!loading() && filteredLoans().length === 0) {
          <div class="text-center py-12">
            <span
              class="material-symbols-outlined text-4xl text-surface-variant"
              >credit_card_off</span
            >
            <p class="text-sm text-on-surface-variant mt-2">
              No loans found matching your criteria
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class LoansPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  statusFilter = signal<"ALL" | "PENDING" | "OPS_REVIEW" | "APPROVED">("ALL");

  readonly statusTabs = [
    { label: "All", value: "ALL" as const },
    { label: "Pending", value: "PENDING" as const },
    { label: "Ops Review", value: "OPS_REVIEW" as const },
    { label: "Approved", value: "APPROVED" as const },
  ];

  loansQuery = injectQuery(() => ({
    queryKey: ["loans", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getLoans(
          0,
          50,
          this.statusFilter() === "ALL" ? undefined : this.statusFilter(),
        ),
      ),
  }));

  overdueQuery = injectQuery(() => ({
    queryKey: ["loans-overdue"],
    queryFn: () => lastValueFrom(this.adminService.getOverdueLoans()),
    staleTime: 60_000,
  }));

  approveMutation = injectMutation(() => ({
    mutationFn: (loanId: string) =>
      lastValueFrom(this.adminService.approveLoan(loanId)),
    onSuccess: (_, loanId) => {
      this.toast.show("success", `Loan ${loanId} approved`);
      this.queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: () => this.toast.show("error", "Failed to approve loan"),
  }));

  rejectMutation = injectMutation(() => ({
    mutationFn: (loanId: string) =>
      lastValueFrom(
        this.adminService.rejectLoan(loanId, "Rejected by operations"),
      ),
    onSuccess: (_, loanId) => {
      this.toast.show("success", `Loan ${loanId} rejected`);
      this.queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: () => this.toast.show("error", "Failed to reject loan"),
  }));

  loading = computed(() => this.loansQuery.isPending());

  loans = computed<Loan[]>(() => {
    const response = this.loansQuery.data();
    if (response?.content) return response.content;
    if (response && Array.isArray(response)) return response;
    return [];
  });

  totalItems = computed(() => this.loansQuery.data()?.totalElements || 0);
  totalPages = computed(() => this.loansQuery.data()?.totalPages || 1);

  metrics = computed(() => {
    const overdue = this.overdueQuery.data();
    return {
      active: 204,
      overdue: overdue?.content?.length != null ? overdue.content.length : 18,
      totalDisbursed: 15600000,
    };
  });

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
  totalPortfolio = computed(() =>
    this.loans().reduce((sum, l) => sum + l.amount, 0),
  );
  disbursedTotal = computed(() =>
    this.loans()
      .filter((l) => l.status === "DISBURSED")
      .reduce((sum, l) => sum + l.amount, 0),
  );
  overdueCount = computed(() => {
    const overdue = this.overdueQuery.data();
    if (overdue?.content?.length != null) return overdue.content.length;
    return 0;
  });

  viewLoan(loan: Loan) {
    this.toast.show("info", `Viewing loan: ${loan.id}`);
  }
}
