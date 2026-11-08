import { Component, DestroyRef, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
  keepPreviousData,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideBan as Ban,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideCircleCheck as CircleCheck,
  LucideDownload as Download,
  LucideEye as Eye,
  LucideLoaderCircle as LoaderCircle,
  LucideSearch as Search,
  LucideSearchX as SearchX,
  LucideUsers as Users,
  LucideX as X,
} from "@lucide/angular";
import { AdminService, User } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { ModalDirective } from "../../directives/modal.directive";
import { ConfirmService } from "../../services/confirm.service";
import { downloadCsv } from "../../core/csv";

@Component({
  selector: "app-users",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    StatusChipComponent,
    PageHeaderComponent,
    TooltipDirective,
    CopyToClipboardDirective,
    ModalDirective,
  ],
  template: `
    <app-page-header
      title="Users"
      [icon]="UsersIcon"
      subtitle="Manage user accounts and KYC status"
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
      <!-- Users table -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">All users</h2>
          <div
            class="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center"
          >
            <div class="ui-search w-full lg:w-64">
              <svg [lucideIcon]="SearchIcon" [size]="15"></svg>
              <input
                type="text"
                class="ui-input"
                [ngModel]="searchInput()"
                (ngModelChange)="onSearch($event)"
                placeholder="Search by name, email, phone..."
                (keydown.escape)="clearSearch()"
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
              class="ui-input w-full cursor-pointer lg:w-auto"
              [ngModel]="kycFilter()"
              (ngModelChange)="onKycChange($event)"
            >
              <option value="">All tiers</option>
              <option value="TIER_0">Tier 0</option>
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
              <option value="TIER_3">Tier 3</option>
            </select>
            <div class="ui-tabs">
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === ''"
                (click)="onStatusChange('')"
              >
                All
              </button>
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === 'ACTIVE'"
                (click)="onStatusChange('ACTIVE')"
              >
                Active
              </button>
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === 'SUSPENDED'"
                (click)="onStatusChange('SUSPENDED')"
              >
                Suspended
              </button>
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === 'PENDING'"
                (click)="onStatusChange('PENDING')"
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        <div class="ui-panel-body overflow-hidden">
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[760px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th class="hidden md:table-cell">Contact</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">KYC</th>
                  <th>Balance</th>
                  <th class="hidden md:table-cell">Joined</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4, 5]; track n; let i = $index) {
                    <tr>
                      <td><div class="ui-skel h-4 w-32"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-40"></div>
                      </td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-5 w-16 rounded-full"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-20"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td><div class="ui-skel ml-auto h-4 w-8"></div></td>
                    </tr>
                  }
                } @else if (usersQuery.isError()) {
                  <tr>
                    <td [attr.colspan]="7">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load users.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="usersQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (user of users(); track user.id; let i = $index) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-2.5">
                          <span class="ui-avatar"
                            >{{ user.firstName[0] }}{{ user.lastName[0] }}</span
                          >
                          <div class="min-w-0">
                            <button
                              type="button"
                              class="truncate text-left font-medium text-ui-ink hover:text-ui-accent"
                              [title]="user.firstName + ' ' + user.lastName"
                              (click)="viewUser(user)"
                            >
                              {{ user.firstName }} {{ user.lastName }}
                            </button>
                            <p
                              class="max-w-[180px] cursor-pointer truncate text-xs text-ui-muted transition-colors hover:text-ui-accent"
                              tooltip="Click to copy user ID"
                              tooltipPosition="bottom"
                              [copyToClipboard]="user.id"
                            >
                              ID: {{ user.id }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">
                        <p
                          class="max-w-[180px] cursor-pointer truncate text-ui-ink transition-colors hover:text-ui-accent"
                          tooltip="Click to copy email"
                          tooltipPosition="bottom"
                          [copyToClipboard]="user.email"
                        >
                          {{ user.email }}
                        </p>
                        <p
                          class="cursor-pointer text-xs text-ui-muted transition-colors hover:text-ui-accent"
                          tooltip="Click to copy phone"
                          tooltipPosition="bottom"
                          [copyToClipboard]="user.phone"
                        >
                          {{ user.phone }}
                        </p>
                      </td>
                      <td><app-status-chip [status]="user.status" /></td>
                      <td class="hidden md:table-cell">
                        <span class="ui-badge ui-badge-neutral">{{
                          tierLabel(user.kycTier)
                        }}</span>
                      </td>
                      <td class="whitespace-nowrap tabular-nums text-ui-ink">
                        ₦{{ user.walletBalance | number: "1.0-0" : "en-NG" }}
                      </td>
                      <td
                        class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                      >
                        {{ user.createdAt | date: "mediumDate" }}
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="viewUser(user)"
                            tooltip="View user details"
                            tooltipPosition="left"
                            aria-label="View user details"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                          @if (user.status === "ACTIVE") {
                            <button
                              type="button"
                              class="ui-icon-btn hover:bg-ui-danger-soft hover:text-ui-danger"
                              (click)="suspend(user)"
                              [disabled]="
                                suspendMutation.isPending() &&
                                suspendMutation.variables()?.userId === user.id
                              "
                              tooltip="Suspend user account"
                              tooltipPosition="left"
                              aria-label="Suspend user account"
                            >
                              @if (
                                suspendMutation.isPending() &&
                                suspendMutation.variables()?.userId === user.id
                              ) {
                                <svg
                                  [lucideIcon]="LoaderIcon"
                                  [size]="16"
                                  class="animate-spin"
                                ></svg>
                              } @else {
                                <svg [lucideIcon]="BanIcon" [size]="16"></svg>
                              }
                            </button>
                          } @else {
                            <button
                              type="button"
                              class="ui-icon-btn hover:bg-ui-success-soft hover:text-ui-success"
                              (click)="reactivate(user)"
                              [disabled]="
                                reactivateMutation.isPending() &&
                                reactivateMutation.variables()?.userId ===
                                  user.id
                              "
                              tooltip="Reactivate user account"
                              tooltipPosition="left"
                              aria-label="Reactivate user account"
                            >
                              @if (
                                reactivateMutation.isPending() &&
                                reactivateMutation.variables()?.userId ===
                                  user.id
                              ) {
                                <svg
                                  [lucideIcon]="LoaderIcon"
                                  [size]="16"
                                  class="animate-spin"
                                ></svg>
                              } @else {
                                <svg
                                  [lucideIcon]="CircleCheckIcon"
                                  [size]="16"
                                ></svg>
                              }
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
                @if (
                  !loading() && !usersQuery.isError() && users().length === 0
                ) {
                  <tr>
                    <td [attr.colspan]="7">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="SearchXIcon"
                          [size]="28"
                          class="text-ui-faint"
                        ></svg>
                        <p>No users found matching your criteria</p>
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
              </tbody>
            </table>
          </div>

          <!-- Pagination / Load more -->
          <div class="ui-table-foot">
            <p>
              Showing {{ users().length }} users{{
                hasMore() ? " · more available" : ""
              }}
            </p>
            @if (hasMore()) {
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
            }
          </div>
        </div>
      </section>
    </div>

    <!-- User detail modal -->
    @if (selectedUserId()) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="closeUserDetail()"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="closeUserDetail()"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">User Details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="closeUserDetail()"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body">
            @if (userDetailQuery.isPending()) {
              <div class="space-y-3 py-2">
                <div class="ui-skel h-12 w-12 rounded-full"></div>
                <div class="ui-skel h-4 w-40"></div>
                <div class="ui-skel h-4 w-56"></div>
                <div class="ui-skel h-4 w-32"></div>
              </div>
            } @else if (userDetailQuery.isError()) {
              <div class="ui-empty">
                <svg
                  [lucideIcon]="CircleAlertIcon"
                  [size]="28"
                  class="text-ui-danger"
                ></svg>
                <p>Failed to load user details</p>
                <button
                  type="button"
                  class="ui-btn ui-btn-sm"
                  (click)="userDetailQuery.refetch()"
                >
                  Try again
                </button>
              </div>
            } @else {
              @if (userDetailQuery.data(); as detail) {
                <div class="space-y-5">
                  <!-- Identity -->
                  <div class="flex items-center gap-3">
                    <span class="ui-avatar h-12 w-12 text-sm"
                      >{{ detail.firstName[0] }}{{ detail.lastName[0] }}</span
                    >
                    <div class="min-w-0">
                      <p class="truncate text-base font-semibold text-ui-ink">
                        {{ detail.firstName }} {{ detail.lastName }}
                      </p>
                      <p
                        class="cursor-pointer truncate text-xs text-ui-muted transition-colors hover:text-ui-accent"
                        tooltip="Click to copy user ID"
                        tooltipPosition="bottom"
                        [copyToClipboard]="detail.id"
                      >
                        ID: {{ detail.id }}
                      </p>
                    </div>
                    <div
                      class="ml-auto flex shrink-0 flex-col items-end gap-1.5"
                    >
                      <app-status-chip [status]="detail.status" />
                      <span class="ui-badge ui-badge-neutral">{{
                        tierLabel(detail.kycTier)
                      }}</span>
                    </div>
                  </div>

                  <!-- Contact & wallet -->
                  <dl class="ui-dl">
                    <div class="min-w-0">
                      <dt class="ui-dt">Email</dt>
                      <dd
                        class="ui-dd cursor-pointer truncate transition-colors hover:text-ui-accent"
                        tooltip="Click to copy email"
                        tooltipPosition="top"
                        [copyToClipboard]="detail.email"
                      >
                        {{ detail.email }}
                      </dd>
                    </div>
                    <div>
                      <dt class="ui-dt">Phone</dt>
                      <dd
                        class="ui-dd cursor-pointer transition-colors hover:text-ui-accent"
                        tooltip="Click to copy phone"
                        tooltipPosition="top"
                        [copyToClipboard]="detail.phoneNumber"
                      >
                        {{ detail.phoneNumber }}
                      </dd>
                    </div>
                    <div>
                      <dt class="ui-dt">Wallet Balance</dt>
                      <dd class="ui-dd tabular-nums">
                        ₦{{ detail.walletBalance | number: "1.0-0" : "en-NG" }}
                      </dd>
                    </div>
                    <div>
                      <dt class="ui-dt">Joined</dt>
                      <dd class="ui-dd">
                        {{ detail.createdAt | date: "mediumDate" }}
                      </dd>
                    </div>
                  </dl>

                  @if (detail.status === "SUSPENDED") {
                    <div class="ui-alert ui-alert-danger">
                      <svg
                        [lucideIcon]="BanIcon"
                        [size]="16"
                        class="mt-0.5 shrink-0"
                      ></svg>
                      <div class="min-w-0">
                        <p class="font-medium">Suspended</p>
                        @if (detail.suspensionReason) {
                          <p class="mt-1 text-ui-body">
                            {{ detail.suspensionReason }}
                          </p>
                        }
                        @if (detail.suspendedAt) {
                          <p class="mt-1 text-xs text-ui-muted">
                            {{ detail.suspendedAt | date: "medium" }}
                          </p>
                        }
                      </div>
                    </div>
                  }

                  <!-- Recent transactions -->
                  <div>
                    <h3 class="mb-2 text-[13px] font-semibold text-ui-ink">
                      Recent Transactions
                    </h3>
                    @if (detail.recentTransactions.length === 0) {
                      <p class="text-sm text-ui-muted">No transactions yet</p>
                    } @else {
                      <div
                        class="divide-y divide-ui-line rounded-xl border border-ui-line"
                      >
                        @for (txn of detail.recentTransactions; track txn.id) {
                          <div
                            class="flex items-center justify-between gap-3 px-3 py-2.5"
                          >
                            <div class="min-w-0">
                              <p
                                class="truncate text-sm font-medium text-ui-ink"
                              >
                                {{ txn.description }}
                              </p>
                              <p class="truncate text-xs text-ui-muted">
                                {{ txn.reference }} ·
                                {{ txn.createdAt | date: "short" }}
                              </p>
                            </div>
                            <div
                              class="flex shrink-0 flex-col items-end gap-1 text-right"
                            >
                              <p
                                class="whitespace-nowrap text-sm tabular-nums text-ui-ink"
                              >
                                ₦{{ txn.amount | number: "1.0-0" : "en-NG" }}
                              </p>
                              <app-status-chip [status]="txn.status" />
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Loans -->
                  <div>
                    <h3 class="mb-2 text-[13px] font-semibold text-ui-ink">
                      Loans
                    </h3>
                    @if (detail.loans.length === 0) {
                      <p class="text-sm text-ui-muted">No loans on record</p>
                    } @else {
                      <div
                        class="divide-y divide-ui-line rounded-xl border border-ui-line"
                      >
                        @for (loan of detail.loans; track loan.id) {
                          <div
                            class="flex items-center justify-between gap-3 px-3 py-2.5"
                          >
                            <div class="min-w-0">
                              <p
                                class="truncate text-sm font-medium text-ui-ink"
                              >
                                {{ loan.schoolName }}
                              </p>
                              <p class="text-xs text-ui-muted">
                                {{ loan.submittedAt | date: "mediumDate" }}
                              </p>
                            </div>
                            <div
                              class="flex shrink-0 flex-col items-end gap-1 text-right"
                            >
                              <p
                                class="whitespace-nowrap text-sm tabular-nums text-ui-ink"
                              >
                                ₦{{ loan.amount | number: "1.0-0" : "en-NG" }}
                              </p>
                              <app-status-chip [status]="loan.status" />
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- KYC history -->
                  <div>
                    <h3 class="mb-2 text-[13px] font-semibold text-ui-ink">
                      KYC Verifications
                    </h3>
                    @if (detail.kycVerifications.length === 0) {
                      <p class="text-sm text-ui-muted">
                        No KYC submissions yet
                      </p>
                    } @else {
                      <div
                        class="divide-y divide-ui-line rounded-xl border border-ui-line"
                      >
                        @for (kyc of detail.kycVerifications; track kyc.id) {
                          <div
                            class="flex items-center justify-between gap-3 px-3 py-2.5"
                          >
                            <div class="min-w-0">
                              <p
                                class="truncate text-sm font-medium text-ui-ink"
                              >
                                {{ kyc.idType }} · {{ kyc.requestedTier }}
                              </p>
                              <p class="text-xs text-ui-muted">
                                {{ kyc.createdAt | date: "mediumDate" }}
                              </p>
                            </div>
                            <app-status-chip [status]="kyc.status" />
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
          @if (userDetailQuery.data(); as detail) {
            <div class="ui-modal-foot">
              @if (detail.status === "ACTIVE") {
                <button
                  type="button"
                  class="ui-btn ui-btn-danger"
                  (click)="suspend(detail)"
                  [disabled]="
                    suspendMutation.isPending() &&
                    suspendMutation.variables()?.userId === detail.id
                  "
                >
                  {{
                    suspendMutation.isPending() &&
                    suspendMutation.variables()?.userId === detail.id
                      ? "Suspending…"
                      : "Suspend"
                  }}
                </button>
              } @else {
                <button
                  type="button"
                  class="ui-btn"
                  (click)="reactivate(detail)"
                  [disabled]="
                    reactivateMutation.isPending() &&
                    reactivateMutation.variables()?.userId === detail.id
                  "
                >
                  {{
                    reactivateMutation.isPending() &&
                    reactivateMutation.variables()?.userId === detail.id
                      ? "Reactivating…"
                      : "Reactivate"
                  }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class UsersPageComponent {
  readonly UsersIcon = Users;
  readonly DownloadIcon = Download;
  readonly SearchIcon = Search;
  readonly SearchXIcon = SearchX;
  readonly EyeIcon = Eye;
  readonly BanIcon = Ban;
  readonly CircleCheckIcon = CircleCheck;
  readonly CircleAlertIcon = CircleAlert;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderIcon = LoaderCircle;
  readonly XIcon = X;

  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();
  private confirm = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);
  readonly pageSize = 20;
  searchInput = signal("");
  searchQuery = signal("");
  statusFilter = signal("");
  kycFilter = signal("");
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
  }

  usersQuery = injectQuery(() => ({
    queryKey: [
      "users",
      {
        search: this.searchQuery(),
        status: this.statusFilter(),
        kycTier: this.kycFilter(),
      },
    ],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getUsers({
          ...this.searchParams(),
          status: this.statusFilter() || undefined,
          kycTier: this.kycFilter() || undefined,
          limit: this.pageSize,
        }),
      ),
    placeholderData: keepPreviousData,
  }));

  suspendMutation = injectMutation(() => ({
    mutationFn: ({
      userId,
      reason,
    }: {
      userId: string;
      userName: string;
      reason: string;
    }) => lastValueFrom(this.adminService.suspendUser(userId, reason)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `${userName} suspended`);
      this.queryClient.invalidateQueries({ queryKey: ["users"] });
      this.resetPages();
      if (this.selectedUserId()) this.userDetailQuery.refetch();
    },
    onError: (err: unknown) => {
      const httpErr = err as {
        status?: number;
        statusCode?: number;
        error?: { message?: string };
        message?: string;
      };
      if (httpErr?.status === 403 || httpErr?.statusCode === 403) {
        this.toast.show(
          "error",
          "Insufficient role: only OPS and COMPLIANCE can suspend users.",
        );
      } else {
        this.toast.show(
          "error",
          httpErr?.error?.message ||
            httpErr?.message ||
            "Failed to suspend user",
        );
      }
    },
  }));

  reactivateMutation = injectMutation(() => ({
    mutationFn: ({ userId }: { userId: string; userName: string }) =>
      lastValueFrom(this.adminService.reactivateUser(userId)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `${userName} reactivated`);
      this.queryClient.invalidateQueries({ queryKey: ["users"] });
      this.resetPages();
      if (this.selectedUserId()) this.userDetailQuery.refetch();
    },
    onError: (err: unknown) => {
      const httpErr = err as {
        status?: number;
        statusCode?: number;
        error?: { message?: string };
        message?: string;
      };
      if (httpErr?.status === 403 || httpErr?.statusCode === 403) {
        this.toast.show(
          "error",
          "Insufficient role: only OPS and COMPLIANCE can reactivate users.",
        );
      } else {
        this.toast.show(
          "error",
          httpErr?.error?.message ||
            httpErr?.message ||
            "Failed to reactivate user",
        );
      }
    },
  }));

  loading = computed(() => this.usersQuery.isPending());

  rawAppendedUsers = signal<User[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.usersQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  users = computed(() => {
    const response = this.usersQuery.data();
    const queryItems =
      response?.items ||
      (response as unknown as { content?: User[] })?.content ||
      [];
    const all = [...queryItems, ...this.rawAppendedUsers()];

    return all.map((u: User) => ({
      id: u.id,
      firstName: u.firstName || "User",
      lastName: u.lastName || "",
      email: u.email,
      phone: u.phoneNumber || "N/A",
      status: u.status || "ACTIVE",
      kycTier: u.kycTier,
      createdAt: u.createdAt,
      walletBalance: u.walletBalance || 0,
    }));
  });

  onSearch(value: string) {
    this.searchInput.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchQuery.set(value.trim());
      this.resetPages();
    }, 300);
  }

  clearSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchInput.set("");
    this.searchQuery.set("");
    this.resetPages();
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.resetPages();
  }

  onKycChange(value: string) {
    this.kycFilter.set(value);
    this.resetPages();
  }

  filtersActive() {
    return !!(this.searchQuery() || this.statusFilter() || this.kycFilter());
  }

  clearFilters() {
    this.clearSearch();
    this.statusFilter.set("");
    this.kycFilter.set("");
    this.resetPages();
  }

  private searchParams() {
    const value = this.searchQuery().trim();
    return /^\+?[\d\s-]{6,}$/.test(value)
      ? { phoneNumber: value || undefined }
      : { search: value || undefined };
  }

  private resetPages() {
    this.rawAppendedUsers.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  tierLabel(tier: string) {
    return tier?.replace("TIER_", "Tier ") || "—";
  }

  exportCsv() {
    downloadCsv("users", this.users(), [
      { label: "Name", value: (u) => `${u.firstName} ${u.lastName}`.trim() },
      { label: "Email", value: (u) => u.email },
      { label: "Phone", value: (u) => u.phone },
      { label: "Status", value: (u) => u.status },
      { label: "KYC tier", value: (u) => u.kycTier },
      { label: "Wallet balance (NGN)", value: (u) => u.walletBalance },
      { label: "Joined", value: (u) => u.createdAt },
    ]);
  }

  async suspend(user: { id: string; firstName: string; lastName: string }) {
    const name = `${user.firstName} ${user.lastName}`.trim();
    const ok = await this.confirm.ask({
      title: `Suspend ${name}?`,
      message:
        "They can't sign in or move money until an admin reactivates them.",
      confirmLabel: "Suspend",
      tone: "danger",
      reasonLabel: "Reason",
      reasonPlaceholder: "e.g. Suspected fraud",
    });
    if (!ok) return;
    this.suspendMutation.mutate({
      userId: user.id,
      userName: name,
      reason: ok.reason,
    });
  }

  async reactivate(user: { id: string; firstName: string; lastName: string }) {
    const name = `${user.firstName} ${user.lastName}`.trim();
    const ok = await this.confirm.ask({
      title: `Reactivate ${name}?`,
      message: "They can sign in and use their wallet again.",
      confirmLabel: "Reactivate",
      tone: "primary",
    });
    if (!ok) return;
    this.reactivateMutation.mutate({ userId: user.id, userName: name });
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.usersQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getUsers({
        ...this.searchParams(),
        status: this.statusFilter() || undefined,
        kycTier: this.kycFilter() || undefined,
        limit: this.pageSize,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedUsers.update((prev) => [
            ...prev,
            ...(res.items || []),
          ]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more users");
        },
      });
  }

  selectedUserId = signal<string | null>(null);

  userDetailQuery = injectQuery(() => ({
    queryKey: ["user-detail", this.selectedUserId()],
    queryFn: () =>
      lastValueFrom(this.adminService.getUserDetail(this.selectedUserId()!)),
    enabled: () => !!this.selectedUserId(),
  }));

  viewUser(user: { id: string }) {
    this.selectedUserId.set(user.id);
  }

  closeUserDetail() {
    this.selectedUserId.set(null);
  }
}
