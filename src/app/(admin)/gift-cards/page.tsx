"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CircleAlert, Eye, Gift, Info, X } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useMemo, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  getGiftCardOrders,
  resolveGiftCardDelivered,
  resolveGiftCardFailed,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { formatDateTime, formatNaira, formatRelative } from "@/lib/format";
import { trackAction } from "@/lib/telemetry";
import type { CursorPage, GiftCardOrder } from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

const BRAND_COLORS: Record<string, string> = {
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

function getBrand(productName: string) {
  const name = (productName || "").trim();
  const lower = name.toLowerCase();
  const match = Object.keys(BRAND_COLORS).find((k) => lower.includes(k));
  return {
    initial: name.charAt(0).toUpperCase() || "G",
    color: match ? BRAND_COLORS[match] : "#64748b",
  };
}

const STATUS_TABS = [
  { label: "Needs action", value: "UNKNOWN" },
  { label: "All Orders", value: "" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Failed", value: "FAILED" },
];

function GiftCardsContent() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("UNKNOWN").withOptions(queryOptions),
  );
  const [orderId, setOrderId] = useQueryState(
    "order",
    parseAsString.withDefault("").withOptions(queryOptions),
  );

  const [deliveringOrder, setDeliveringOrder] = useState<GiftCardOrder | null>(
    null,
  );
  const [deliveryCodesInput, setDeliveryCodesInput] = useState("");

  const [failingOrder, setFailingOrder] = useState<GiftCardOrder | null>(null);
  const [failureNoteInput, setFailureNoteInput] = useState("");

  const session = useAdminSession();
  const queryClient = useQueryClient();
  const isOpsRole =
    session.admin?.role === "OPS" || session.admin?.role === "SUPER_ADMIN";

  // Orders Query
  const ordersQuery = useInfiniteQuery<CursorPage<GiftCardOrder>>({
    queryKey: ["admin", "gift-card-orders", { status }],
    queryFn: ({ pageParam }) =>
      getGiftCardOrders({
        status: status || undefined,
        limit: 20,
        cursor: (pageParam as string | undefined) || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

  // Global stats query across orders
  const statsQuery = useQuery({
    queryKey: ["admin", "gift-card-orders", "stats"],
    queryFn: () => getGiftCardOrders({ status: "", limit: 100 }),
  });

  const allOrders = ordersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedOrder = allOrders.find((o) => o.id === orderId);

  // Compute stat tallies
  const tally = useMemo(() => {
    const items = statsQuery.data?.items ?? [];
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
      more: statsQuery.data?.hasMore ?? false,
    };
  }, [statsQuery.data]);

  const statCards = [
    {
      key: "open",
      label: "Needs action",
      value: `${tally.open}${tally.more ? "+" : ""}`,
      hint: tally.open ? "Waiting on a decision" : "Nothing waiting",
      tone: "bg-amber-500",
      filter: "UNKNOWN",
    },
    {
      key: "risk",
      label: "Value on hold",
      value: `₦${formatNaira(tally.atRisk)}`,
      hint: "Charged, not yet delivered",
      tone: "bg-ui-accent",
      filter: "UNKNOWN",
    },
    {
      key: "delivered",
      label: "Delivered",
      value: `${tally.delivered}${tally.more ? "+" : ""}`,
      hint: "Codes sent to customers",
      tone: "bg-emerald-500",
      filter: "DELIVERED",
    },
    {
      key: "failed",
      label: "Failed",
      value: `${tally.failed}${tally.more ? "+" : ""}`,
      hint: "Refunded or closed out",
      tone: "bg-red-500",
      filter: "FAILED",
    },
  ];

  // Resolve Delivered Mutation
  const resolveDeliveredMutation = useMutation({
    mutationFn: ({ id, codes }: { id: string; codes?: string[] }) =>
      resolveGiftCardDelivered(id, codes ? { codes } : undefined),
    onSuccess: () => {
      toast.success("Gift card marked as delivered");
      setDeliveringOrder(null);
      setDeliveryCodesInput("");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "gift-card-orders"],
      });
    },
    onError: () => toast.error("Failed to resolve delivery"),
  });

  // Resolve Failed Mutation
  const resolveFailedMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      resolveGiftCardFailed(id, { note }),
    onSuccess: () => {
      toast.success("Gift card marked as failed");
      setFailingOrder(null);
      setFailureNoteInput("");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "gift-card-orders"],
      });
    },
    onError: () => toast.error("Failed to mark order as failed"),
  });

  const parsedDeliveryCodes = useMemo(() => {
    return deliveryCodesInput
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }, [deliveryCodesInput]);

  const submitResolveDelivered = () => {
    if (!deliveringOrder) return;
    let codes: string[] | undefined;
    if (!deliveringOrder.codesStored) {
      if (parsedDeliveryCodes.length === 0) {
        toast.error("Delivery codes are required for this order");
        return;
      }
      codes = parsedDeliveryCodes;
    }
    resolveDeliveredMutation.mutate({ id: deliveringOrder.id, codes });
  };

  const submitResolveFailed = () => {
    if (!failingOrder) return;
    const note = failureNoteInput.trim();
    if (!note) {
      toast.error("A failure note is required");
      return;
    }
    resolveFailedMutation.mutate({ id: failingOrder.id, note });
  };

  const openDetail = (order: GiftCardOrder) => {
    trackAction("gift_card_detail_open", { id: order.id });
    void setOrderId(order.id);
  };

  const closeDetail = () => {
    void setOrderId("");
  };

  const columns: Column<GiftCardOrder>[] = [
    {
      id: "product",
      header: "Gift card",
      mobile: "primary",
      cell: (order) => {
        const brand = getBrand(order.productName);
        return (
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm"
              style={{ backgroundColor: brand.color }}
              aria-hidden="true"
            >
              {brand.initial}
            </span>
            <div className="min-w-0 max-w-[190px]">
              <button
                type="button"
                className="truncate text-left font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={order.productName}
                onClick={() => openDetail(order)}
              >
                {order.productName}
              </button>
              <p
                className="truncate font-mono text-[11.5px] text-ui-muted"
                title={order.reference}
              >
                {order.reference}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      mobile: "secondary",
      cell: (order) => (
        <div className="flex items-center gap-2.5">
          <BubbleAvatar seed={order.userName || "?"} size={32} />
          <div className="min-w-0 max-w-[170px]">
            {order.userId ? (
              <Link
                href={`/users?user=${encodeURIComponent(order.userId)}`}
                className="block truncate font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={order.userName}
                onClick={(e) => e.stopPropagation()}
              >
                {order.userName}
              </Link>
            ) : (
              <p
                className="truncate font-medium text-ui-ink"
                title={order.userName}
              >
                {order.userName}
              </p>
            )}
            <p
              className="truncate font-mono text-[11.5px] text-ui-muted"
              title={order.userId}
            >
              {order.userId}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      mobile: "primary",
      cell: (order) => (
        <div className="whitespace-nowrap">
          <p className="font-semibold tabular-nums text-ui-ink">
            ₦{formatNaira(order.price)}
          </p>
          <p className="text-[11.5px] text-ui-muted">
            {order.faceValue} face value
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "primary",
      cell: (order) =>
        order.status === "UNKNOWN" ? (
          <span className="ui-badge ui-badge-warning">Needs review</span>
        ) : (
          <StatusChip status={order.status} />
        ),
    },
    {
      id: "placed",
      header: "Placed",
      mobile: "hidden",
      cell: (order) => (
        <div className="whitespace-nowrap text-xs">
          <p className="text-ui-body">{formatRelative(order.createdAt)}</p>
          <p className="text-[11px] text-ui-muted">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Gift Card Orders"
        icon={Gift}
        subtitle="Manage digital gift cards, delivery fulfillment, and exceptions"
      />

      <div className="space-y-4">
        {/* At a glance stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const isActive = status === card.filter && card.key !== "risk";
            return (
              <button
                key={card.key}
                type="button"
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  isActive
                    ? "border-ui-accent bg-ui-accent-soft/30 shadow-sm ring-1 ring-ui-accent"
                    : "border-ui-line bg-white hover:border-ui-line-strong hover:bg-ui-sunken/40"
                }`}
                onClick={() => void setStatus(card.filter)}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${card.tone}`} />
                  <span className="text-xs font-medium text-ui-muted">
                    {card.label}
                  </span>
                </div>
                <span className="mt-1 block text-2xl font-semibold leading-7 tabular-nums text-ui-ink">
                  {statsQuery.isPending ? (
                    <span className="ui-skel inline-block h-6 w-14 align-middle" />
                  ) : (
                    card.value
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-ui-faint">
                  {card.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Panel */}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Orders</h2>

            <div
              className="ui-tabs overflow-x-auto"
              role="tablist"
              aria-label="Filter orders"
            >
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.value === "UNKNOWN"
                    ? tally.open
                    : tab.value === "DELIVERED"
                      ? tally.delivered
                      : tab.value === "FAILED"
                        ? tally.failed
                        : tally.all;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={`ui-tab ${status === tab.value ? "ui-tab-active" : ""}`}
                    role="tab"
                    aria-selected={status === tab.value}
                    onClick={() => void setStatus(tab.value)}
                  >
                    <span>{tab.label}</span>
                    {!statsQuery.isPending && (
                      <span className="ml-1 rounded-full bg-ui-sunken px-1.5 py-0.5 text-[11px] font-semibold text-ui-muted">
                        {count}
                        {tally.more ? "+" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {ordersQuery.isError && (
            <div className="ui-alert ui-alert-danger m-4">
              <CircleAlert size={16} />
              <div className="flex-1">Couldn&apos;t load gift card orders.</div>
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => void ordersQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={allOrders}
              columns={columns}
              keyExtractor={(o) => o.id}
              loading={ordersQuery.isPending}
              onRowClick={openDetail}
              hasMore={Boolean(ordersQuery.hasNextPage)}
              isLoadingMore={ordersQuery.isFetchingNextPage}
              onLoadMore={() => void ordersQuery.fetchNextPage()}
              totalText={`${allOrders.length} shown${ordersQuery.hasNextPage ? " · more available" : ""}`}
              rowActions={(order) => (
                <div className="flex items-center justify-end gap-1.5">
                  {(order.status === "UNKNOWN" || order.status === "PENDING") &&
                    isOpsRole && (
                      <>
                        <button
                          type="button"
                          className="ui-btn ui-btn-sm border-ui-success-line bg-ui-success-soft text-ui-success hover:bg-green-100"
                          onClick={() => {
                            setDeliveringOrder(order);
                            setDeliveryCodesInput("");
                          }}
                        >
                          Deliver
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn-sm ui-btn-ghost text-ui-danger hover:bg-red-50"
                          onClick={() => {
                            setFailingOrder(order);
                            setFailureNoteInput("");
                          }}
                        >
                          Fail
                        </button>
                      </>
                    )}
                  <button
                    type="button"
                    className="ui-icon-btn"
                    onClick={() => openDetail(order)}
                    aria-label="View details"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              )}
              emptyState={
                <EmptyState
                  icon={Gift}
                  title={
                    status === "UNKNOWN"
                      ? "All caught up"
                      : "No gift card orders here"
                  }
                  message={
                    status === "UNKNOWN"
                      ? "No orders are waiting on you."
                      : "Try another filter to see more."
                  }
                  action={
                    status !== "UNKNOWN"
                      ? {
                          label: "View needs action",
                          onClick: () => void setStatus("UNKNOWN"),
                        }
                      : undefined
                  }
                />
              }
            />
          </div>
        </section>
      </div>

      {/* Order Details Modal */}
      <Modal
        open={Boolean(orderId)}
        onClose={closeDetail}
        ariaLabel="Gift Card Order Details"
        className="max-h-[92dvh] overflow-y-auto md:max-w-xl"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Gift Card Order Details</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={closeDetail}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ui-modal-body">
          {selectedOrder && (
            <dl className="ui-dl">
              <div>
                <dt className="ui-dt">Order ID</dt>
                <dd className="ui-dd flex items-center gap-1.5 font-mono text-[13px]">
                  <span className="truncate">{selectedOrder.id}</span>
                  <CopyButton
                    value={selectedOrder.id}
                    aria-label="Copy order ID"
                  />
                </dd>
              </div>

              <div>
                <dt className="ui-dt">User ID</dt>
                <dd className="ui-dd flex items-center gap-1.5 font-mono text-[13px]">
                  <span className="truncate">{selectedOrder.userId}</span>
                  <CopyButton
                    value={selectedOrder.userId}
                    aria-label="Copy user ID"
                  />
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Product</dt>
                <dd className="ui-dd font-medium text-ui-ink">
                  {selectedOrder.productName}
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Face Value</dt>
                <dd className="ui-dd">{selectedOrder.faceValue}</dd>
              </div>

              <div>
                <dt className="ui-dt">Amount</dt>
                <dd className="ui-dd font-semibold tabular-nums text-ui-ink">
                  ₦{formatNaira(selectedOrder.price)}
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Status</dt>
                <dd className="ui-dd">
                  {selectedOrder.status === "UNKNOWN" ? (
                    <span className="ui-badge ui-badge-warning">
                      Needs review
                    </span>
                  ) : (
                    <StatusChip status={selectedOrder.status} />
                  )}
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Codes Stored In System</dt>
                <dd className="ui-dd">
                  {selectedOrder.codesStored ? "Yes" : "No"}
                </dd>
              </div>

              {selectedOrder.resolutionNote && (
                <div className="sm:col-span-2">
                  <dt className="ui-dt">Resolution Note</dt>
                  <dd className="mt-1 rounded-lg bg-ui-sunken p-2.5 text-[13px] text-ui-body">
                    {selectedOrder.resolutionNote}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={closeDetail}
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Resolve Delivered Modal */}
      <Modal
        open={Boolean(deliveringOrder)}
        onClose={() => setDeliveringOrder(null)}
        title="Resolve Order as Delivered"
        className="max-h-[90dvh] overflow-y-auto md:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Resolve Order as Delivered</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setDeliveringOrder(null)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ui-modal-body space-y-4">
          <p className="text-sm text-ui-muted">
            Order:{" "}
            <span className="font-mono font-medium text-ui-ink">
              {deliveringOrder?.id}
            </span>
          </p>

          {!deliveringOrder?.codesStored ? (
            <div>
              <label htmlFor="delivery-codes-input" className="ui-label">
                Gift Card Code(s) (Required as order has no stored codes)
              </label>
              <textarea
                id="delivery-codes-input"
                className="ui-input mt-1"
                rows={3}
                value={deliveryCodesInput}
                onChange={(e) => setDeliveryCodesInput(e.target.value)}
                placeholder="Enter codes separated by commas or lines"
              />
              <p className="mt-1.5 text-xs text-ui-muted">
                {parsedDeliveryCodes.length}{" "}
                {parsedDeliveryCodes.length === 1 ? "code" : "codes"} entered.
              </p>
              <p className="mt-1 text-xs text-ui-muted">
                Codes are transmitted securely and will never be displayed in
                the UI.
              </p>
            </div>
          ) : (
            <div className="ui-alert ui-alert-info">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs">
                System already has stored codes for this order. No additional
                code entry is required.
              </p>
            </div>
          )}
        </div>

        <div className="ui-modal-foot flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => setDeliveringOrder(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            onClick={submitResolveDelivered}
            disabled={
              resolveDeliveredMutation.isPending ||
              (!deliveringOrder?.codesStored &&
                parsedDeliveryCodes.length === 0)
            }
          >
            {resolveDeliveredMutation.isPending
              ? "Delivering…"
              : "Confirm Delivered"}
          </button>
        </div>
      </Modal>

      {/* Resolve Failed Modal */}
      <Modal
        open={Boolean(failingOrder)}
        onClose={() => setFailingOrder(null)}
        title="Resolve Order as Failed"
        className="max-h-[90dvh] overflow-y-auto md:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Resolve Order as Failed</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close"
            onClick={() => setFailingOrder(null)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ui-modal-body space-y-4">
          <p className="text-sm text-ui-muted">
            Order:{" "}
            <span className="font-mono font-medium text-ui-ink">
              {failingOrder?.id}
            </span>
          </p>

          <div>
            <label htmlFor="failure-note-input" className="ui-label">
              Failure Reason / Note (Required)
            </label>
            <textarea
              id="failure-note-input"
              className="ui-input mt-1"
              rows={3}
              value={failureNoteInput}
              onChange={(e) => setFailureNoteInput(e.target.value)}
              placeholder="Reason for marking order as failed"
            />
          </div>
        </div>

        <div className="ui-modal-foot flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={() => setFailingOrder(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-btn ui-btn-danger w-full sm:w-auto"
            onClick={submitResolveFailed}
            disabled={
              resolveFailedMutation.isPending || !failureNoteInput.trim()
            }
          >
            {resolveFailedMutation.isPending ? "Resolving…" : "Confirm Failed"}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <GiftCardsContent />
    </Suspense>
  );
}
