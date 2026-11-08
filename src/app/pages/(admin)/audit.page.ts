import { Component, DestroyRef, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideBadgeCheck as BadgeCheck,
  LucideBraces as Braces,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideCircleCheck as CircleCheck,
  LucideDownload as Download,
  LucideHistory as History,
  LucideLoaderCircle as LoaderCircle,
  LucideSearch as Search,
  LucideShieldCheck as ShieldCheck,
  LucideTriangleAlert as TriangleAlert,
  LucideX as X,
} from "@lucide/angular";
import {
  AdminService,
  AuditLog,
  AuditVerifyResult,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { downloadCsv } from "../../core/csv";

@Component({
  selector: "app-audit",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    PageHeaderComponent,
    ModalDirective,
    CopyToClipboardDirective,
  ],
  template: `
    <app-page-header
      title="Audit Ledger"
      [icon]="HistoryIcon"
      subtitle="Immutable cryptographic audit trail and hash chain verification"
    />

    <div class="space-y-4">
      <!-- Hash Chain Verification -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Verify Cryptographic Hash Chain</h2>
          <span class="ui-meta">Integrity check</span>
        </div>
        <div class="ui-panel-body space-y-4 p-4">
          <div class="flex items-start gap-2.5">
            <svg
              [lucideIcon]="ShieldCheckIcon"
              [size]="18"
              class="mt-0.5 shrink-0 text-ui-accent"
            ></svg>
            <p class="text-xs text-ui-muted">
              Verify cryptographic integrity of audit sequence entries. Each
              audit record contains a hash of its payload and previous entry.
            </p>
          </div>

          <div
            class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div>
              <label for="verify-from-seq" class="ui-label">From Seq:</label>
              <input
                id="verify-from-seq"
                type="number"
                [ngModel]="verifyFromSeq()"
                (ngModelChange)="verifyFromSeq.set(+$event)"
                placeholder="1"
                min="1"
                class="ui-input w-24 font-mono"
              />
            </div>
            <div>
              <label for="verify-to-seq" class="ui-label">To Seq:</label>
              <input
                id="verify-to-seq"
                type="number"
                [ngModel]="verifyToSeq()"
                (ngModelChange)="verifyToSeq.set(+$event)"
                placeholder="100"
                min="1"
                class="ui-input w-24 font-mono"
              />
            </div>
            <button
              type="button"
              (click)="runVerifyChain()"
              [disabled]="verifyMutation.isPending() || !!rangeError()"
              class="ui-btn ui-btn-primary"
            >
              @if (verifyMutation.isPending()) {
                <svg
                  [lucideIcon]="LoaderIcon"
                  [size]="15"
                  class="animate-spin"
                ></svg>
                <span>Verifying...</span>
              } @else {
                <svg [lucideIcon]="BadgeCheckIcon" [size]="15"></svg>
                <span>Verify Chain</span>
              }
            </button>
          </div>

          @if (rangeError()) {
            <p class="text-xs text-ui-danger">{{ rangeError() }}</p>
          }

          <!-- Verification Result Banner -->
          @if (verifyResult(); as res) {
            <div
              class="ui-alert"
              [class]="res.ok ? 'ui-alert-info' : 'ui-alert-danger'"
            >
              <svg
                [lucideIcon]="res.ok ? CircleCheckIcon : TriangleAlertIcon"
                [size]="18"
                class="mt-0.5 shrink-0"
              ></svg>
              <div class="min-w-0">
                <p class="font-medium">
                  {{
                    res.ok
                      ? "Hash Chain Integrity Verified OK"
                      : "Hash Chain Broken / Tampering Detected!"
                  }}
                </p>
                @if (res.ok) {
                  <p class="mt-0.5 text-xs opacity-90">
                    Checked {{ res.checked }} sequence record{{
                      res.checked === 1 ? "" : "s"
                    }}
                    in range. No discrepancies found.
                  </p>
                } @else {
                  <p class="mt-0.5 font-mono text-xs">
                    First broken sequence: #{{
                      res.firstBrokenChainSeq
                    }}
                    (Record ID: {{ res.firstBrokenAuditId }})
                  </p>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Audit Logs Table -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Audit Ledger</h2>
          <div
            class="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center"
          >
            <div class="ui-search w-full lg:w-72">
              <svg [lucideIcon]="SearchIcon" [size]="15"></svg>
              <input
                type="text"
                class="ui-input"
                [ngModel]="actionInput()"
                (ngModelChange)="onActionFilterChange($event)"
                (keydown.escape)="clearActionFilter()"
                placeholder="Filter by action (e.g. user.suspend, auth.login)..."
              />
              @if (actionInput()) {
                <button
                  type="button"
                  aria-label="Clear search"
                  class="ui-icon-btn absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  (click)="clearActionFilter()"
                >
                  <svg [lucideIcon]="XIcon" [size]="14"></svg>
                </button>
              }
            </div>
            <select
              class="ui-input w-full cursor-pointer lg:w-auto"
              [ngModel]="actorTypeFilter()"
              (ngModelChange)="onActorTypeChange($event)"
            >
              <option value="">All Actors</option>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <button
              type="button"
              class="ui-btn"
              (click)="exportCsv()"
              title="Exports the rows loaded on screen"
            >
              <svg [lucideIcon]="DownloadIcon" [size]="15"></svg>
              Export CSV
            </button>
          </div>
        </div>

        <div class="ui-panel-body overflow-hidden">
          @if (actorIdFilter() || entityIdFilter()) {
            <div class="flex flex-wrap items-center gap-2 px-3 py-2">
              @if (actorIdFilter()) {
                <button
                  type="button"
                  class="ui-badge ui-badge-info"
                  (click)="clearActorFilter()"
                  aria-label="Remove actor filter"
                >
                  Actor: {{ shortId(actorIdFilter()) }} ×
                </button>
              }
              @if (entityIdFilter()) {
                <button
                  type="button"
                  class="ui-badge ui-badge-info"
                  (click)="clearEntityFilter()"
                  aria-label="Remove entity filter"
                >
                  Entity: {{ shortId(entityIdFilter()) }} ×
                </button>
              }
            </div>
          }
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[860px]">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th class="hidden md:table-cell">Entity</th>
                  <th class="hidden md:table-cell">IP / Client</th>
                  <th>Timestamp</th>
                  <th class="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4]; track n) {
                    <tr>
                      <td><div class="ui-skel h-4 w-8"></div></td>
                      <td><div class="ui-skel h-4 w-28"></div></td>
                      <td><div class="ui-skel h-4 w-24"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-20"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-24"></div></td>
                      <td><div class="ui-skel ml-auto h-4 w-8"></div></td>
                    </tr>
                  }
                } @else if (auditQuery.isError()) {
                  <tr>
                    <td [attr.colspan]="7">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load audit logs.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="auditQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (log of auditLogs(); track log.id) {
                    <tr>
                      <td
                        class="whitespace-nowrap font-mono text-[13px] font-medium text-ui-accent"
                      >
                        <span [copyToClipboard]="log.seq.toString()">
                          #{{ log.seq }}
                        </span>
                      </td>
                      <td>
                        <span class="ui-badge ui-badge-neutral font-mono">
                          {{ log.action }}
                        </span>
                      </td>
                      <td>
                        <p class="font-medium text-ui-ink">
                          {{ log.actorType }}
                        </p>
                        <button
                          type="button"
                          class="block max-w-[140px] truncate text-left text-xs font-mono text-ui-muted hover:text-ui-accent"
                          title="Show only this actor"
                          [copyToClipboard]="log.actorId"
                          (click)="filterByActor(log.actorId)"
                        >
                          {{ log.actorId }}
                        </button>
                      </td>
                      <td class="hidden md:table-cell">
                        <p class="font-medium text-ui-ink">
                          {{ log.entityType }}
                        </p>
                        <button
                          type="button"
                          class="block max-w-[140px] truncate text-left text-xs font-mono text-ui-muted hover:text-ui-accent"
                          title="Show only this entity"
                          [copyToClipboard]="log.entityId"
                          (click)="filterByEntity(log.entityId)"
                        >
                          {{ log.entityId }}
                        </button>
                      </td>
                      <td class="hidden md:table-cell">
                        <p class="font-mono text-xs text-ui-body">
                          {{ log.ip }}
                        </p>
                        <p
                          class="max-w-[160px] truncate text-[11px] font-mono text-ui-muted"
                        >
                          {{ log.userAgent }}
                        </p>
                      </td>
                      <td class="whitespace-nowrap text-ui-muted">
                        {{ log.createdAt | date: "medium" }}
                      </td>
                      <td>
                        <div class="flex justify-end">
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="selectedLog.set(log)"
                            title="View Payload Data"
                            aria-label="View Payload Data"
                          >
                            <svg [lucideIcon]="BracesIcon" [size]="16"></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @if (auditLogs().length === 0) {
                    <tr>
                      <td [attr.colspan]="7">
                        <div class="ui-empty">
                          <svg
                            [lucideIcon]="HistoryIcon"
                            [size]="28"
                            class="text-ui-faint"
                          ></svg>
                          <p>No audit logs found</p>
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

          <!-- Load more -->
          <div class="ui-table-foot">
            <p>Showing {{ auditLogs().length }} entries</p>
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

    <!-- Payload Viewer Modal -->
    @if (selectedLog()) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedLog.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedLog.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">
              Audit Record #{{ selectedLog()!.seq }} Payload
            </h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="selectedLog.set(null)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body space-y-4">
            <dl class="ui-dl">
              <div class="sm:col-span-2">
                <dt class="ui-dt">Hash</dt>
                <dd
                  class="ui-dd select-all break-all font-mono"
                  [copyToClipboard]="selectedLog()!.hash"
                >
                  {{ selectedLog()!.hash }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Action</dt>
                <dd class="ui-dd font-mono">{{ selectedLog()!.action }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Timestamp</dt>
                <dd class="ui-dd">
                  {{ selectedLog()!.createdAt | date: "medium" }}
                </dd>
              </div>
            </dl>

            <div>
              <p class="mb-1.5 text-xs font-medium text-ui-muted">
                Payload JSON
              </p>
              <pre
                class="max-h-60 overflow-x-auto rounded-xl border border-ui-line bg-ui-sunken p-3 font-mono text-xs text-ui-body"
                >{{ selectedLog()!.data | json }}</pre>
            </div>
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="selectedLog.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AuditPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly HistoryIcon = History;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly SearchIcon = Search;
  readonly BadgeCheckIcon = BadgeCheck;
  readonly CircleCheckIcon = CircleCheck;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly BracesIcon = Braces;
  readonly ChevronDownIcon = ChevronDown;
  readonly LoaderIcon = LoaderCircle;
  readonly XIcon = X;
  readonly CircleAlertIcon = CircleAlert;
  readonly DownloadIcon = Download;

  actionInput = signal("");
  actionFilter = signal("");
  actorTypeFilter = signal("");
  actorIdFilter = signal("");
  entityIdFilter = signal("");

  private actionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.actionTimer) clearTimeout(this.actionTimer);
    });
  }

  verifyFromSeq = signal(1);
  verifyToSeq = signal(100);
  verifyResult = signal<AuditVerifyResult | null>(null);

  rangeError = computed<string | null>(() => {
    const from = this.verifyFromSeq();
    const to = this.verifyToSeq();
    if (!Number.isFinite(from) || from <= 0) {
      return "Enter a valid starting sequence (1 or more).";
    }
    if (!Number.isFinite(to) || to <= 0) {
      return "Enter a valid ending sequence (1 or more).";
    }
    if (from > to) {
      return "From sequence must not be greater than to sequence.";
    }
    return null;
  });

  auditQuery = injectQuery(() => ({
    queryKey: [
      "audit-logs",
      {
        action: this.actionFilter(),
        actorType: this.actorTypeFilter(),
        actorId: this.actorIdFilter(),
        entityId: this.entityIdFilter(),
      },
    ],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getAuditLogs({
          action: this.actionFilter() || undefined,
          actorType: this.actorTypeFilter() || undefined,
          actorId: this.actorIdFilter() || undefined,
          entityId: this.entityIdFilter() || undefined,
          limit: 20,
        }),
      ),
  }));

  loading = computed(() => this.auditQuery.isPending());

  rawAppended = signal<AuditLog[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.auditQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  auditLogs = computed<AuditLog[]>(() => {
    const initial = this.auditQuery.data()?.items || [];
    return [...initial, ...this.rawAppended()];
  });

  selectedLog = signal<AuditLog | null>(null);

  onActionFilterChange(val: string) {
    this.actionInput.set(val);
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.actionTimer = setTimeout(() => {
      this.actionFilter.set(val.trim());
      this.resetPages();
    }, 300);
  }

  clearActionFilter() {
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.actionInput.set("");
    this.actionFilter.set("");
    this.resetPages();
  }

  onActorTypeChange(val: string) {
    this.actorTypeFilter.set(val);
    this.resetPages();
  }

  filterByActor(id: string) {
    this.actorIdFilter.set(id);
    this.resetPages();
  }

  filterByEntity(id: string) {
    this.entityIdFilter.set(id);
    this.resetPages();
  }

  clearActorFilter() {
    this.actorIdFilter.set("");
    this.resetPages();
  }

  clearEntityFilter() {
    this.entityIdFilter.set("");
    this.resetPages();
  }

  filtersActive() {
    return !!(
      this.actionFilter() ||
      this.actorTypeFilter() ||
      this.actorIdFilter() ||
      this.entityIdFilter()
    );
  }

  clearFilters() {
    this.clearActionFilter();
    this.actorTypeFilter.set("");
    this.actorIdFilter.set("");
    this.entityIdFilter.set("");
    this.resetPages();
  }

  shortId(id: string) {
    return id.length > 6 ? `${id.slice(0, 5)}…` : id;
  }

  exportCsv() {
    downloadCsv("audit", this.auditLogs(), [
      { label: "Seq", value: (l) => l.seq },
      { label: "Action", value: (l) => l.action },
      { label: "Actor type", value: (l) => l.actorType },
      { label: "Actor ID", value: (l) => l.actorId },
      { label: "Entity type", value: (l) => l.entityType },
      { label: "Entity ID", value: (l) => l.entityId },
      { label: "IP", value: (l) => l.ip },
      { label: "User agent", value: (l) => l.userAgent },
      { label: "Created", value: (l) => l.createdAt },
    ]);
  }

  private resetPages() {
    this.rawAppended.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.auditQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getAuditLogs({
        action: this.actionFilter() || undefined,
        actorType: this.actorTypeFilter() || undefined,
        actorId: this.actorIdFilter() || undefined,
        entityId: this.entityIdFilter() || undefined,
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
          this.toast.show("error", "Failed to load more audit logs");
        },
      });
  }

  verifyMutation = injectMutation(() => ({
    mutationFn: ({ from, to }: { from: number; to: number }) =>
      lastValueFrom(this.adminService.verifyAuditChain(from, to)),
    onSuccess: (res) => {
      this.verifyResult.set(res);
      if (res.ok) {
        this.toast.show(
          "success",
          `Chain verified: ${res.checked} records valid.`,
        );
      } else {
        this.toast.show(
          "error",
          `Chain broken at sequence ${res.firstBrokenChainSeq}!`,
        );
      }
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to verify hash chain";
      this.toast.show("error", message);
    },
  }));

  runVerifyChain() {
    if (this.rangeError()) return;
    this.verifyMutation.mutate({
      from: this.verifyFromSeq(),
      to: this.verifyToSeq(),
    });
  }
}
