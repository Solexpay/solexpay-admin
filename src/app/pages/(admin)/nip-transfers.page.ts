import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService, NipTransfer } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";

@Component({
  selector: "app-nip-transfers",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusChipComponent],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            NIP Transfers
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Read-only ledger of NIP inter-bank transfers and settlement
            responses
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
      >
        <div
          class="flex gap-2 p-1 bg-surface-container rounded-xl overflow-x-auto"
        >
          @for (tab of statusTabs; track tab.value) {
            <button
              (click)="onStatusChange(tab.value)"
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
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

      <!-- Table -->
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
                  Reference & Session
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Beneficiary (Destination)
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Sender (Source)
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Fee
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (n of [1, 2, 3, 4]; track n) {
                  <tr class="border-t border-surface-container animate-pulse">
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-32 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-28 bg-surface-container-high rounded"
                      ></div>
                    </td>
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
                        class="h-4 w-12 bg-surface-container-high rounded"
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
                        class="h-4 w-8 bg-surface-container-high rounded ml-auto"
                      ></div>
                    </td>
                  </tr>
                }
              } @else {
                @for (tx of transfers(); track tx.id) {
                  <tr
                    class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                  >
                    <td class="px-6 py-4">
                      <p
                        class="text-sm font-semibold font-mono text-on-surface"
                      >
                        {{ tx.reference }}
                      </p>
                      @if (tx.sessionNumber) {
                        <p class="text-xs text-on-surface-variant font-mono">
                          Session: {{ tx.sessionNumber }}
                        </p>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-semibold text-on-surface">
                        {{ tx.destinationAccountName }}
                      </p>
                      <p class="text-xs text-on-surface-variant font-mono">
                        {{ maskAccount(tx.destinationAccountNumber) }} · Bank
                        {{ tx.destinationBankCode }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-semibold text-on-surface">
                        {{ tx.senderAccountName || "Sender" }}
                      </p>
                      <p class="text-xs text-on-surface-variant font-mono">
                        {{ maskAccount(tx.senderAccountNumber) }} · Bank
                        {{ tx.senderBankCode }}
                      </p>
                    </td>
                    <td
                      class="px-6 py-4 text-sm font-bold text-on-surface whitespace-nowrap"
                    >
                      ₦{{ tx.amount | number: "1.0-0" : "en-NG" }}
                    </td>
                    <td
                      class="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap"
                    >
                      ₦{{ tx.fee | number: "1.0-0" : "en-NG" }}
                    </td>
                    <td class="px-6 py-4">
                      <app-status-chip [status]="tx.status"></app-status-chip>
                    </td>
                    <td
                      class="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap"
                    >
                      {{ tx.createdAt | date: "short" }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        (click)="selectedTransfer.set(tx)"
                        class="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
                        title="View Full NIP Details"
                      >
                        <span class="material-symbols-outlined text-sm"
                          >visibility</span
                        >
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if (!loading() && transfers().length === 0) {
          <div class="text-center py-12">
            <span
              class="material-symbols-outlined text-4xl text-surface-variant"
              >send_money</span
            >
            <p class="text-sm text-on-surface-variant mt-2">
              No NIP transfers found
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

      <!-- Detail Modal -->
      @if (selectedTransfer()) {
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
                NIP Transfer Details
              </h2>
              <button
                (click)="selectedTransfer.set(null)"
                class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-sm">
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Reference</span>
                <span class="font-mono font-bold">{{
                  selectedTransfer()!.reference
                }}</span>
              </div>
              @if (selectedTransfer()!.sessionNumber) {
                <div
                  class="flex justify-between py-1 border-b border-surface-container"
                >
                  <span class="text-on-surface-variant">Session Number</span>
                  <span class="font-mono">{{
                    selectedTransfer()!.sessionNumber
                  }}</span>
                </div>
              }
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Status</span>
                <app-status-chip
                  [status]="selectedTransfer()!.status"
                ></app-status-chip>
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Amount</span>
                <span class="font-bold"
                  >₦{{
                    selectedTransfer()!.amount | number: "1.0-0" : "en-NG"
                  }}</span
                >
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Fee</span>
                <span
                  >₦{{
                    selectedTransfer()!.fee | number: "1.0-0" : "en-NG"
                  }}</span
                >
              </div>
              <div class="py-2 border-b border-surface-container">
                <span
                  class="text-xs text-on-surface-variant uppercase font-bold tracking-wider"
                  >Beneficiary Details</span
                >
                <p class="font-semibold text-on-surface mt-1">
                  {{ selectedTransfer()!.destinationAccountName }}
                </p>
                <p class="text-xs text-on-surface-variant font-mono">
                  Account: {{ selectedTransfer()!.destinationAccountNumber }} ·
                  Bank: {{ selectedTransfer()!.destinationBankCode }}
                </p>
              </div>
              <div class="py-2 border-b border-surface-container">
                <span
                  class="text-xs text-on-surface-variant uppercase font-bold tracking-wider"
                  >Sender Details</span
                >
                <p class="font-semibold text-on-surface mt-1">
                  {{ selectedTransfer()!.senderAccountName || "N/A" }}
                </p>
                <p class="text-xs text-on-surface-variant font-mono">
                  Account: {{ selectedTransfer()!.senderAccountNumber }} · Bank:
                  {{ selectedTransfer()!.senderBankCode }}
                </p>
              </div>
              @if (selectedTransfer()!.responseCode) {
                <div
                  class="flex justify-between py-1 border-b border-surface-container"
                >
                  <span class="text-on-surface-variant">NIP Response Code</span>
                  <span class="font-mono font-semibold">{{
                    selectedTransfer()!.responseCode
                  }}</span>
                </div>
              }
              @if (selectedTransfer()!.responseMessage) {
                <div class="py-1">
                  <span class="text-on-surface-variant block mb-1"
                    >NIP Response Message</span
                  >
                  <p
                    class="text-xs bg-surface-container rounded-lg p-2.5 text-on-surface font-mono"
                  >
                    {{ selectedTransfer()!.responseMessage }}
                  </p>
                </div>
              }
              <div class="flex justify-between py-1">
                <span class="text-on-surface-variant">Timestamp</span>
                <span>{{
                  selectedTransfer()!.createdAt | date: "medium"
                }}</span>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="selectedTransfer.set(null)"
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
export class NipTransfersPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

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
