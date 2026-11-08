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
  LucideDynamicIcon,
  LucideChevronDown as ChevronDown,
  LucideCircleAlert as CircleAlert,
  LucideEye as Eye,
  LucideGift as Gift,
  LucideInfo as Info,
  LucideLoaderCircle as LoaderCircle,
  LucideX as X,
} from "@lucide/angular";
import {
  AdminService,
  GiftCardOrder,
  CursorPage,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { PageHeaderComponent } from "../../components/ui/page-header.component";
import { ModalDirective } from "../../directives/modal.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";

@Component({
  selector: "app-gift-cards",
  imports: [
    CommonModule,
    FormsModule,
    LucideDynamicIcon,
    StatusChipComponent,
    PageHeaderComponent,
    ModalDirective,
    CopyToClipboardDirective,
  ],
  template: `
    <app-page-header
      title="Gift Card Orders"
      [icon]="GiftIcon"
      subtitle="Manage digital gift cards, delivery fulfillment, and exceptions"
    />

    <div class="space-y-4">
      <!-- At a glance -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        @for (card of statCards(); track card.key) {
          <button
            type="button"
            class="gc-stat group text-left"
            [class.gc-stat-on]="
              statusFilter() === card.filter && card.key !== 'risk'
            "
            (click)="onStatusChange(card.filter)"
          >
            <span class="gc-stat-dot" [class]="card.tone"></span>
            <span class="text-[12px] font-medium text-ui-muted">{{
              card.label
            }}</span>
            <span
              class="mt-1 block text-[26px] font-semibold leading-8 tracking-tight tabular-nums text-ui-ink"
            >
              @if (statsLoading()) {
                <span class="ui-skel inline-block h-7 w-14 align-middle"></span>
              } @else {
                {{ card.value }}
              }
            </span>
            <span class="mt-0.5 block text-[12px] text-ui-faint">{{
              card.hint
            }}</span>
          </button>
        }
      </div>

      <!-- Orders -->
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Orders</h2>
          <div class="gc-seg" role="tablist" aria-label="Filter orders">
            @for (tab of statusTabs; track tab.value) {
              <button
                type="button"
                class="gc-seg-item"
                role="tab"
                [attr.aria-selected]="statusFilter() === tab.value"
                [class.gc-seg-on]="statusFilter() === tab.value"
                (click)="onStatusChange(tab.value)"
              >
                {{ tab.label }}
                @if (countFor(tab.value) !== null) {
                  <span class="gc-seg-count">{{ countFor(tab.value) }}</span>
                }
              </button>
            }
          </div>
        </div>
        <div class="ui-panel-body overflow-hidden">
          <div class="ui-table-wrap">
            <table class="ui-table md:min-w-[760px]">
              <thead>
                <tr>
                  <th>Gift card</th>
                  <th class="hidden md:table-cell">Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Placed</th>
                  <th class="text-right">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  @for (n of [1, 2, 3, 4]; track n) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="ui-skel size-9 rounded-xl"></div>
                          <div class="space-y-1.5">
                            <div class="ui-skel h-4 w-32"></div>
                            <div class="ui-skel h-3 w-20"></div>
                          </div>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-24"></div>
                      </td>
                      <td><div class="ui-skel h-4 w-20"></div></td>
                      <td><div class="ui-skel h-5 w-16 rounded-full"></div></td>
                      <td class="hidden md:table-cell">
                        <div class="ui-skel h-4 w-16"></div>
                      </td>
                      <td><div class="ui-skel ml-auto h-4 w-16"></div></td>
                    </tr>
                  }
                } @else if (ordersQuery.isError()) {
                  <tr>
                    <td [attr.colspan]="6">
                      <div class="ui-empty">
                        <svg
                          [lucideIcon]="CircleAlertIcon"
                          [size]="28"
                          class="text-ui-danger"
                        ></svg>
                        <p>Couldn't load gift card orders.</p>
                        <button
                          type="button"
                          class="ui-btn ui-btn-sm"
                          (click)="ordersQuery.refetch()"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (order of orders(); track order.id) {
                    <tr class="gc-row">
                      <td>
                        <div class="flex items-center gap-3">
                          <span
                            class="gc-tile"
                            [style.--brand]="brand(order).color"
                            aria-hidden="true"
                            >{{ brand(order).initial }}</span
                          >
                          <div class="min-w-0">
                            <p class="truncate font-medium text-ui-ink">
                              {{ order.productName }}
                            </p>
                            <p
                              class="font-mono text-[11.5px] text-ui-faint"
                              [copyToClipboard]="order.reference"
                            >
                              {{ order.reference }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="hidden md:table-cell">
                        <div class="flex items-center gap-2.5">
                          <span class="gc-avatar" aria-hidden="true">{{
                            initials(order.userName)
                          }}</span>
                          <div class="min-w-0">
                            <p class="truncate text-ui-ink">
                              {{ order.userName }}
                            </p>
                            <p
                              class="font-mono text-[11.5px] text-ui-faint"
                              [copyToClipboard]="order.userId"
                            >
                              {{ order.userId }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="whitespace-nowrap">
                        <p class="font-semibold tabular-nums text-ui-ink">
                          ₦{{ order.price | number: "1.0-0" : "en-NG" }}
                        </p>
                        <p class="text-[11.5px] text-ui-faint">
                          {{ order.faceValue }} face value
                        </p>
                      </td>
                      <td>
                        @if (order.status === "UNKNOWN") {
                          <span class="ui-badge ui-badge-warning"
                            >Needs review</span
                          >
                        } @else {
                          <app-status-chip [status]="order.status" />
                        }
                      </td>
                      <td class="hidden whitespace-nowrap md:table-cell">
                        <p class="text-ui-body">{{ ago(order.createdAt) }}</p>
                        <p class="text-[11.5px] text-ui-faint">
                          {{ order.createdAt | date: "MMM d, h:mm a" }}
                        </p>
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1.5">
                          @if (
                            order.status === "UNKNOWN" ||
                            order.status === "PENDING"
                          ) {
                            <button
                              type="button"
                              class="ui-btn ui-btn-sm border-ui-success-line bg-ui-success-soft text-ui-success shadow-none hover:bg-green-100"
                              (click)="openResolveDelivered(order)"
                            >
                              Deliver
                            </button>
                            <button
                              type="button"
                              class="ui-btn ui-btn-sm ui-btn-ghost text-ui-danger hover:bg-red-50"
                              (click)="openResolveFailed(order)"
                            >
                              Fail
                            </button>
                          }
                          <button
                            type="button"
                            class="ui-icon-btn"
                            (click)="openDetail(order)"
                            title="View details"
                            aria-label="View details"
                          >
                            <svg [lucideIcon]="EyeIcon" [size]="16"></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="6">
                        <div class="ui-empty py-10">
                          <span class="gc-empty-art" aria-hidden="true">
                            <svg [lucideIcon]="GiftIcon" [size]="26"></svg>
                          </span>
                          @if (statusFilter() === "UNKNOWN") {
                            <p class="font-medium text-ui-ink">All caught up</p>
                            <p class="text-ui-muted">
                              No orders are waiting on you.
                            </p>
                          } @else {
                            <p class="font-medium text-ui-ink">
                              No gift card orders here
                            </p>
                            <p class="text-ui-muted">
                              Try another filter to see more.
                            </p>
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
              <span>{{ orders().length }} shown</span>
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

    <!-- Detail modal -->
    @if (selectedOrder()) {
      <div class="ui-overlay">
        <div
          class="ui-backdrop"
          aria-hidden="true"
          (click)="selectedOrder.set(null)"
        ></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="selectedOrder.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Gift Card Order Details</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="selectedOrder.set(null)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body">
            <dl class="ui-dl">
              <div>
                <dt class="ui-dt">Order ID</dt>
                <dd
                  class="ui-dd font-mono"
                  [copyToClipboard]="selectedOrder()!.id"
                >
                  {{ selectedOrder()!.id }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">User ID</dt>
                <dd
                  class="ui-dd font-mono"
                  [copyToClipboard]="selectedOrder()!.userId"
                >
                  {{ selectedOrder()!.userId }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Product</dt>
                <dd class="ui-dd">
                  {{ selectedOrder()!.productName }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Face Value</dt>
                <dd class="ui-dd">{{ selectedOrder()!.faceValue }}</dd>
              </div>
              <div>
                <dt class="ui-dt">Amount</dt>
                <dd class="ui-dd tabular-nums">
                  ₦{{ selectedOrder()!.price | number: "1.0-0" : "en-NG" }}
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Status</dt>
                <dd class="ui-dd">
                  <app-status-chip [status]="selectedOrder()!.status" />
                </dd>
              </div>
              <div>
                <dt class="ui-dt">Codes Stored In System</dt>
                <dd class="ui-dd">
                  {{ selectedOrder()!.codesStored ? "Yes" : "No" }}
                </dd>
              </div>
              @if (selectedOrder()!.resolutionNote) {
                <div class="sm:col-span-2">
                  <dt class="ui-dt">Resolution Note</dt>
                  <dd
                    class="mt-1 rounded-lg bg-ui-sunken p-2.5 text-[13px] text-ui-body"
                  >
                    {{ selectedOrder()!.resolutionNote }}
                  </dd>
                </div>
              }
            </dl>
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="selectedOrder.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Resolve delivered modal -->
    @if (deliveringOrder()) {
      <div class="ui-overlay">
        <div class="ui-backdrop" aria-hidden="true"></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="deliveringOrder.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Resolve Order as Delivered</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="deliveringOrder.set(null)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body space-y-4">
            <p class="text-sm text-ui-muted">
              Order:
              <span class="font-mono font-medium text-ui-ink">{{
                deliveringOrder()!.id
              }}</span>
            </p>

            @if (!deliveringOrder()!.codesStored) {
              <div>
                <label for="delivery-codes-input" class="ui-label">
                  Gift Card Code(s) (Required as order has no stored codes)
                </label>
                <textarea
                  id="delivery-codes-input"
                  class="ui-input"
                  data-autofocus
                  [ngModel]="deliveryCodesInput()"
                  (ngModelChange)="deliveryCodesInput.set($event)"
                  rows="3"
                  placeholder="Enter codes separated by commas or lines"
                ></textarea>
                <p class="mt-1.5 text-xs text-ui-muted">
                  {{ deliveryCodes().length }}
                  {{ deliveryCodes().length === 1 ? "code" : "codes" }}
                </p>
                <p class="mt-1.5 text-xs text-ui-muted">
                  Codes are transmitted securely and will never be displayed in
                  the UI.
                </p>
              </div>
            } @else {
              <div class="ui-alert ui-alert-info">
                <svg [lucideIcon]="InfoIcon" [size]="16" class="mt-0.5"></svg>
                <p>
                  System already has stored codes for this order. No additional
                  code entry is required.
                </p>
              </div>
            }
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="deliveringOrder.set(null)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="ui-btn ui-btn-primary"
              (click)="submitResolveDelivered()"
              [disabled]="resolveDeliveredMutation.isPending()"
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

    <!-- Resolve failed modal -->
    @if (failingOrder()) {
      <div class="ui-overlay">
        <div class="ui-backdrop" aria-hidden="true"></div>
        <div
          class="ui-modal"
          role="dialog"
          aria-modal="true"
          uiModal
          (uiModalClose)="failingOrder.set(null)"
        >
          <div class="ui-modal-head">
            <h2 class="ui-modal-title">Resolve Order as Failed</h2>
            <button
              type="button"
              class="ui-icon-btn"
              (click)="failingOrder.set(null)"
              aria-label="Close"
            >
              <svg [lucideIcon]="XIcon" [size]="16"></svg>
            </button>
          </div>

          <div class="ui-modal-body space-y-4">
            <p class="text-sm text-ui-muted">
              Order:
              <span class="font-mono font-medium text-ui-ink">{{
                failingOrder()!.id
              }}</span>
            </p>

            <div>
              <label for="failure-note-input" class="ui-label">
                Failure Reason / Note (Required)
              </label>
              <textarea
                id="failure-note-input"
                class="ui-input"
                data-autofocus
                [ngModel]="failureNoteInput()"
                (ngModelChange)="failureNoteInput.set($event)"
                (keydown.control.enter)="submitResolveFailed()"
                (keydown.meta.enter)="submitResolveFailed()"
                rows="3"
                placeholder="Reason for marking order as failed"
              ></textarea>
            </div>
          </div>

          <div class="ui-modal-foot">
            <button
              type="button"
              class="ui-btn"
              (click)="failingOrder.set(null)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="ui-btn ui-btn-danger"
              (click)="submitResolveFailed()"
              [disabled]="
                resolveFailedMutation.isPending() || !failureNoteInput().trim()
              "
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
  `,
})
export class GiftCardsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  readonly GiftIcon = Gift;
  readonly EyeIcon = Eye;
  readonly XIcon = X;
  readonly InfoIcon = Info;
  readonly LoaderIcon = LoaderCircle;
  readonly ChevronDownIcon = ChevronDown;
  readonly CircleAlertIcon = CircleAlert;

  // Defaults to UNKNOWN as required by SPEC
  statusFilter = signal<string>("UNKNOWN");

  readonly statusTabs = [
    { label: "Needs action", value: "UNKNOWN" },
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

  // One unfiltered look at the queue feeds the counts and the stat cards.
  statsQuery = injectQuery(() => ({
    queryKey: ["gift-card-orders", "stats"],
    queryFn: () =>
      lastValueFrom(
        this.adminService.getGiftCardOrders({ status: "", limit: 100 }),
      ),
  }));
  statsLoading = computed(() => this.statsQuery.isPending());

  private tally = computed(() => {
    const items = this.statsQuery.data()?.items ?? [];
    const count = (st: string) => items.filter((o) => o.status === st).length;
    const open = items.filter(
      (o) => o.status === "UNKNOWN" || o.status === "PENDING",
    );
    return {
      all: items.length,
      open: open.length,
      delivered: count("DELIVERED"),
      failed: count("FAILED"),
      atRisk: open.reduce((sum, o) => sum + o.price, 0),
      more: this.statsQuery.data()?.hasMore ?? false,
    };
  });

  statCards = computed(() => {
    const t = this.tally();
    const plus = t.more ? "+" : "";
    return [
      {
        key: "open",
        label: "Needs action",
        value: `${t.open}${plus}`,
        hint: t.open ? "Waiting on a decision" : "Nothing waiting",
        tone: "bg-amber-500",
        filter: "UNKNOWN",
      },
      {
        key: "risk",
        label: "Value on hold",
        value: `₦${t.atRisk.toLocaleString("en-NG")}`,
        hint: "Charged, not yet delivered",
        tone: "bg-ui-accent",
        filter: "UNKNOWN",
      },
      {
        key: "delivered",
        label: "Delivered",
        value: `${t.delivered}${plus}`,
        hint: "Codes sent to customers",
        tone: "bg-emerald-500",
        filter: "DELIVERED",
      },
      {
        key: "failed",
        label: "Failed",
        value: `${t.failed}${plus}`,
        hint: "Refunded or closed out",
        tone: "bg-red-500",
        filter: "FAILED",
      },
    ];
  });

  countFor(filter: string): string | null {
    if (this.statsLoading()) return null;
    const t = this.tally();
    const n =
      filter === "UNKNOWN"
        ? t.open
        : filter === "DELIVERED"
          ? t.delivered
          : filter === "FAILED"
            ? t.failed
            : t.all;
    return `${n}${t.more ? "+" : ""}`;
  }

  private static readonly BRANDS: Record<string, string> = {
    steam: "#1b2838",
    amazon: "#f59e0b",
    itunes: "#ec4899",
    apple: "#111827",
    google: "#16a34a",
    playstation: "#1d4ed8",
    psn: "#1d4ed8",
    xbox: "#107c10",
    netflix: "#dc2626",
    spotify: "#1db954",
    razer: "#16a34a",
    roblox: "#ef4444",
    nintendo: "#e60012",
    "free fire": "#f97316",
  };

  brand(order: GiftCardOrder) {
    const name = order.productName.trim();
    const key = Object.keys(GiftCardsPageComponent.BRANDS).find((k) =>
      name.toLowerCase().includes(k),
    );
    return {
      initial: name.charAt(0).toUpperCase(),
      color: key ? GiftCardsPageComponent.BRANDS[key] : "#64748b",
    };
  }

  initials(name: string): string {
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("") || "?"
    );
  }

  ago(iso: string): string {
    const mins = Math.max(
      0,
      Math.round((Date.now() - Date.parse(iso)) / 60000),
    );
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  }

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

  deliveryCodesInput = signal("");
  failureNoteInput = signal("");

  deliveryCodes = computed(() =>
    this.deliveryCodesInput()
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0),
  );

  onStatusChange(val: string) {
    this.statusFilter.set(val);
    this.resetPages();
  }

  private resetPages() {
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
    this.deliveryCodesInput.set("");
  }

  openResolveFailed(order: GiftCardOrder) {
    this.failingOrder.set(order);
    this.failureNoteInput.set("");
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
      this.resetPages();
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
      this.resetPages();
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
      const splitCodes = this.deliveryCodes();
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
    const note = this.failureNoteInput().trim();
    if (!order || !note) {
      this.toast.show("error", "A failure note is required");
      return;
    }

    this.resolveFailedMutation.mutate({ orderId: order.id, note });
  }
}
