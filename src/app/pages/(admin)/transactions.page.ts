import { Component, DestroyRef, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  injectQuery,
  keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideIcon,
  LucideArrowLeftRight as ArrowLeftRight,
  LucideBanknote as Banknote,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideCirclePlus as CirclePlus,
  LucideCreditCard as CreditCard,
  LucideDownload as Download,
  LucideEye as Eye,
  LucideLandmark as Landmark,
  LucideLoaderCircle as LoaderCircle,
  LucideReceipt as Receipt,
  LucideReceiptText as ReceiptText,
  LucideSearch as Search,
  LucideSend as Send,
  LucideX as X,
} from "@lucide/angular";
import { AdminService, Transaction } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { downloadCsv } from "../../core/csv";

// The API wants RFC 3339 timestamps; the date inputs give YYYY-MM-DD, read
// as whole days in Lagos time (WAT, UTC+1, no daylight saving).
function dayStart(date: string): string | undefined {
  return date ? `${date}T00:00:00+01:00` : undefined;
}

function dayEnd(date: string): string | undefined {
  return date ? `${date}T23:59:59.999+01:00` : undefined;
}

@Component({
  selector: "app-transactions",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    MetricCardComponent,
    PageHeaderComponent,
    StatusChipComponent,
    ModalDirective,
    CopyToClipboardDirective,
  ],
  template: `
    <app-page-header
      title="Transaction Ledger"
      [icon]="ArrowLeftRightIcon"
      subtitle="View and search all system transactions"
    >
      <button
        type="button"
        class="ui-btn"
        (click)="exportCsv()"
        title="Exports the rows loaded on screen"
      >
        <svg [lucideIcon]="DownloadIcon" [size]="15"></svg>
        Export CSV
      </button>
    </app-page-header>

    <div class="space-y-4">
      <section class="ui-panel">
        <div class="ui-panel-head"><h2 class="ui-panel-title">Today</h2></div>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          @if (metricsQuery.isPending()) {
            @for (n of [1, 2]; track n) {
              <div class="rounded-xl border border-ui-line bg-white p-1.5">
                <div class="ui-skel mx-1.5 mb-3 mt-1.5 h-3 w-20"></div>
                <div class="ui-skel h-[68px] rounded-lg"></div>
              </div>
            }
          } @else {
            <app-metric-card
              label="Volume today"
              [icon]="BanknoteIcon"
              prefix="₦"
              [value]="metricsQuery.data()?.transactionVolumeToday ?? 0"
            />
            <app-metric-card
              label="Transactions today"
              [icon]="ArrowLeftRightIcon"
              [value]="metricsQuery.data()?.transactionCountToday ?? 0"
            />
          }
        </div>
      </section>

      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Transactions</h2>
          <div
            class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
          >
            <div class="ui-search sm:w-64">
              <svg [lucideIcon]="SearchIcon" [size]="15"></svg>
              <input
                type="text"
                [ngModel]="searchInput()"
                (ngModelChange)="onSearch($event)"
                (keydown.escape)="clearSearch()"
                class="ui-input"
                placeholder="Search by reference…"
              />
              @if (searchInput()) {
                <button
                  type="button"
                  aria-label="Clear search"
                  class="ui-icon-btn absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  (click)="clearSearch()"
                >
                  <svg [lucideIcon]="XIcon" [size]="14"></svg>
                </button>
              }
            </div>
            <select
              [ngModel]="typeFilter()"
              (ngModelChange)="onTypeChange($event)"
              class="ui-input sm:w-auto"
            >
              <option value="">All Types</option>
              <option value="WALLET_FUNDING">Wallet Funding</option>
              <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
              <option value="NIP_TRANSFER">Bank Transfer</option>
              <option value="LOAN_REPAYMENT">Loan Repayment</option>
              <option value="BILL_PAYMENT">Bill Payment</option>
            </select>
            <select
              [ngModel]="statusFilter()"
              (ngModelChange)="onStatusChange($event)"
              class="ui-input sm:w-auto"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
            <input
              type="date"
              [ngModel]="dateFrom()"
              (ngModelChange)="onDateFromChange($event)"
              class="ui-input sm:w-auto"
              aria-label="From date"
              [max]="dateTo() || null"
            />
            <input
              type="date"
              [ngModel]="dateTo()"
              (ngModelChange)="onDateToChange($event)"
              class="ui-input sm:w-auto"
              aria-label="To date"
              [min]="dateFrom() || null"
            />
          </div>
        </div>
        <div class="ui-panel-body overflow-hidden">
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[800px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th class="hidden md:table-cell">Type</th>
                  <th class="hidden md:table-cell">From/To</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Date</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4, 5]; track n) {
                    <tr>
                      <td><div class="ui-skel h-4 w-32"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-28"></div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-36"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-20"></div></td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td><div class="ui-skel ml-auto h-4 w-8"></div></td>
                    </tr>
                  }
                } @else if (transactionsQuery.isError()) {
                  <tr>
                    <td [attr.colspan]="7">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load transactions.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="transactionsQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (tx of transactions(); track tx.id) {
                    <tr>
                      <td>
                        <button
                          type="button"
                          class="max-w-[140px] truncate text-left font-mono text-[13px] text-ui-ink hover:text-ui-accent"
                          [title]="tx.reference"
                          (click)="viewTransaction(tx)"
                        >
                          {{ tx.reference }}
                        </button>
                        <p
                          class="max-w-[160px] truncate text-xs text-ui-muted"
                          [title]="tx.description"
                        >
                          {{ tx.description }}
                        </p>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="flex items-center gap-2">
                          <span class="ui-icon-tile"
                            ><svg
                              [lucideIcon]="
                                typeIcons[getTypeIcon(tx.type)] ??
                                CreditCardIcon
                              "
                              [size]="14"
                            ></svg></span
                          ><span class="whitespace-nowrap">{{
                            formatType(tx.type)
                          }}</span>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="flex items-center gap-2.5">
                          <span class="ui-avatar">{{
                            (tx.senderName || "?").charAt(0)
                          }}</span>
                          <div class="min-w-0">
                            <p
                              class="max-w-[140px] truncate font-medium text-ui-ink"
                              [title]="tx.senderName"
                            >
                              {{ tx.senderName }}
                            </p>
                            <p
                              class="max-w-[140px] truncate text-xs text-ui-muted"
                              [title]="tx.recipientName"
                            >
                              → {{ tx.recipientName }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="whitespace-nowrap tabular-nums text-ui-ink">
                        ₦{{ tx.amount | number: "1.0-0" : "en-NG" }}
                      </td>
                      <td><app-status-chip [status]="tx.status" /></td>
                      <td
                        class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                      >
                        {{ tx.createdAt | date: "short" }}
                      </td>
                      <td>
                        <div class="flex justify-end">
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="viewTransaction(tx)"
                            aria-label="View transaction"
                            title="View transaction"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="7">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="ReceiptTextIcon"
                            [size]="28"
                            class="text-ui-faint"
                          ></svg>
                          <p>No transactions found</p>
                          @if (filtersActive()) {
                            <button
                              type="button"
                              class="ui-btn ui-btn-sm"
                              (click)="clearFilters()"
                            >
                              Clear filters
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
          @if (transactions().length > 0) {
            <div class="ui-table-foot">
              <span>{{ transactions().length }} shown</span>
              @if (hasMore()) {
                <button
                  type="button"
                  (click)="loadMore()"
                  [disabled]="isLoadingMore()"
                  class="ui-btn ui-btn-sm"
                >
                  @if (isLoadingMore()) {
                    <svg
                      [lucideIcon]="LoaderIcon"
                      [size]="15"
                      class="animate-spin"
                    ></svg
                    ><span>Loading...</span>
                  } @else {
                    <span>Load more</span
                    ><svg [lucideIcon]="ChevronDownIcon" [size]="15"></svg>
                  }
                </button>
              }
            </div>
          }
        </div>
      </section>
    </div>

    @if (selectedTransactionId()) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="closeTransaction()"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="closeTransaction()"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Transaction Details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="closeTransaction()"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>
          <div class="ui-modal-body">
            @if (transactionDetailQuery.isPending()) {
              <div class="space-y-3 py-2">
                <div class="ui-skel h-4 w-48"></div>
                <div class="ui-skel h-4 w-32"></div>
                <div class="ui-skel h-20 w-full"></div>
                <div class="ui-skel h-4 w-40"></div>
              </div>
            } @else if (transactionDetailQuery.isError()) {
              <div class="ui-empty">
                <svg
                  [lucideIcon]="CircleAlertIcon"
                  [size]="28"
                  class="text-ui-danger"
                ></svg>
                <p>Failed to load transaction details</p>
                <button
                  type="button"
                  class="ui-btn ui-btn-sm"
                  (click)="transactionDetailQuery.refetch()"
                >
                  Try again
                </button>
              </div>
            } @else if (transactionDetailQuery.data(); as detail) {
              <div class="space-y-5">
                <dl class="ui-dl">
                  <div class="min-w-0">
                    <dt class="ui-dt">Reference</dt>
                    <dd
                      class="ui-dd cursor-pointer truncate"
                      [copyToClipboard]="detail.transaction.reference"
                      title="Click to copy reference"
                    >
                      {{ detail.transaction.reference }}
                    </dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Status</dt>
                    <dd class="ui-dd">
                      <app-status-chip [status]="detail.transaction.status" />
                    </dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Type</dt>
                    <dd class="ui-dd">
                      {{ formatType(detail.transaction.type) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Amount</dt>
                    <dd class="ui-dd tabular-nums">
                      ₦{{
                        detail.transaction.amount | number: "1.0-2" : "en-NG"
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Sender → Recipient</dt>
                    <dd class="ui-dd">
                      {{ detail.transaction.senderName }} →
                      {{ detail.transaction.recipientName }}
                    </dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Description</dt>
                    <dd class="ui-dd">{{ detail.transaction.description }}</dd>
                  </div>
                  <div>
                    <dt class="ui-dt">Created</dt>
                    <dd class="ui-dd">
                      {{ detail.transaction.createdAt | date: "medium" }}
                    </dd>
                  </div>
                </dl>
                <section>
                  <h3 class="mb-2 text-[13px] font-semibold text-ui-ink">
                    Ledger entries
                  </h3>
                  @if (detail.journals.length === 0) {
                    <p class="text-sm text-ui-muted">No ledger entries</p>
                  }
                  @for (journal of detail.journals; track journal.id) {
                    <div class="mb-3 rounded-xl border border-ui-line">
                      <div class="border-b border-ui-line px-3 py-2">
                        <p class="text-sm font-medium text-ui-ink">
                          {{ journal.kind }}
                        </p>
                        <p class="text-xs text-ui-muted">{{ journal.memo }}</p>
                      </div>
                      <div class="ui-table-wrap">
                        <table class="ui-table">
                          <thead>
                            <tr>
                              <th>Account code</th>
                              <th>Side</th>
                              <th>Amount</th>
                              <th>Balance after</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (line of journal.lines; track line.id) {
                              <tr>
                                <td>{{ line.accountCode }}</td>
                                <td>{{ line.side }}</td>
                                <td class="tabular-nums">
                                  ₦{{ line.amount | number: "1.0-2" : "en-NG" }}
                                </td>
                                <td class="tabular-nums">
                                  @if ((line.balanceAfter ?? null) === null) {
                                    —
                                  } @else {
                                    ₦{{
                                      line.balanceAfter
                                        | number: "1.0-2" : "en-NG"
                                    }}
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </section>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TransactionsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly DownloadIcon = Download;
  readonly BanknoteIcon = Banknote;
  readonly SearchIcon = Search;
  readonly ReceiptTextIcon = ReceiptText;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderIcon = LoaderCircle;
  readonly CreditCardIcon = CreditCard;
  readonly CircleAlertIcon = CircleAlert;
  readonly EyeIcon = Eye;
  readonly XIcon = X;
  readonly typeIcons: Record<string, LucideIcon> = {
    add_circle: CirclePlus,
    payments: Banknote,
    send_money: Send,
    account_balance: Landmark,
    receipt: Receipt,
    swap_horiz: ArrowLeftRight,
    payment: CreditCard,
  };

  dateFrom = signal(this.route.snapshot.queryParamMap.get("from") ?? "");
  dateTo = signal(this.route.snapshot.queryParamMap.get("to") ?? "");
  searchInput = signal(
    this.route.snapshot.queryParamMap.get("reference") ?? "",
  );
  referenceFilter = signal(this.searchInput().trim());
  typeFilter = signal(this.route.snapshot.queryParamMap.get("type") ?? "");
  statusFilter = signal(this.route.snapshot.queryParamMap.get("status") ?? "");
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
  }

  metricsQuery = injectQuery(() => ({
    queryKey: ["dashboard-metrics"],
    queryFn: () => lastValueFrom(this.adminService.getDashboardMetrics()),
  }));

  transactionsQuery = injectQuery(() => ({
    queryKey: [
      "transactions",
      {
        status: this.statusFilter(),
        type: this.typeFilter(),
        reference: this.referenceFilter(),
        from: this.dateFrom(),
        to: this.dateTo(),
      },
    ],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getTransactions({
          limit: 20,
          status: this.statusFilter() || undefined,
          type: this.typeFilter() || undefined,
          reference: this.referenceFilter() || undefined,
          from: dayStart(this.dateFrom()),
          to: dayEnd(this.dateTo()),
        }),
      ),
    placeholderData: keepPreviousData,
  }));

  selectedTransactionId = signal<string | null>(null);
  transactionDetailQuery = injectQuery(() => ({
    queryKey: ["transaction-detail", this.selectedTransactionId()],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getTransaction(this.selectedTransactionId()!),
      ),
    enabled: () => !!this.selectedTransactionId(),
  }));

  loading = computed(() => this.transactionsQuery.isPending());
  rawAppendedTransactions = signal<Transaction[]>([]);
  rawHasMore = signal<boolean | null>(null);
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);
  hasMore = computed(
    () => this.rawHasMore() ?? this.transactionsQuery.data()?.hasMore ?? false,
  );
  transactions = computed<Transaction[]>(() => {
    const response = this.transactionsQuery.data();
    const items =
      response?.items ||
      (response as unknown as { content?: Transaction[] })?.content ||
      [];
    return [...items, ...this.rawAppendedTransactions()];
  });

  onSearch(value: string) {
    this.searchInput.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.referenceFilter.set(value.trim());
      this.filtersChanged();
    }, 300);
  }
  clearSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchInput.set("");
    this.referenceFilter.set("");
    this.filtersChanged();
  }
  onTypeChange(value: string) {
    this.typeFilter.set(value);
    this.filtersChanged();
  }
  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.filtersChanged();
  }
  onDateFromChange(value: string) {
    this.dateFrom.set(value);
    this.filtersChanged();
  }
  onDateToChange(value: string) {
    this.dateTo.set(value);
    this.filtersChanged();
  }

  private filtersChanged() {
    this.resetPages();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: this.dateFrom() || null,
        to: this.dateTo() || null,
        status: this.statusFilter() || null,
        type: this.typeFilter() || null,
        reference: this.referenceFilter() || null,
      },
      replaceUrl: true,
    });
  }
  private resetPages() {
    this.rawAppendedTransactions.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }
  filtersActive() {
    return !!(
      this.referenceFilter() ||
      this.dateFrom() ||
      this.dateTo() ||
      this.statusFilter() ||
      this.typeFilter()
    );
  }
  clearFilters() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchInput.set("");
    this.referenceFilter.set("");
    this.dateFrom.set("");
    this.dateTo.set("");
    this.statusFilter.set("");
    this.typeFilter.set("");
    this.filtersChanged();
  }
  exportCsv() {
    downloadCsv("transactions", this.transactions(), [
      { label: "Reference", value: (tx) => tx.reference },
      { label: "Type", value: (tx) => tx.type },
      { label: "Sender", value: (tx) => tx.senderName },
      { label: "Recipient", value: (tx) => tx.recipientName },
      { label: "Amount", value: (tx) => tx.amount },
      { label: "Status", value: (tx) => tx.status },
      { label: "Created", value: (tx) => tx.createdAt },
    ]);
  }
  viewTransaction(tx: { id: string }) {
    this.selectedTransactionId.set(tx.id);
  }
  closeTransaction() {
    this.selectedTransactionId.set(null);
  }

  loadMore() {
    const cursor =
      this.nextCursor() ?? this.transactionsQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getTransactions({
        limit: 20,
        cursor,
        status: this.statusFilter() || undefined,
        type: this.typeFilter() || undefined,
        reference: this.referenceFilter() || undefined,
        from: dayStart(this.dateFrom()),
        to: dayEnd(this.dateTo()),
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedTransactions.update((prev) => [
            ...prev,
            ...(res.items || []),
          ]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: (err: unknown) => {
          this.isLoadingMore.set(false);
          const message = (err as { error?: { message?: string } })?.error
            ?.message;
          this.toast.show(
            "error",
            message || "Failed to load more transactions",
          );
        },
      });
  }

  formatType(type: string): string {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  getTypeIcon(type: string): string {
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
}
