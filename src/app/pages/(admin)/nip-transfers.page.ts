import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideEye as Eye,
  LucideLandmark as Landmark,
  LucideLoaderCircle as LoaderCircle,
  LucideSend as Send,
  LucideX as X,
} from "@lucide/angular";
import { AdminService, NipTransfer } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";

@Component({
  selector: "app-nip-transfers",
  imports: [
    CommonModule,
    LucideDynamicIcon,
    StatusChipComponent,
    PageHeaderComponent,
    ModalDirective,
    CopyToClipboardDirective,
  ],
  template: `
    <app-page-header
      title="NIP Transfers"
      [icon]="LandmarkIcon"
      subtitle="Read-only ledger of NIP inter-bank transfers and settlement responses"
    />

    <div class="space-y-4">
      <!-- Table -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">All transfers</h2>
          <div class="ui-tabs" role="tablist">
            @for (tab of statusTabs; track tab.value) {
              <button
                type="button"
                class="ui-tab"
                role="tab"
                [attr.aria-selected]="statusFilter() === tab.value"
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
            <table class="ui-table md:min-w-[900px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th class="hidden md:table-cell">Beneficiary</th>
                  <th class="hidden md:table-cell">Sender</th>
                  <th>Amount</th>
                  <th class="hidden md:table-cell">Fee</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Date</th>
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
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-28"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-16"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-12"></div>
                      </td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-20"></div>
                      </td>
                      <td><div class="ui-skel ml-auto h-4 w-8"></div></td>
                    </tr>
                  }
                } @else if (transfersQuery.isError()) {
                  <tr>
                    <td [attr.colspan]="8">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load NIP transfers.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="transfersQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (tx of transfers(); track tx.id) {
                    <tr>
                      <td>
                        <button
                          type="button"
                          class="font-mono text-[13px] font-medium text-ui-ink hover:text-ui-accent"
                          title="View full NIP details"
                          [copyToClipboard]="tx.reference"
                          (click)="selectedTransfer.set(tx)"
                        >
                          {{ tx.reference }}
                        </button>
                        @if (tx.anchorTransferId) {
                          <p class="font-mono text-xs text-ui-muted">
                            Anchor: {{ tx.anchorTransferId }}
                          </p>
                        }
                      </td>
                      <td class="hidden md:table-cell">
                        <p class="font-medium text-ui-ink">
                          {{ tx.accountName }}
                        </p>
                        <p class="text-xs text-ui-muted">
                          {{ maskAccount(tx.accountNumber) }} ·
                          {{ tx.bankName }}
                        </p>
                      </td>
                      <td class="hidden md:table-cell">
                        <p class="font-medium text-ui-ink">
                          {{ tx.userName }}
                        </p>
                        <p class="font-mono text-xs text-ui-muted">
                          {{ tx.userId }}
                        </p>
                      </td>
                      <td class="whitespace-nowrap tabular-nums text-ui-ink">
                        ₦{{ tx.amount | number: "1.0-0" : "en-NG" }}
                      </td>
                      <td
                        class="hidden whitespace-nowrap tabular-nums text-ui-ink md:table-cell"
                      >
                        ₦{{ tx.fee | number: "1.0-0" : "en-NG" }}
                      </td>
                      <td>
                        <div class="flex items-center gap-1.5">
                          <app-status-chip [status]="tx.status" />
                          @if (tx.stuckAlertedAt) {
                            <span
                              class="ui-badge ui-badge-warning"
                              [title]="
                                'Stuck alert sent ' +
                                (tx.stuckAlertedAt | date: 'medium')
                              "
                            >
                              Stuck
                            </span>
                          }
                        </div>
                      </td>
                      <td
                        class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                      >
                        {{ tx.createdAt | date: "short" }}
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="selectedTransfer.set(tx)"
                            title="View Full NIP Details"
                            aria-label="View Full NIP Details"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="8">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="SendIcon"
                            [size]="28"
                            class="text-ui-faint"
                          ></svg>
                          <p>No NIP transfers found</p>
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
              <p>{{ transfers().length }} shown</p>
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

    <!-- Detail Modal -->
    @if (selectedTransfer()) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedTransfer.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedTransfer.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">NIP Transfer Details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="selectedTransfer.set(null)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body">
            <dl class="ui-dl">
              <div>
                <dt class="ui-dt">Reference</dt>
                <dd
                  class="ui-dd font-mono"
                  [copyToClipboard]="selectedTransfer()!.reference"
                >
                  {{ selectedTransfer()!.reference }}
                </dd>
              </div>
              @if (selectedTransfer()!.anchorTransferId) {
                <div>
                  <dt class="ui-dt">Anchor transfer ID</dt>
                  <dd
                    class="ui-dd font-mono"
                    [copyToClipboard]="selectedTransfer()!.anchorTransferId!"
                  >
                    {{ selectedTransfer()!.anchorTransferId }}
                  </dd>
                </div>
              }
              <div>
                <dt class="ui-dt">Status</dt>
                <dd class="ui-dd">
                  <app-status-chip
                    [status]="selectedTransfer()!.status"
                  ></app-status-chip>
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Amount</dt>
                <dd class="ui-dd tabular-nums">
                  ₦{{ selectedTransfer()!.amount | number: "1.0-0" : "en-NG" }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Fee</dt>
                <dd class="ui-dd tabular-nums">
                  ₦{{ selectedTransfer()!.fee | number: "1.0-0" : "en-NG" }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="ui-dt">Beneficiary Details</dt>
                <dd class="ui-dd">
                  {{ selectedTransfer()!.accountName }}
                </dd>
                <dd
                  class="mt-0.5 text-xs text-ui-muted"
                  [copyToClipboard]="selectedTransfer()!.accountNumber"
                >
                  Account: {{ selectedTransfer()!.accountNumber }} ·
                  {{ selectedTransfer()!.bankName }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="ui-dt">Sender Details</dt>
                <dd class="ui-dd">
                  {{ selectedTransfer()!.userName }}
                </dd>
                <dd
                  class="mt-0.5 font-mono text-xs text-ui-muted"
                  [copyToClipboard]="selectedTransfer()!.userId"
                >
                  {{ selectedTransfer()!.userId }}
                </dd>
              </div>
              @if (selectedTransfer()!.failureReason) {
                <div class="sm:col-span-2">
                  <dt class="ui-dt">Failure reason</dt>
                  <dd
                    class="mt-1 rounded-lg bg-ui-danger-soft p-2.5 text-[13px] text-ui-danger"
                  >
                    {{ selectedTransfer()!.failureReason }}
                  </dd>
                </div>
              }
              @if (selectedTransfer()!.stuckAlertedAt) {
                <div>
                  <dt class="ui-dt">Stuck alert sent</dt>
                  <dd class="ui-dd">
                    {{ selectedTransfer()!.stuckAlertedAt | date: "medium" }}
                  </dd>
                </div>
              }
              <div>
                <dt class="ui-dt">Timestamp</dt>
                <dd class="ui-dd">
                  {{ selectedTransfer()!.createdAt | date: "medium" }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="selectedTransfer.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class NipTransfersPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  readonly LandmarkIcon = Landmark;
  readonly SendIcon = Send;
  readonly EyeIcon = Eye;
  readonly XIcon = X;
  readonly LoaderIcon = LoaderCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly CircleAlertIcon = CircleAlert;

  statusFilter = signal<string>("");

  readonly statusTabs = [
    { label: "All Transfers", value: "" },
    { label: "Success", value: "SUCCESS" },
    { label: "Pending", value: "PENDING" },
    { label: "Failed", value: "FAILED" },
  ];

  transfersQuery = injectQuery(() => ({
    queryKey: ["nip-transfers", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getNipTransfers({
          status: this.statusFilter() || undefined,
          limit: 20,
        }),
      ),
  }));

  loading = computed(() => this.transfersQuery.isPending());

  rawAppended = signal<NipTransfer[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.transfersQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  transfers = computed<NipTransfer[]>(() => {
    const initial = this.transfersQuery.data()?.items || [];
    return [...initial, ...this.rawAppended()];
  });

  selectedTransfer = signal<NipTransfer | null>(null);

  maskAccount(accountNumber?: string): string {
    if (!accountNumber) return "N/A";
    if (accountNumber.length <= 4) return accountNumber;
    return "******" + accountNumber.slice(-4);
  }

  onStatusChange(val: string) {
    this.statusFilter.set(val);
    this.rawAppended.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.transfersQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getNipTransfers({
        status: this.statusFilter() || undefined,
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppended.update((prev) => [...prev, ...(res.items || [])]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more NIP transfers");
        },
      });
  }
}
