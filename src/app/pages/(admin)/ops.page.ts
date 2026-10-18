import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  AdminService,
  DeadOutbox,
  ComplianceFlag,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";

@Component({
  selector: "app-ops",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent, RippleDirective],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            Operations Center
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Dead-letter outbox event requeueing and compliance alert management
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-2 p-1 bg-surface-container rounded-xl w-fit">
        <button
          (click)="activeSection.set('outbox')"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          [class]="
            activeSection() === 'outbox'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          "
        >
          <span class="material-symbols-outlined text-sm"
            >mark_email_unread</span
          >
          Dead Outbox
        </button>
        <button
          (click)="activeSection.set('compliance')"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          [class]="
            activeSection() === 'compliance'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          "
        >
          <span class="material-symbols-outlined text-sm">policy</span>
          Compliance Flags
        </button>
        <button
          (click)="activeSection.set('broadcast')"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          [class]="
            activeSection() === 'broadcast'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          "
        >
          <span class="material-symbols-outlined text-sm">campaign</span>
          Broadcast
        </button>
      </div>

      <!-- SECTION 1: DEAD OUTBOX -->
      @if (activeSection() === "outbox") {
        <div
          class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
        >
          <div
            class="p-4 border-b border-surface-container flex items-center justify-between"
          >
            <h2 class="text-base font-bold text-on-surface">
              Dead-Letter Outbox Events
            </h2>
            <p class="text-xs text-on-surface-variant">
              Events that exhausted max retries in the transactional outbox
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[800px]">
              <thead>
                <tr class="bg-surface-container text-left">
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Event ID
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Topic / Event Type
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Error Details
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Retries
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                @if (outboxLoading()) {
                  @for (n of [1, 2, 3]; track n) {
                    <tr class="border-t border-surface-container animate-pulse">
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-24 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-32 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-48 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-12 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-20 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div
                          class="h-4 w-16 bg-surface-container-high rounded ml-auto"
                        ></div>
                      </td>
                    </tr>
                  }
                } @else {
                  @for (event of deadEvents(); track event.id) {
                    <tr
                      class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                    >
                      <td
                        class="px-6 py-4 font-mono text-sm text-on-surface font-semibold"
                      >
                        {{ event.id }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2.5 py-1 bg-surface-container rounded-md font-mono text-xs text-on-surface"
                        >
                          {{ event.eventType }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <p
                          class="text-xs text-error font-mono max-w-xs truncate"
                          [title]="event.errorMessage"
                        >
                          {{ event.errorMessage }}
                        </p>
                      </td>
                      <td
                        class="px-6 py-4 text-sm font-semibold text-on-surface"
                      >
                        {{ event.retryCount }}
                      </td>
                      <td
                        class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap"
                      >
                        {{ event.createdAt | date: "short" }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <button
                          solexRipple
                          (click)="requeueMutation.mutate(event.id)"
                          [disabled]="requeueMutation.isPending()"
                          class="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                        >
                          <span class="material-symbols-outlined text-xs"
                            >replay</span
                          >
                          Requeue
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (!outboxLoading() && deadEvents().length === 0) {
            <div class="text-center py-12">
              <span class="material-symbols-outlined text-4xl text-tertiary"
                >task_alt</span
              >
              <p class="text-sm text-on-surface-variant mt-2">
                All clear: No dead outbox events
              </p>
            </div>
          }

          @if (outboxHasMore()) {
            <div
              class="flex justify-center p-4 border-t border-surface-container"
            >
              <button
                (click)="loadMoreOutbox()"
                [disabled]="isOutboxLoadingMore()"
                class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                @if (isOutboxLoadingMore()) {
                  <span
                    class="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></span>
                  <span>Loading...</span>
                } @else {
                  <span>Load more</span>
                  <span class="material-symbols-outlined text-sm"
                    >expand_more</span
                  >
                }
              </button>
            </div>
          }
        </div>
      }

      <!-- SECTION 2: COMPLIANCE FLAGS -->
      @if (activeSection() === "compliance") {
        <div
          class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
        >
          <div
            class="p-4 border-b border-surface-container flex items-center justify-between"
          >
            <h2 class="text-base font-bold text-on-surface">
              Compliance & AML Alerts
            </h2>
            <div class="flex gap-1 bg-surface-container p-1 rounded-lg">
              <button
                (click)="onFlagFilterChange('')"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                [class]="
                  flagFilter() === ''
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant'
                "
              >
                All
              </button>
              <button
                (click)="onFlagFilterChange('OPEN')"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                [class]="
                  flagFilter() === 'OPEN'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant'
                "
              >
                Open
              </button>
              <button
                (click)="onFlagFilterChange('RESOLVED')"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                [class]="
                  flagFilter() === 'RESOLVED'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant'
                "
              >
                Resolved
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[800px]">
              <thead>
                <tr class="bg-surface-container text-left">
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Flag ID & User
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Severity
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Reason
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    Flagged At
                  </th>
                  <th
                    class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                @if (complianceLoading()) {
                  @for (n of [1, 2, 3]; track n) {
                    <tr class="border-t border-surface-container animate-pulse">
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-28 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-16 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-40 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-16 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4">
                        <div
                          class="h-4 w-20 bg-surface-container-high rounded"
                        ></div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div
                          class="h-4 w-16 bg-surface-container-high rounded ml-auto"
                        ></div>
                      </td>
                    </tr>
                  }
                } @else {
                  @for (flag of complianceFlags(); track flag.id) {
                    <tr
                      class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                    >
                      <td class="px-6 py-4">
                        <p
                          class="text-sm font-mono font-semibold text-on-surface"
                        >
                          {{ flag.id }}
                        </p>
                        <p class="text-xs text-on-surface-variant font-mono">
                          User: {{ flag.userId }}
                        </p>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                          [class]="
                            flag.severity === 'HIGH' ||
                            flag.severity === 'CRITICAL'
                              ? 'bg-error-container text-on-error-container'
                              : flag.severity === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-surface-container text-on-surface'
                          "
                        >
                          {{ flag.severity }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-on-surface">
                        <p class="font-medium">{{ flag.reason }}</p>
                        @if (flag.resolutionNote) {
                          <p class="text-xs text-on-surface-variant mt-1">
                            Resolution: {{ flag.resolutionNote }}
                          </p>
                        }
                      </td>
                      <td class="px-6 py-4">
                        <app-status-chip
                          [status]="flag.status"
                        ></app-status-chip>
                      </td>
                      <td
                        class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap"
                      >
                        {{ flag.flaggedAt | date: "short" }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        @if (flag.status === "OPEN") {
                          <button
                            solexRipple
                            (click)="openResolveFlag(flag)"
                            class="px-3 py-1.5 bg-tertiary text-on-tertiary rounded-lg text-xs font-bold hover:brightness-110 ml-auto"
                          >
                            Resolve
                          </button>
                        } @else {
                          <span class="text-xs text-on-surface-variant"
                            >Resolved</span
                          >
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (!complianceLoading() && complianceFlags().length === 0) {
            <div class="text-center py-12">
              <span
                class="material-symbols-outlined text-4xl text-surface-variant"
                >verified_user</span
              >
              <p class="text-sm text-on-surface-variant mt-2">
                No compliance flags found
              </p>
            </div>
          }

          @if (complianceHasMore()) {
            <div
              class="flex justify-center p-4 border-t border-surface-container"
            >
              <button
                (click)="loadMoreCompliance()"
                [disabled]="isComplianceLoadingMore()"
                class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                @if (isComplianceLoadingMore()) {
                  <span
                    class="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></span>
                  <span>Loading...</span>
                } @else {
                  <span>Load more</span>
                  <span class="material-symbols-outlined text-sm"
                    >expand_more</span
                  >
                }
              </button>
            </div>
          }
        </div>
      }

      <!-- SECTION 3: SYSTEM BROADCAST -->
      @if (activeSection() === "broadcast") {
        <div
          class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] p-6 max-w-2xl"
        >
          <div class="border-b border-surface-container pb-4 mb-6">
            <h2 class="text-base font-bold text-on-surface">
              System Notification Broadcast
            </h2>
            <p class="text-xs text-on-surface-variant">
              Send an announcement to platform users or schools
            </p>
          </div>

          <form (ngSubmit)="submitBroadcast()" class="space-y-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label
                  for="broadcast-title"
                  class="block text-xs font-semibold text-on-surface"
                >
                  Broadcast Title
                </label>
                <span class="text-xs font-mono text-on-surface-variant">
                  {{ broadcastTitle.length }}/120
                </span>
              </div>
              <input
                id="broadcast-title"
                type="text"
                [(ngModel)]="broadcastTitle"
                name="title"
                maxlength="120"
                placeholder="Announcement headline (up to 120 characters)"
                class="w-full bg-surface-container-highest rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label
                for="broadcast-target"
                class="block text-xs font-semibold text-on-surface mb-1"
              >
                Target Audience
              </label>
              <select
                id="broadcast-target"
                [(ngModel)]="broadcastTarget"
                name="targetAudience"
                class="w-full bg-surface-container-highest rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Users & Schools</option>
                <option value="USERS">Users</option>
                <option value="SCHOOLS">Partner Schools</option>
              </select>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label
                  for="broadcast-message"
                  class="block text-xs font-semibold text-on-surface"
                >
                  Message Content
                </label>
                <span class="text-xs font-mono text-on-surface-variant">
                  {{ broadcastMessage.length }}/1000
                </span>
              </div>
              <textarea
                id="broadcast-message"
                [(ngModel)]="broadcastMessage"
                name="message"
                rows="5"
                maxlength="1000"
                placeholder="Broadcast message body (up to 1000 characters)"
                class="w-full bg-surface-container-highest rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                required
              ></textarea>
            </div>

            <div class="flex justify-end pt-2">
              <button
                solexRipple
                type="submit"
                [disabled]="
                  broadcastMutation.isPending() ||
                  !broadcastTitle.trim() ||
                  !broadcastMessage.trim()
                "
                class="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">send</span>
                {{
                  broadcastMutation.isPending()
                    ? "Sending..."
                    : "Send Broadcast"
                }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Resolve Compliance Flag Modal -->
      @if (resolvingFlag()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 class="text-lg font-bold text-on-surface mb-2">
              Resolve Compliance Flag
            </h2>
            <p class="text-sm text-on-surface-variant mb-4">
              Flag ID:
              <span class="font-mono font-semibold">{{
                resolvingFlag()!.id
              }}</span>
            </p>

            <div class="mb-4">
              <label
                for="resolution-note"
                class="block text-xs font-semibold text-on-surface mb-1"
              >
                Resolution Note (Required)
              </label>
              <textarea
                id="resolution-note"
                [(ngModel)]="resolutionNoteInput"
                rows="3"
                placeholder="Explain the review outcome and justification"
                class="w-full bg-surface-container-highest rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                (click)="resolvingFlag.set(null)"
                class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                solexRipple
                type="button"
                (click)="submitResolveFlag()"
                [disabled]="
                  resolveFlagMutation.isPending() || !resolutionNoteInput.trim()
                "
                class="px-4 py-2 bg-tertiary text-on-tertiary rounded-xl font-bold text-sm disabled:opacity-50"
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
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  activeSection = signal<"outbox" | "compliance" | "broadcast">("outbox");

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

  requeueMutation = injectMutation(() => ({
    mutationFn: (id: string) =>
      lastValueFrom(this.adminService.requeueDeadOutbox(id)),
    onSuccess: () => {
      this.toast.show("success", "Event successfully requeued");
      this.queryClient.invalidateQueries({ queryKey: ["ops-dead-outbox"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to requeue event";
      this.toast.show("error", message);
    },
  }));

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

  onFlagFilterChange(val: string) {
    this.flagFilter.set(val);
    this.rawAppendedCompliance.set([]);
    this.rawComplianceHasMore.set(null);
    this.complianceCursor.set(null);
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
  broadcastTitle = "";
  broadcastMessage = "";
  broadcastTarget = "ALL";

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
      this.broadcastTitle = "";
      this.broadcastMessage = "";
      this.broadcastTarget = "ALL";
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to send broadcast";
      this.toast.show("error", message);
    },
  }));

  submitBroadcast() {
    const title = this.broadcastTitle.trim();
    const message = this.broadcastMessage.trim();
    if (!title || !message) return;
    this.broadcastMutation.mutate({
      title,
      message,
      targetAudience: this.broadcastTarget,
    });
  }
}
