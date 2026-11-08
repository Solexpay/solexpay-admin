import { Component, inject, computed, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideBadgeCheck as BadgeCheck,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideClock as Clock,
  LucideEye as Eye,
  LucideFileText as FileText,
  LucideLoaderCircle as LoaderCircle,
  LucideShieldCheck as ShieldCheck,
  LucideUsers as Users,
  LucideX as X,
} from "@lucide/angular";
import { AdminService, KycItem } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { MetricCardComponent } from "../../components/ui/metric-card.component";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";

@Component({
  selector: "app-kyc",
  imports: [
    CommonModule,
    LucideDynamicIcon,
    StatusChipComponent,
    PageHeaderComponent,
    MetricCardComponent,
    TooltipDirective,
    CopyToClipboardDirective,
    ModalDirective,
  ],
  template: `
    <app-page-header
      title="KYC Verification Queue"
      [icon]="ShieldCheckIcon"
      subtitle="Review and approve identity verifications"
    >
      <span class="ui-badge ui-badge-warning"
        >{{ pendingCount() }}{{ hasMore() ? "+" : "" }}
        {{
          statusFilter() === "PENDING"
            ? "Pending"
            : statusFilter() === "APPROVED"
              ? "Approved"
              : "Rejected"
        }}</span
      >
    </app-page-header>

    <div class="space-y-4">
      <!-- Stats -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Overview</h2>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <app-metric-card
            label="In queue"
            [icon]="UsersIcon"
            [value]="kycQueue().length"
            [suffix]="hasMore() ? '+' : ''"
          />
          <app-metric-card
            label="Oldest waiting"
            [icon]="ClockIcon"
            [value]="oldestWaiting().value"
            [suffix]="oldestWaiting().unit"
          />
        </div>
      </section>

      <!-- KYC Queue -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">KYC queue</h2>
          <div class="ui-tabs">
            @for (tab of statusTabs; track tab.value) {
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="statusFilter() === tab.value"
                (click)="onStatusChange(tab.value)"
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
                  <th>User</th>
                  <th class="hidden md:table-cell">Verification Type</th>
                  <th class="hidden md:table-cell">Document Number</th>
                  <th class="hidden md:table-cell">Submitted</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4]; track n) {
                    <tr>
                      <td><div class="ui-skel h-4 w-32"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-20"></div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-28"></div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td><div class="ui-skel ml-auto h-4 w-24"></div></td>
                    </tr>
                  }
                } @else if (kycQuery.isError()) {
                  <tr>
                    <td colspan="6">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load KYC verifications.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="kycQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (item of kycQueue(); track item.id) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-2.5">
                          <span class="ui-avatar">{{ item.userName[0] }}</span>
                          <div class="min-w-0">
                            <button
                              type="button"
                              class="truncate text-left font-medium text-ui-ink hover:text-ui-accent"
                              [title]="item.userName"
                              (click)="viewDetails(item)"
                            >
                              {{ item.userName }}
                            </button>
                            <p
                              class="truncate text-xs text-ui-muted"
                              [copyToClipboard]="item.userId"
                            >
                              User ID: {{ item.userId }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">{{ item.type }}</td>
                      <td class="hidden md:table-cell">
                        <span
                          class="cursor-pointer truncate font-mono text-ui-ink transition-colors hover:text-ui-accent"
                          [copyToClipboard]="item.documentNumber"
                          tooltip="Click to copy document number"
                          tooltipPosition="left"
                          [title]="maskNumber(item.documentNumber)"
                          >{{ maskNumber(item.documentNumber) }}</span
                        >
                        <div class="mt-1.5 flex flex-wrap gap-1">
                          @for (doc of item.documents; track doc) {
                            <span class="ui-badge ui-badge-neutral">
                              <svg
                                [lucideIcon]="FileTextIcon"
                                [size]="14"
                              ></svg>
                              {{ doc }}
                            </span>
                          }
                        </div>
                      </td>
                      <td
                        class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                      >
                        {{ item.submittedAt | date: "short" }}
                      </td>
                      <td><app-status-chip [status]="item.status" /></td>
                      <td>
                        <div
                          class="flex items-center justify-end gap-1.5 whitespace-nowrap"
                        >
                          @if (item.status === "PENDING") {
                            <button
                              type="button"
                              class="ui-btn ui-btn-primary ui-btn-sm"
                              (click)="approve(item)"
                              [disabled]="
                                approveMutation.isPending() &&
                                approveMutation.variables()?.id === item.id
                              "
                              tooltip="Approve this KYC verification"
                              tooltipPosition="bottom"
                            >
                              {{
                                approveMutation.isPending() &&
                                approveMutation.variables()?.id === item.id
                                  ? "Approving…"
                                  : "Approve"
                              }}
                            </button>
                            <button
                              type="button"
                              class="ui-btn ui-btn-danger ui-btn-sm"
                              (click)="reject(item)"
                              [disabled]="
                                rejectMutation.isPending() &&
                                rejectMutation.variables()?.id === item.id
                              "
                              tooltip="Reject this KYC verification"
                              tooltipPosition="bottom"
                            >
                              {{
                                rejectMutation.isPending() &&
                                rejectMutation.variables()?.id === item.id
                                  ? "Rejecting…"
                                  : "Reject"
                              }}
                            </button>
                          }
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="viewDetails(item)"
                            tooltip="View detailed information"
                            tooltipPosition="left"
                            aria-label="View detailed information"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="6">
                        <div class="ui-empty">
                          @if (statusFilter() === "PENDING") {
                            <img
                              src="/art/all-clear.webp"
                              alt=""
                              width="72"
                              height="72"
                              class="h-[72px] w-[72px] object-contain"
                            />
                            <p class="font-medium text-ui-ink">Queue clear</p>
                            <p>No verifications are waiting for review.</p>
                          } @else {
                            <svg
                              [lucideIcon]="BadgeCheckIcon"
                              [size]="28"
                              class="text-ui-faint"
                            ></svg>
                            <p>{{ emptyMessage() }}</p>
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
              <p>{{ kycQueue().length }} shown</p>
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

    @if (selectedItem(); as item) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedItem.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedItem.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">KYC details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              aria-label="Close"
              (click)="selectedItem.set(null)"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>
          <div class="ui-modal-body space-y-4">
            <dl class="ui-dl">
              <div>
                <dt class="ui-dt">User</dt>
                <dd class="ui-dd">{{ item.userName }}</dd>
              </div>
              <div>
                <dt class="ui-dt">User ID</dt>
                <dd class="ui-dd" [copyToClipboard]="item.userId">
                  {{ item.userId }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Verification type</dt>
                <dd class="ui-dd">{{ item.type }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Document number</dt>
                <dd class="ui-dd flex items-center gap-2">
                  <span class="font-mono">{{
                    showDocumentNumber()
                      ? item.documentNumber
                      : maskNumber(item.documentNumber)
                  }}</span
                  ><button
                    type="button"
                    class="ui-btn ui-btn-sm"
                    [attr.aria-pressed]="showDocumentNumber()"
                    (click)="showDocumentNumber.update((v) => !v)"
                  >
                    {{ showDocumentNumber() ? "Hide" : "Show" }}
                  </button>
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Submitted</dt>
                <dd class="ui-dd">
                  {{ item.submittedAt | date: "mediumDate" }} ·
                  {{ ageLabel(item.submittedAt) }} ago
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Status</dt>
                <dd class="ui-dd">
                  <app-status-chip [status]="item.status" />
                </dd>
              </div>
              @if (item.failureReason) {
                <div class="sm:col-span-2">
                  <dt class="ui-dt">Failure reason</dt>
                  <dd class="ui-dd">{{ item.failureReason }}</dd>
                </div>
              }
            </dl>
            @if (item.documents?.length) {
              <div>
                <p class="ui-dt mb-2">Documents</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (doc of item.documents; track doc) {
                    <span class="ui-badge ui-badge-neutral"
                      ><svg [lucideIcon]="FileTextIcon" [size]="14"></svg
                      >{{ doc }}</span
                    >
                  }
                </div>
              </div>
            }
          </div>
          <div class="ui-modal-foot">
            @if (item.status === "PENDING") {
              <button
                type="button"
                class="ui-btn ui-btn-primary"
                (click)="approve(item)"
              >
                Approve</button
              ><button
                type="button"
                class="ui-btn ui-btn-danger"
                (click)="reject(item)"
              >
                Reject
              </button>
            }
            <button
              type="button"
              class="ui-btn"
              (click)="selectedItem.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class KycPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();
  private confirm = inject(ConfirmService);

  readonly ShieldCheckIcon = ShieldCheck;
  readonly UsersIcon = Users;
  readonly ClockIcon = Clock;
  readonly BadgeCheckIcon = BadgeCheck;
  readonly FileTextIcon = FileText;
  readonly EyeIcon = Eye;
  readonly LoaderIcon = LoaderCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly CircleAlertIcon = CircleAlert;
  readonly XIcon = X;

  statusFilter = signal<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  selectedItem = signal<KycItem | null>(null);
  showDocumentNumber = signal(false);
  readonly statusTabs = [
    { label: "Pending", value: "PENDING" as const },
    { label: "Approved", value: "APPROVED" as const },
    { label: "Rejected", value: "REJECTED" as const },
  ];

  kycQuery = injectQuery(() => ({
    queryKey: ["kyc-queue", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getKycQueue({
          status: this.statusFilter(),
          limit: 20,
        }),
      ),
  }));

  approveMutation = injectMutation(() => ({
    mutationFn: ({ id }: { id: string; userName: string }) =>
      lastValueFrom(this.adminService.approveKyc(id)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `KYC approved for ${userName}`);
      this.resetPages();
      this.selectedItem.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    },
    onError: () => this.toast.show("error", "Failed to approve KYC"),
  }));

  rejectMutation = injectMutation(() => ({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      userName: string;
      reason: string;
    }) => lastValueFrom(this.adminService.rejectKyc(id, reason)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `KYC rejected for ${userName}`);
      this.resetPages();
      this.selectedItem.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    },
    onError: () => this.toast.show("error", "Failed to reject KYC"),
  }));

  loading = computed(() => this.kycQuery.isPending());

  rawAppendedKyc = signal<KycItem[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.kycQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  kycQueue = computed<KycItem[]>(() => {
    const response = this.kycQuery.data();
    const initial =
      response?.items ||
      (response as unknown as { content?: KycItem[] })?.content ||
      (Array.isArray(response) ? response : []);
    return [...initial, ...this.rawAppendedKyc()];
  });

  pendingCount = computed(() => this.kycQueue().length);
  oldestWaiting = computed(() => {
    const submittedTimes = this.kycQueue()
      .map((item) => new Date(item.submittedAt).getTime())
      .filter(Number.isFinite);
    if (!submittedTimes.length) return { value: 0, unit: "h" };
    const oldest = Math.min(...submittedTimes);
    const hours = Math.max(0, Math.floor((Date.now() - oldest) / 3_600_000));
    return hours < 48
      ? { value: hours, unit: "h" }
      : { value: Math.floor(hours / 24), unit: "d" };
  });

  emptyMessage() {
    return `No ${this.statusFilter().toLowerCase()} verifications`;
  }

  ageLabel(value: string) {
    const hours = Math.max(
      0,
      Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000),
    );
    return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
  }

  private resetPages() {
    this.rawAppendedKyc.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  onStatusChange(status: "PENDING" | "APPROVED" | "REJECTED") {
    this.statusFilter.set(status);
    this.resetPages();
  }

  async approve(item: KycItem) {
    const ok = await this.confirm.ask({
      title: `Approve KYC for ${item.userName}?`,
      message: "Their account moves up to the tier this verification unlocks.",
      confirmLabel: "Approve",
      tone: "primary",
    });
    if (ok)
      this.approveMutation.mutate({ id: item.id, userName: item.userName });
  }

  async reject(item: KycItem) {
    const ok = await this.confirm.ask({
      title: `Reject KYC for ${item.userName}?`,
      message: "They see the reason and can submit a new verification.",
      confirmLabel: "Reject",
      tone: "danger",
      reasonLabel: "Reason shown to the user",
      reasonPlaceholder: "e.g. Name on ID doesn't match account name",
    });
    if (ok)
      this.rejectMutation.mutate({
        id: item.id,
        userName: item.userName,
        reason: ok.reason,
      });
  }

  maskNumber(number: string): string {
    if (number.length <= 4) return number;
    return "*".repeat(number.length - 4) + number.slice(-4);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.kycQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getKycQueue({
        status: this.statusFilter(),
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedKyc.update((prev) => [...prev, ...(res.items || [])]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more KYC submissions");
        },
      });
  }

  viewDetails(item: KycItem) {
    this.showDocumentNumber.set(false);
    this.selectedItem.set(item);
  }
}
