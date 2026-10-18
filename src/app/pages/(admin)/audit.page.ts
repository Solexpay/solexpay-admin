import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  AdminService,
  AuditLog,
  AuditVerifyResult,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { RippleDirective } from "../../directives/ripple.directive";

@Component({
  selector: "app-audit",
  standalone: true,
  imports: [CommonModule, FormsModule, RippleDirective],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            Audit Ledger
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Immutable cryptographic audit trail and hash chain verification
          </p>
        </div>
      </div>

      <!-- Hash Chain Verification Card -->
      <div
        class="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_2px_12px_rgba(25,28,29,0.06)] border border-primary/20"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-primary text-xl"
            >link</span
          >
          <h2 class="text-base font-bold text-on-surface">
            Verify Cryptographic Hash Chain
          </h2>
        </div>
        <p class="text-xs text-on-surface-variant mb-4">
          Verify cryptographic integrity of audit sequence entries. Each audit
          record contains a hash of its payload and previous entry.
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label
              for="verify-from-seq"
              class="text-xs font-semibold text-on-surface-variant"
              >From Seq:</label
            >
            <input
              id="verify-from-seq"
              type="number"
              [(ngModel)]="verifyFromSeq"
              placeholder="1"
              min="1"
              class="w-24 bg-surface-container-highest rounded-xl py-2 px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div class="flex items-center gap-2">
            <label
              for="verify-to-seq"
              class="text-xs font-semibold text-on-surface-variant"
              >To Seq:</label
            >
            <input
              id="verify-to-seq"
              type="number"
              [(ngModel)]="verifyToSeq"
              placeholder="100"
              min="1"
              class="w-24 bg-surface-container-highest rounded-xl py-2 px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            solexRipple
            (click)="runVerifyChain()"
            [disabled]="verifyMutation.isPending()"
            class="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
          >
            @if (verifyMutation.isPending()) {
              <span
                class="inline-block w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"
              ></span>
              <span>Verifying...</span>
            } @else {
              <span class="material-symbols-outlined text-sm">verified</span>
              <span>Verify Chain</span>
            }
          </button>
        </div>

        <!-- Verification Result Banner -->
        @if (verifyResult(); as res) {
          <div
            class="mt-4 p-4 rounded-xl text-sm flex items-start gap-3 transition-all"
            [class]="
              res.ok
                ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                : 'bg-error-container text-on-error-container'
            "
          >
            <span class="material-symbols-outlined text-lg mt-0.5">
              {{ res.ok ? "check_circle" : "error" }}
            </span>
            <div>
              <p class="font-bold">
                {{
                  res.ok
                    ? "Hash Chain Integrity Verified OK"
                    : "Hash Chain Broken / Tampering Detected!"
                }}
              </p>
              @if (res.ok) {
                <p class="text-xs mt-0.5 opacity-90">
                  Checked {{ res.checked }} sequence record{{
                    res.checked === 1 ? "" : "s"
                  }}
                  in range. No discrepancies found.
                </p>
              } @else {
                <p class="text-xs mt-0.5 font-mono">
                  First broken sequence: #{{ res.firstBrokenChainSeq }} (Record
                  ID: {{ res.firstBrokenAuditId }})
                </p>
              }
            </div>
          </div>
        }
      </div>

      <!-- Filters -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <div class="flex-1 min-w-[200px] relative">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            >search</span
          >
          <input
            type="text"
            [ngModel]="actionFilter()"
            (ngModelChange)="onActionFilterChange($event)"
            class="w-full bg-surface-container-highest rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Filter by action (e.g. user.suspend, auth.login)..."
          />
        </div>

        <select
          [ngModel]="actorTypeFilter()"
          (ngModelChange)="onActorTypeChange($event)"
          class="bg-surface-container-highest rounded-xl py-2 px-3 text-sm font-medium outline-none cursor-pointer"
        >
          <option value="">All Actors</option>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
      </div>

      <!-- Audit Logs Table -->
      <div
        class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead>
              <tr class="bg-surface-container text-left">
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Seq
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Action
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Actor
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Entity
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  IP / Client
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (n of [1, 2, 3, 4]; track n) {
                  <tr class="border-t border-surface-container animate-pulse">
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-8 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-28 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-24 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-24 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-20 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-24 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div
                        class="h-4 w-8 bg-surface-container-high rounded ml-auto"
                      ></div>
                    </td>
                  </tr>
                }
              } @else {
                @for (log of auditLogs(); track log.id) {
                  <tr
                    class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                  >
                    <td
                      class="px-6 py-4 font-mono font-bold text-sm text-primary"
                    >
                      #{{ log.seq }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2.5 py-1 bg-surface-container rounded-md font-mono text-xs font-semibold text-on-surface"
                      >
                        {{ log.action }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-semibold text-on-surface">
                        {{ log.actorType }}
                      </p>
                      <p
                        class="text-xs text-on-surface-variant font-mono truncate max-w-[120px]"
                      >
                        {{ log.actorId }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-medium text-on-surface">
                        {{ log.entityType }}
                      </p>
                      <p
                        class="text-xs text-on-surface-variant font-mono truncate max-w-[120px]"
                      >
                        {{ log.entityId }}
                      </p>
                    </td>
                    <td
                      class="px-6 py-4 text-xs font-mono text-on-surface-variant"
                    >
                      <p>{{ log.ip }}</p>
                      <p class="truncate max-w-[140px] text-[11px] opacity-75">
                        {{ log.userAgent }}
                      </p>
                    </td>
                    <td
                      class="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap"
                    >
                      {{ log.createdAt | date: "medium" }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        (click)="selectedLog.set(log)"
                        class="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
                        title="View Payload Data"
                      >
                        <span class="material-symbols-outlined text-sm"
                          >data_object</span
                        >
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (!loading() && auditLogs().length === 0) {
          <div class="text-center py-12">
            <span
              class="material-symbols-outlined text-4xl text-surface-variant"
              >history_edu</span
            >
            <p class="text-sm text-on-surface-variant mt-2">
              No audit logs found
            </p>
          </div>
        }

        @if (hasMore()) {
          <div
            class="flex justify-center p-4 border-t border-surface-container"
          >
            <button
              (click)="loadMore()"
              [disabled]="isLoadingMore()"
              class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
            >
              @if (isLoadingMore()) {
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

      <!-- Payload Viewer Modal -->
      @if (selectedLog()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-[0_32px_64px_rgba(25,28,29,0.12)] max-h-[90vh] overflow-y-auto"
          >
            <div
              class="flex items-center justify-between mb-4 border-b border-surface-container pb-3"
            >
              <h2 class="text-lg font-bold text-on-surface">
                Audit Record #{{ selectedLog()!.seq }} Payload
              </h2>
              <button
                (click)="selectedLog.set(null)"
                class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3">
              <div class="text-xs space-y-1">
                <p>
                  <span class="font-semibold text-on-surface-variant"
                    >Hash:</span
                  >
                  <code
                    class="font-mono text-on-surface select-all break-all"
                    >{{ selectedLog()!.hash }}</code
                  >
                </p>
                <p>
                  <span class="font-semibold text-on-surface-variant"
                    >Action:</span
                  >
                  {{ selectedLog()!.action }}
                </p>
                <p>
                  <span class="font-semibold text-on-surface-variant"
                    >Timestamp:</span
                  >
                  {{ selectedLog()!.createdAt | date: "medium" }}
                </p>
              </div>

              <div>
                <span
                  class="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1"
                  >Payload JSON</span
                >
                <pre
                  class="bg-surface-container rounded-xl p-3 text-xs font-mono text-on-surface overflow-x-auto max-h-60"
                  >{{ selectedLog()!.data | json }}</pre
                >
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="selectedLog.set(null)"
                class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AuditPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  actionFilter = signal("");
  actorTypeFilter = signal("");

  verifyFromSeq = 1;
  verifyToSeq = 100;
  verifyResult = signal<AuditVerifyResult | null>(null);

  auditQuery = injectQuery(() => ({
    queryKey: [
      "audit-logs",
      {
        action: this.actionFilter(),
        actorType: this.actorTypeFilter(),
      },
    ],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getAuditLogs({
          action: this.actionFilter() || undefined,
          actorType: this.actorTypeFilter() || undefined,
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
    this.actionFilter.set(val);
    this.rawAppended.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  onActorTypeChange(val: string) {
    this.actorTypeFilter.set(val);
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
    if (
      this.verifyFromSeq <= 0 ||
      this.verifyToSeq <= 0 ||
      this.verifyFromSeq > this.verifyToSeq
    ) {
      this.toast.show("error", "Please provide a valid sequence range");
      return;
    }
    this.verifyMutation.mutate({
      from: this.verifyFromSeq,
      to: this.verifyToSeq,
    });
  }
}
