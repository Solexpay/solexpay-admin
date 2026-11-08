import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideFileSearch as FileSearch,
  LucideMailOpen as MailOpen,
  LucideMegaphone as Megaphone,
  LucideRotateCcw as RotateCcw,
  LucideSend as Send,
  LucideShieldCheck as ShieldCheck,
  LucideWorkflow as Workflow,
  LucideX as X,
} from "@lucide/angular";
import {
  AdminService,
  DeadOutbox,
  ComplianceFlag,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";

type OpsTab = "outbox" | "compliance" | "broadcast";

@Component({
  selector: "app-ops",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    ModalDirective,
    CopyToClipboardDirective,
    StatusChipComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="Operations Center"
      [icon]="WorkflowIcon"
      subtitle="Dead-letter outbox event requeueing and compliance alert management"
    />

    <div class="space-y-4">
      <!-- Navigation Tabs -->
      <div class="ui-tabs" role="tablist">
        <button
          type="button"
          class="ui-tab"
          role="tab"
          [attr.aria-selected]="activeSection() === 'outbox'"
          [class.ui-tab-active]="activeSection() === 'outbox'"
          (click)="selectTab('outbox')"
        >
          <svg [lucideIcon]="MailOpenIcon" [size]="15"></svg>
          Dead Outbox
        </button>
        <button
          type="button"
          class="ui-tab"
          role="tab"
          [attr.aria-selected]="activeSection() === 'compliance'"
          [class.ui-tab-active]="activeSection() === 'compliance'"
          (click)="selectTab('compliance')"
        >
          <svg [lucideIcon]="FileSearchIcon" [size]="15"></svg>
          Compliance Flags
        </button>
        <button
          type="button"
          class="ui-tab"
          role="tab"
          [attr.aria-selected]="activeSection() === 'broadcast'"
          [class.ui-tab-active]="activeSection() === 'broadcast'"
          (click)="selectTab('broadcast')"
        >
          <svg [lucideIcon]="MegaphoneIcon" [size]="15"></svg>
          Broadcast
        </button>
      </div>

      <!-- SECTION 1: DEAD OUTBOX -->
      @if (activeSection() === "outbox") {
        <section class="ui-panel">
          <div class="ui-panel-head">
            <div>
              <h2 class="ui-panel-title">Dead-Letter Outbox Events</h2>
              <p class="ui-meta mt-0.5">
                Events that exhausted max retries in the transactional outbox
              </p>
            </div>
          </div>

          <div class="ui-panel-body overflow-hidden">
            <div class="ui-table-wrap">
              <table class="ui-table md:min-w-[760px]">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Topic</th>
                    <th class="hidden md:table-cell">Last error</th>
                    <th class="hidden md:table-cell">Attempts</th>
                    <th>Created</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (outboxLoading()) {
                    @for (n of [1, 2, 3]; track n) {
                      <tr>
                        <td><div class="ui-skel h-4 w-24"></div></td>
                        <td><div class="ui-skel h-4 w-32"></div></td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-48"></div>
                        </td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-12"></div>
                        </td>
                        <td><div class="ui-skel h-4 w-20"></div></td>
                        <td><div class="ui-skel ml-auto h-4 w-16"></div></td>
                      </tr>
                    }
                  } @else if (outboxQuery.isError()) {
                    <tr>
                      <td [attr.colspan]="6">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="CircleAlertIcon"
                            [size]="28"
                            class="text-ui-danger"
                          ></svg>
                          <p>Couldn't load dead outbox events.</p>
                          <button
                            type="button"
                            class="ui-btn ui-btn-sm"
                            (click)="outboxQuery.refetch()"
                          >
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    @for (event of deadEvents(); track event.id) {
                      <tr>
                        <td
                          class="font-mono text-[13px] font-medium text-ui-ink"
                          [copyToClipboard]="event.id"
                          title="Click to copy event ID"
                        >
                          {{ event.id }}
                        </td>
                        <td>
                          <span
                            class="ui-badge ui-badge-neutral font-mono text-[11px]"
                          >
                            {{ event.topic }}
                          </span>
                        </td>
                        <td class="hidden md:table-cell">
                          <p
                            class="max-w-xs truncate font-mono text-xs text-ui-danger"
                            [title]="event.lastError ?? ''"
                          >
                            {{ event.lastError || "—" }}
                          </p>
                        </td>
                        <td
                          class="hidden tabular-nums text-ui-ink md:table-cell"
                        >
                          {{ event.attempts }}
                        </td>
                        <td class="whitespace-nowrap text-ui-muted">
                          {{ event.createdAt | date: "short" }}
                        </td>
                        <td>
                          <div class="flex justify-end">
                            <button
                              type="button"
                              class="ui-btn ui-btn-primary ui-btn-sm"
                              (click)="requeueEvent(event)"
                              [disabled]="
                                requeueMutation.isPending() &&
                                requeueMutation.variables() === event.id
                              "
                            >
                              <svg
                                [lucideIcon]="RotateCcwIcon"
                                [size]="15"
                              ></svg>
                              Requeue
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (deadEvents().length === 0) {
                      <tr>
                        <td [attr.colspan]="6">
                          <div class="ui-empty">
                            <img
                              src="/art/all-clear.webp"
                              alt=""
                              width="72"
                              height="72"
                              class="h-[72px] w-[72px] object-contain"
                            />
                            <p class="font-medium text-ui-ink">All clear</p>
                            <p>
                              No events are stuck in the dead-letter outbox.
                            </p>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            @if (outboxHasMore()) {
              <div class="ui-table-foot">
                <span>{{ deadEvents().length }} events</span>
                <button
                  type="button"
                  class="ui-btn ui-btn-sm"
                  (click)="loadMoreOutbox()"
                  [disabled]="isOutboxLoadingMore()"
                >
                  @if (isOutboxLoadingMore()) {
                    <span
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ui-accent border-t-transparent"
                    ></span>
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
      }

      <!-- SECTION 2: COMPLIANCE FLAGS -->
      @if (activeSection() === "compliance") {
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Compliance & AML Alerts</h2>
            <div class="ui-tabs">
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="flagFilter() === ''"
                (click)="onFlagFilterChange('')"
              >
                All
              </button>
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="flagFilter() === 'OPEN'"
                (click)="onFlagFilterChange('OPEN')"
              >
                Open
              </button>
              <button
                type="button"
                class="ui-tab"
                [class.ui-tab-active]="flagFilter() === 'RESOLVED'"
                (click)="onFlagFilterChange('RESOLVED')"
              >
                Resolved
              </button>
            </div>
          </div>

          <div class="ui-panel-body overflow-hidden">
            <div class="ui-table-wrap">
              <table class="ui-table md:min-w-[760px]">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Kind</th>
                    <th class="hidden md:table-cell">Detail</th>
                    <th>Status</th>
                    <th class="hidden md:table-cell">Flagged</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @if (complianceLoading()) {
                    @for (n of [1, 2, 3]; track n) {
                      <tr>
                        <td><div class="ui-skel h-4 w-28"></div></td>
                        <td><div class="ui-skel h-4 w-16"></div></td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-40"></div>
                        </td>
                        <td>
                          <div class="ui-skel h-5 w-16 rounded-full"></div>
                        </td>
                        <td class="hidden md:table-cell">
                          <div class="ui-skel h-4 w-20"></div>
                        </td>
                        <td><div class="ui-skel ml-auto h-4 w-16"></div></td>
                      </tr>
                    }
                  } @else if (complianceQuery.isError()) {
                    <tr>
                      <td [attr.colspan]="6">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="CircleAlertIcon"
                            [size]="28"
                            class="text-ui-danger"
                          ></svg>
                          <p>Couldn't load compliance flags.</p>
                          <button
                            type="button"
                            class="ui-btn ui-btn-sm"
                            (click)="complianceQuery.refetch()"
                          >
                            Try again
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    @for (flag of complianceFlags(); track flag.id) {
                      <tr>
                        <td>
                          <p class="font-medium text-ui-ink">
                            {{ flag.userName }}
                          </p>
                          <p class="text-xs text-ui-muted">
                            {{ flag.phoneNumber }}
                          </p>
                        </td>
                        <td>
                          <span class="ui-badge ui-badge-warning">{{
                            kindLabel(flag.kind)
                          }}</span>
                        </td>
                        <td class="hidden md:table-cell">
                          <p
                            class="max-w-sm truncate font-mono text-xs text-ui-body"
                            [title]="detailText(flag.detail)"
                          >
                            {{ detailText(flag.detail) }}
                          </p>
                          @if (flag.reviewedBy) {
                            <p class="mt-1 text-xs text-ui-muted">
                              Reviewed by {{ flag.reviewedBy }}
                              @if (flag.reviewedAt) {
                                · {{ flag.reviewedAt | date: "short" }}
                              }
                            </p>
                          }
                        </td>
                        <td><app-status-chip [status]="flag.status" /></td>
                        <td
                          class="hidden whitespace-nowrap text-ui-muted md:table-cell"
                        >
                          {{ flag.createdAt | date: "short" }}
                        </td>
                        <td>
                          @if (flag.status === "OPEN") {
                            <div class="flex justify-end">
                              <button
                                type="button"
                                class="ui-btn ui-btn-sm"
                                (click)="openResolveFlag(flag)"
                              >
                                Resolve
                              </button>
                            </div>
                          } @else {
                            <div class="flex justify-end">
                              <span class="text-xs text-ui-muted"
                                >Resolved</span
                              >
                            </div>
                          }
                        </td>
                      </tr>
                    }
                    @if (complianceFlags().length === 0) {
                      <tr>
                        <td [attr.colspan]="6">
                          <div class="ui-empty">
                            @if (flagFilter() === "OPEN") {
                              <img
                                src="/art/all-clear.webp"
                                alt=""
                                width="72"
                                height="72"
                                class="h-[72px] w-[72px] object-contain"
                              />
                              <p class="font-medium text-ui-ink">All clear</p>
                              <p>No open compliance flags.</p>
                            } @else {
                              <svg
                                [lucideIcon]="ShieldCheckIcon"
                                [size]="28"
                                class="text-ui-faint"
                              ></svg>
                              <p>No compliance flags found</p>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            @if (complianceHasMore()) {
              <div class="ui-table-foot">
                <span>{{ complianceFlags().length }} flags</span>
                <button
                  type="button"
                  class="ui-btn ui-btn-sm"
                  (click)="loadMoreCompliance()"
                  [disabled]="isComplianceLoadingMore()"
                >
                  @if (isComplianceLoadingMore()) {
                    <span
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ui-accent border-t-transparent"
                    ></span>
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
      }

      <!-- SECTION 3: SYSTEM BROADCAST -->
      @if (activeSection() === "broadcast") {
        <section class="ui-panel max-w-2xl">
          <div class="ui-panel-head">
            <div>
              <h2 class="ui-panel-title">System Notification Broadcast</h2>
              <p class="ui-meta mt-0.5">
                Send an announcement to platform users or schools
              </p>
            </div>
          </div>
          <div class="ui-panel-body p-4 sm:p-5">
            <form (ngSubmit)="submitBroadcast()" class="space-y-4">
              <div>
                <div class="mb-1.5 flex items-center justify-between gap-3">
                  <label for="broadcast-title" class="ui-label mb-0">
                    Broadcast Title
                  </label>
                  <span class="font-mono text-xs text-ui-muted">
                    {{ broadcastTitle().length }}/120
                  </span>
                </div>
                <input
                  id="broadcast-title"
                  type="text"
                  [ngModel]="broadcastTitle()"
                  (ngModelChange)="broadcastTitle.set($event)"
                  name="title"
                  maxlength="120"
                  placeholder="Announcement headline (up to 120 characters)"
                  class="ui-input"
                  required
                />
              </div>

              <div>
                <label for="broadcast-target" class="ui-label">
                  Target Audience
                </label>
                <select
                  id="broadcast-target"
                  [ngModel]="broadcastTarget()"
                  (ngModelChange)="broadcastTarget.set($event)"
                  name="targetAudience"
                  class="ui-input"
                >
                  <option value="ALL">All Users & Schools</option>
                  <option value="USERS">Users</option>
                  <option value="SCHOOLS">Partner Schools</option>
                </select>
              </div>

              <div>
                <div class="mb-1.5 flex items-center justify-between gap-3">
                  <label for="broadcast-message" class="ui-label mb-0">
                    Message Content
                  </label>
                  <span class="font-mono text-xs text-ui-muted">
                    {{ broadcastMessage().length }}/1000
                  </span>
                </div>
                <textarea
                  id="broadcast-message"
                  [ngModel]="broadcastMessage()"
                  (ngModelChange)="broadcastMessage.set($event)"
                  name="message"
                  rows="5"
                  maxlength="1000"
                  placeholder="Broadcast message body (up to 1000 characters)"
                  class="ui-input"
                  required
                ></textarea>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="submit"
                  [disabled]="
                    broadcastMutation.isPending() ||
                    !broadcastTitle().trim() ||
                    !broadcastMessage().trim()
                  "
                  class="ui-btn ui-btn-primary"
                >
                  <svg [lucideIcon]="SendIcon" [size]="15"></svg>
                  {{
                    broadcastMutation.isPending()
                      ? "Sending..."
                      : "Send Broadcast"
                  }}
                </button>
              </div>
            </form>
          </div>
        </section>
      }

      <!-- Resolve Compliance Flag Modal -->
      @if (resolvingFlag()) {
        <div class="ui-overlay">
          <div class="ui-backdrop" aria-hidden="true"></div>
          <div
            class="ui-modal"
            role="dialog"
            aria-modal="true"
            uiModal
            (uiModalClose)="resolvingFlag.set(null)"
          >
            <div class="ui-modal-head">
              <h2 class="ui-modal-title">Resolve Compliance Flag</h2>
              <button
                type="button"
                class="ui-icon-btn"
                (click)="resolvingFlag.set(null)"
                aria-label="Close"
              >
                <svg [lucideIcon]="XIcon" [size]="16"></svg>
              </button>
            </div>
            <div class="ui-modal-body">
              <p class="mb-4 text-sm text-ui-muted">
                Flag ID:
                <span class="font-mono font-semibold text-ui-ink">{{
                  resolvingFlag()!.id
                }}</span>
              </p>
              <label for="resolution-note" class="ui-label">
                Resolution Note (Required)
              </label>
              <textarea
                id="resolution-note"
                [(ngModel)]="resolutionNoteInput"
                rows="3"
                placeholder="Explain the review outcome and justification"
                class="ui-input"
                data-autofocus
                (keydown.control.enter)="submitResolveFlag()"
                (keydown.meta.enter)="submitResolveFlag()"
              ></textarea>
            </div>
            <div class="ui-modal-foot">
              <button
                type="button"
                (click)="resolvingFlag.set(null)"
                class="ui-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitResolveFlag()"
                [disabled]="
                  resolveFlagMutation.isPending() || !resolutionNoteInput.trim()
                "
                class="ui-btn ui-btn-primary"
              >
                {{
                  resolveFlagMutation.isPending()
                    ? "Resolving..."
                    : "Confirm Resolve"
                }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OpsPageComponent {
  readonly WorkflowIcon = Workflow;
  readonly MailOpenIcon = MailOpen;
  readonly FileSearchIcon = FileSearch;
  readonly MegaphoneIcon = Megaphone;
  readonly RotateCcwIcon = RotateCcw;
  readonly ChevronDownIcon = ChevronDown;
  readonly SendIcon = Send;
  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CircleAlertIcon = CircleAlert;

  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private queryClient = injectQueryClient();
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeSection = signal<OpsTab>(this.tabFromUrl());

  private tabFromUrl(): OpsTab {
    const tab = this.route.snapshot.queryParamMap.get("tab");
    return tab === "compliance" || tab === "broadcast" ? tab : "outbox";
  }

  selectTab(tab: OpsTab) {
    this.activeSection.set(tab);
    void this.router.navigate([], {
      queryParams: { tab },
      replaceUrl: true,
    });
  }

  // Dead outbox state
  outboxQuery = injectQuery(() => ({
    queryKey: ["ops-dead-outbox"],
    queryFn: () =>
      lastValueFrom(this.adminService.getDeadOutbox({ limit: 20 })),
  }));
  outboxLoading = computed(() => this.outboxQuery.isPending());

  rawAppendedOutbox = signal<DeadOutbox[]>([]);
  rawOutboxHasMore = signal<boolean | null>(null);
  outboxHasMore = computed(() => {
    if (this.rawOutboxHasMore() !== null) return this.rawOutboxHasMore()!;
    return this.outboxQuery.data()?.hasMore ?? false;
  });
  outboxCursor = signal<string | null>(null);
  isOutboxLoadingMore = signal(false);

  deadEvents = computed<DeadOutbox[]>(() => {
    const initial = this.outboxQuery.data()?.items || [];
    return [...initial, ...this.rawAppendedOutbox()];
  });

  private resetOutboxPages() {
    this.rawAppendedOutbox.set([]);
    this.rawOutboxHasMore.set(null);
    this.outboxCursor.set(null);
  }

  requeueMutation = injectMutation(() => ({
    mutationFn: (id: string) =>
      lastValueFrom(this.adminService.requeueDeadOutbox(id)),
    onSuccess: () => {
      this.toast.show("success", "Event successfully requeued");
      this.queryClient.invalidateQueries({ queryKey: ["ops-dead-outbox"] });
      this.resetOutboxPages();
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to requeue event";
      this.toast.show("error", message);
    },
  }));

  async requeueEvent(event: DeadOutbox) {
    const ok = await this.confirm.ask({
      title: "Requeue this event?",
      message: `It goes back to the outbox and is retried (${event.topic}).`,
      confirmLabel: "Requeue",
      tone: "primary",
    });
    if (!ok) return;
    this.requeueMutation.mutate(event.id);
  }

  loadMoreOutbox() {
    const cursor = this.outboxCursor() ?? this.outboxQuery.data()?.nextCursor;
    if (!cursor || this.isOutboxLoadingMore()) return;
    this.isOutboxLoadingMore.set(true);
    this.adminService.getDeadOutbox({ limit: 20, cursor }).subscribe({
      next: (res) => {
        this.rawAppendedOutbox.update((prev) => [
          ...prev,
          ...(res.items || []),
        ]);
        this.outboxCursor.set(res.nextCursor);
        this.rawOutboxHasMore.set(res.hasMore);
        this.isOutboxLoadingMore.set(false);
      },
      error: () => {
        this.isOutboxLoadingMore.set(false);
        this.toast.show("error", "Failed to load more dead outbox events");
      },
    });
  }

  // Compliance flags state
  flagFilter = signal<string>("");

  complianceQuery = injectQuery(() => ({
    queryKey: ["ops-compliance-flags", { status: this.flagFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getComplianceFlags({
          status: this.flagFilter() || undefined,
          limit: 20,
        }),
      ),
  }));
  complianceLoading = computed(() => this.complianceQuery.isPending());

  rawAppendedCompliance = signal<ComplianceFlag[]>([]);
  rawComplianceHasMore = signal<boolean | null>(null);
  complianceHasMore = computed(() => {
    if (this.rawComplianceHasMore() !== null)
      return this.rawComplianceHasMore()!;
    return this.complianceQuery.data()?.hasMore ?? false;
  });
  complianceCursor = signal<string | null>(null);
  isComplianceLoadingMore = signal(false);

  complianceFlags = computed<ComplianceFlag[]>(() => {
    const initial = this.complianceQuery.data()?.items || [];
    return [...initial, ...this.rawAppendedCompliance()];
  });

  resolvingFlag = signal<ComplianceFlag | null>(null);
  resolutionNoteInput = "";

  private resetCompliancePages() {
    this.rawAppendedCompliance.set([]);
    this.rawComplianceHasMore.set(null);
    this.complianceCursor.set(null);
  }

  onFlagFilterChange(val: string) {
    this.flagFilter.set(val);
    this.resetCompliancePages();
  }

  loadMoreCompliance() {
    const cursor =
      this.complianceCursor() ?? this.complianceQuery.data()?.nextCursor;
    if (!cursor || this.isComplianceLoadingMore()) return;
    this.isComplianceLoadingMore.set(true);
    this.adminService
      .getComplianceFlags({
        status: this.flagFilter() || undefined,
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedCompliance.update((prev) => [
            ...prev,
            ...(res.items || []),
          ]);
          this.complianceCursor.set(res.nextCursor);
          this.rawComplianceHasMore.set(res.hasMore);
          this.isComplianceLoadingMore.set(false);
        },
        error: () => {
          this.isComplianceLoadingMore.set(false);
          this.toast.show("error", "Failed to load more compliance flags");
        },
      });
  }

  openResolveFlag(flag: ComplianceFlag) {
    this.resolvingFlag.set(flag);
    this.resolutionNoteInput = "";
  }

  resolveFlagMutation = injectMutation(() => ({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      lastValueFrom(this.adminService.resolveComplianceFlag(id, note)),
    onSuccess: () => {
      this.toast.show("success", "Compliance flag marked as resolved");
      this.resolvingFlag.set(null);
      this.queryClient.invalidateQueries({
        queryKey: ["ops-compliance-flags"],
      });
      this.resetCompliancePages();
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to resolve flag";
      this.toast.show("error", message);
    },
  }));

  submitResolveFlag() {
    const flag = this.resolvingFlag();
    const note = this.resolutionNoteInput.trim();
    if (!flag || !note) return;
    this.resolveFlagMutation.mutate({ id: flag.id, note });
  }

  // System broadcast state
  broadcastTitle = signal("");
  broadcastMessage = signal("");
  broadcastTarget = signal("ALL");

  broadcastMutation = injectMutation(() => ({
    mutationFn: ({
      title,
      message,
      targetAudience,
    }: {
      title: string;
      message: string;
      targetAudience: string;
    }) =>
      lastValueFrom(
        this.adminService.broadcastNotification(title, message, targetAudience),
      ),
    onSuccess: () => {
      this.toast.show("success", "Broadcast announcement successfully queued");
      this.broadcastTitle.set("");
      this.broadcastMessage.set("");
      this.broadcastTarget.set("ALL");
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to send broadcast";
      this.toast.show("error", message);
    },
  }));

  async submitBroadcast() {
    const title = this.broadcastTitle().trim();
    const message = this.broadcastMessage().trim();
    if (!title || !message) return;
    const target = this.broadcastTarget();
    const audience =
      target === "USERS"
        ? "all users"
        : target === "SCHOOLS"
          ? "all partner schools"
          : "all users and schools";
    const ok = await this.confirm.ask({
      title: `Send "${title}"?`,
      message: `It goes to ${audience} as a notification and can't be recalled.`,
      confirmLabel: "Send broadcast",
      tone: target === "ALL" ? "danger" : "primary",
      typeToConfirm: target === "ALL" ? "SEND" : undefined,
    });
    if (!ok) return;
    this.broadcastMutation.mutate({
      title,
      message,
      targetAudience: target,
    });
  }

  kindLabel(kind: string): string {
    const words = (kind ?? "").replace(/_/g, " ").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  detailText(detail: unknown): string {
    if (detail == null) return "—";
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
}
