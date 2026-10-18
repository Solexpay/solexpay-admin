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
  GiftCardOrder,
  CursorPage,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";

@Component({
  selector: "app-gift-cards",
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
            Gift Card Orders
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Manage digital gift cards, delivery fulfillment, and exceptions
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
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

      <!-- Orders Table -->
      <div
        class="bg-surface-container-lowest rounded-xl shadow-[0_2px_12px_rgba(25,28,29,0.06)] overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px]">
            <thead>
              <tr class="bg-surface-container text-left">
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Order ID & User
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Product / Brand
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Face Value
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  Amount NGN
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
                        class="h-4 w-16 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-20 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-16 bg-surface-container-high rounded"
                      ></div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="h-4 w-24 bg-surface-container-high rounded"
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
                @for (order of orders(); track order.id) {
                  <tr
                    class="border-t border-surface-container hover:bg-surface-container-low transition-colors"
                  >
                    <td class="px-6 py-4">
                      <p
                        class="text-sm font-semibold text-on-surface font-mono"
                      >
                        {{ order.id }}
                      </p>
                      <p class="text-xs text-on-surface-variant">
                        User: {{ order.userId }}
                      </p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-semibold text-on-surface">
                        {{ order.brand }}
                      </p>
                      <p class="text-xs text-on-surface-variant">
                        {{ order.product }}
                      </p>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-on-surface">
                      {{ order.faceValue }}
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-on-surface">
                      ₦{{ order.amountNgn | number: "1.0-0" : "en-NG" }}
                    </td>
                    <td class="px-6 py-4">
                      <app-status-chip
                        [status]="order.status"
                      ></app-status-chip>
                    </td>
                    <td
                      class="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap"
                    >
                      {{ order.createdAt | date: "mediumDate" }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="openDetail(order)"
                          class="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
                          title="View Details"
                        >
                          <span class="material-symbols-outlined text-sm"
                            >visibility</span
                          >
                        </button>
                        @if (
                          order.status === "UNKNOWN" ||
                          order.status === "PENDING"
                        ) {
                          <button
                            solexRipple
                            (click)="openResolveDelivered(order)"
                            class="px-2.5 py-1.5 bg-tertiary text-on-tertiary rounded-lg text-xs font-bold hover:brightness-110"
                          >
                            Deliver
                          </button>
                          <button
                            solexRipple
                            (click)="openResolveFailed(order)"
                            class="px-2.5 py-1.5 bg-error-container text-on-error-container rounded-lg text-xs font-bold hover:bg-error hover:text-on-error"
                          >
                            Fail
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

        @if (!loading() && orders().length === 0) {
          <div class="text-center py-12">
            <span
              class="material-symbols-outlined text-4xl text-surface-variant"
              >card_membership</span
            >
            <p class="text-sm text-on-surface-variant mt-2">
              No gift card orders found
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
      @if (selectedOrder()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-[0_32px_64px_rgba(25,28,29,0.12)]"
          >
            <div
              class="flex items-center justify-between mb-4 border-b border-surface-container pb-3"
            >
              <h2 class="text-lg font-bold text-on-surface">
                Gift Card Order Details
              </h2>
              <button
                (click)="selectedOrder.set(null)"
                class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-sm">
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Order ID</span>
                <span class="font-mono font-medium">{{
                  selectedOrder()!.id
                }}</span>
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">User ID</span>
                <span class="font-mono">{{ selectedOrder()!.userId }}</span>
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Product</span>
                <span class="font-semibold"
                  >{{ selectedOrder()!.brand }} -
                  {{ selectedOrder()!.product }}</span
                >
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Face Value</span>
                <span>{{ selectedOrder()!.faceValue }}</span>
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Amount</span>
                <span class="font-bold"
                  >₦{{
                    selectedOrder()!.amountNgn | number: "1.0-0" : "en-NG"
                  }}</span
                >
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant">Status</span>
                <app-status-chip
                  [status]="selectedOrder()!.status"
                ></app-status-chip>
              </div>
              <div
                class="flex justify-between py-1 border-b border-surface-container"
              >
                <span class="text-on-surface-variant"
                  >Codes Stored In System</span
                >
                <span class="font-semibold">{{
                  selectedOrder()!.codesStored ? "Yes" : "No"
                }}</span>
              </div>
              @if (selectedOrder()!.note) {
                <div class="py-1">
                  <span class="text-on-surface-variant block mb-1"
                    >Resolution Note</span
                  >
                  <p
                    class="text-xs bg-surface-container rounded-lg p-2.5 text-on-surface"
                  >
                    {{ selectedOrder()!.note }}
                  </p>
                </div>
              }
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="selectedOrder.set(null)"
                class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Resolve Delivered Modal -->
      @if (deliveringOrder()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 class="text-lg font-bold text-on-surface mb-2">
              Resolve Order as Delivered
            </h2>
            <p class="text-sm text-on-surface-variant mb-4">
              Order:
              <span class="font-mono font-semibold">{{
                deliveringOrder()!.id
              }}</span>
            </p>

            @if (!deliveringOrder()!.codesStored) {
              <div class="mb-4">
                <label
                  for="delivery-codes-input"
                  class="block text-xs font-semibold text-on-surface mb-1"
                >
                  Gift Card Code(s) (Required as order has no stored codes)
                </label>
                <textarea
                  id="delivery-codes-input"
                  [(ngModel)]="deliveryCodesInput"
                  rows="3"
                  placeholder="Enter codes separated by commas or lines"
                  class="w-full bg-surface-container-highest rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                ></textarea>
                <p class="text-xs text-on-surface-variant mt-1">
                  Codes are transmitted securely and will never be displayed in
                  the UI.
                </p>
              </div>
            } @else {
              <p
                class="text-xs bg-tertiary-fixed text-on-tertiary-fixed-variant p-3 rounded-xl mb-4"
              >
                System already has stored codes for this order. No additional
                code entry is required.
              </p>
            }

            <div class="flex justify-end gap-2">
              <button
                type="button"
                (click)="deliveringOrder.set(null)"
                class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                solexRipple
                type="button"
                (click)="submitResolveDelivered()"
                [disabled]="resolveDeliveredMutation.isPending()"
                class="px-4 py-2 bg-tertiary text-on-tertiary rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {{
                  resolveDeliveredMutation.isPending()
                    ? "Delivering..."
                    : "Confirm Delivered"
                }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Resolve Failed Modal -->
      @if (failingOrder()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/30 backdrop-blur-md"
        >
          <div
            class="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 class="text-lg font-bold text-on-surface mb-2">
              Resolve Order as Failed
            </h2>
            <p class="text-sm text-on-surface-variant mb-4">
              Order:
              <span class="font-mono font-semibold">{{
                failingOrder()!.id
              }}</span>
            </p>

            <div class="mb-4">
              <label
                for="failure-note-input"
                class="block text-xs font-semibold text-on-surface mb-1"
              >
                Failure Reason / Note (Required)
              </label>
              <textarea
                id="failure-note-input"
                [(ngModel)]="failureNoteInput"
                rows="3"
                placeholder="Reason for marking order as failed"
                class="w-full bg-surface-container-highest rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-error/20"
              ></textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                (click)="failingOrder.set(null)"
                class="px-4 py-2 bg-surface-container text-on-surface rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                solexRipple
                type="button"
                (click)="submitResolveFailed()"
                [disabled]="
                  resolveFailedMutation.isPending() || !failureNoteInput.trim()
                "
                class="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {{
                  resolveFailedMutation.isPending()
                    ? "Resolving..."
                    : "Confirm Failed"
                }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class GiftCardsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  // Defaults to UNKNOWN as required by SPEC
  statusFilter = signal<string>("UNKNOWN");

  readonly statusTabs = [
    { label: "Unknown (Action Req.)", value: "UNKNOWN" },
    { label: "All Orders", value: "" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Failed", value: "FAILED" },
  ];

  ordersQuery = injectQuery(() => ({
    queryKey: ["gift-card-orders", { status: this.statusFilter() }],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getGiftCardOrders({
          status: this.statusFilter() || undefined,
          limit: 20,
        }),
      ),
  }));

  loading = computed(() => this.ordersQuery.isPending());

  rawAppended = signal<GiftCardOrder[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.ordersQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  orders = computed<GiftCardOrder[]>(() => {
    const initial = this.ordersQuery.data()?.items || [];
    return [...initial, ...this.rawAppended()];
  });

  selectedOrder = signal<GiftCardOrder | null>(null);
  deliveringOrder = signal<GiftCardOrder | null>(null);
  failingOrder = signal<GiftCardOrder | null>(null);

  deliveryCodesInput = "";
  failureNoteInput = "";

  onStatusChange(val: string) {
    this.statusFilter.set(val);
    this.rawAppended.set([]);
    this.rawHasMore.set(null);
    this.nextCursor.set(null);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.ordersQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getGiftCardOrders({
        status: this.statusFilter() || undefined,
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res: CursorPage<GiftCardOrder>) => {
          this.rawAppended.update((prev) => [...prev, ...(res.items || [])]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more orders");
        },
      });
  }

  openDetail(order: GiftCardOrder) {
    this.selectedOrder.set(order);
  }

  openResolveDelivered(order: GiftCardOrder) {
    this.deliveringOrder.set(order);
    this.deliveryCodesInput = "";
  }

  openResolveFailed(order: GiftCardOrder) {
    this.failingOrder.set(order);
    this.failureNoteInput = "";
  }

  resolveDeliveredMutation = injectMutation(() => ({
    mutationFn: ({ orderId, codes }: { orderId: string; codes?: string[] }) =>
      lastValueFrom(
        this.adminService.resolveGiftCardDelivered(
          orderId,
          codes ? { codes } : undefined,
        ),
      ),
    onSuccess: () => {
      this.toast.show("success", "Gift card marked as delivered");
      this.deliveringOrder.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["gift-card-orders"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to resolve delivery";
      this.toast.show("error", message);
    },
  }));

  resolveFailedMutation = injectMutation(() => ({
    mutationFn: ({ orderId, note }: { orderId: string; note: string }) =>
      lastValueFrom(this.adminService.resolveGiftCardFailed(orderId, { note })),
    onSuccess: () => {
      this.toast.show("success", "Gift card marked as failed");
      this.failingOrder.set(null);
      this.queryClient.invalidateQueries({ queryKey: ["gift-card-orders"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        "Failed to mark order as failed";
      this.toast.show("error", message);
    },
  }));

  submitResolveDelivered() {
    const order = this.deliveringOrder();
    if (!order) return;

    let codes: string[] | undefined;
    if (!order.codesStored) {
      const splitCodes = this.deliveryCodesInput
        .split(/[\n,]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (splitCodes.length === 0) {
        this.toast.show("error", "Delivery codes are required for this order");
        return;
      }
      codes = splitCodes;
    }

    this.resolveDeliveredMutation.mutate({ orderId: order.id, codes });
  }

  submitResolveFailed() {
    const order = this.failingOrder();
    const note = this.failureNoteInput.trim();
    if (!order || !note) {
      this.toast.show("error", "A failure note is required");
      return;
    }

    this.resolveFailedMutation.mutate({ orderId: order.id, note });
  }
}
