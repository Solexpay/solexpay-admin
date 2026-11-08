"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useMemo, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  getCardMovement,
  listCardMovements,
  resolveCardMovementCompleted,
  resolveCardMovementFailed,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime, formatNaira, formatRelative } from "@/lib/format";
import { apiGet } from "@/lib/http";
import { trackAction, trackExport } from "@/lib/telemetry";
import type { CardMovement, CursorPage } from "@/lib/types";
import { confirm, getLastConfirmReason } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

const STATUS_TABS = [
  { label: "Needs Action", value: "UNKNOWN" },
  { label: "Pending", value: "PENDING" },
  { label: "All Movements", value: "" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function CardsContent() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("UNKNOWN").withOptions(queryOptions),
  );
  const [movementId, setMovementId] = useQueryState(
    "movement",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const session = useAdminSession();
  const queryClient = useQueryClient();

  const isOpsRole =
    session.admin?.role === "OPS" || session.admin?.role === "SUPER_ADMIN";

  // Movements list query with 30s auto-refresh
  const movementsQuery = useInfiniteQuery<CursorPage<CardMovement>>({
    queryKey: ["admin", "card-movements", { status }],
    queryFn: ({ pageParam }) =>
      listCardMovements({
        status: status || undefined,
        limit: 25,
        cursor: (pageParam as string | undefined) || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    refetchInterval: 30_000,
  });

  // Track "Updated Xs ago" timer
  useEffect(() => {
    if (!movementsQuery.dataUpdatedAt) return;
    setSecondsAgo(0);
    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - movementsQuery.dataUpdatedAt) / 1000,
      );
      setSecondsAgo(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [movementsQuery.dataUpdatedAt]);

  // Overall counts across movements for stat tallies
  const allStatsQuery = useQuery({
    queryKey: ["admin", "card-movements", "stats"],
    queryFn: () => listCardMovements({ limit: 100 }),
    refetchInterval: 30_000,
  });

  const tally = useMemo(() => {
    const items = allStatsQuery.data?.items ?? [];
    return {
      all: items.length,
      unknown: items.filter((m) => m.status === "UNKNOWN").length,
      pending: items.filter((m) => m.status === "PENDING").length,
      completed: items.filter((m) => m.status === "COMPLETED").length,
      failed: items.filter((m) => m.status === "FAILED").length,
      unknownUsdCents: items
        .filter((m) => m.status === "UNKNOWN" || m.status === "PENDING")
        .reduce((sum, m) => sum + m.amountUsd, 0),
    };
  }, [allStatsQuery.data]);

  // Movement detail query
  const detailQuery = useQuery<CardMovement>({
    queryKey: ["admin", "card-movement", movementId],
    queryFn: () => getCardMovement(movementId),
    enabled: Boolean(movementId),
  });

  // Resolve completed mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      resolveCardMovementCompleted(id, { note }),
    onSuccess: (updated) => {
      toast.success("Card movement marked as completed");
      queryClient.setQueryData(["admin", "card-movement", movementId], updated);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "card-movements"],
      });
    },
    onError: () => {
      toast.error("Failed to complete card movement");
    },
  });

  // Resolve failed mutation
  const failMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      resolveCardMovementFailed(id, { note }),
    onSuccess: (updated) => {
      toast.success("Card movement marked as failed");
      queryClient.setQueryData(["admin", "card-movement", movementId], updated);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "card-movements"],
      });
    },
    onError: () => {
      toast.error("Failed to mark card movement as failed");
    },
  });

  const openDetail = (movement: CardMovement) => {
    void setMovementId(movement.id);
    trackAction("card_movement_open", { id: movement.id });
  };

  const closeDetail = () => {
    void setMovementId("");
  };

  const handleMarkCompleted = async (item: CardMovement) => {
    if (!isOpsRole) return;
    const ok = await confirm({
      title: "Mark Movement as Completed?",
      message:
        "This operation confirms settlement and releases or locks funds. It moves actual money in the card float ledger.",
      confirmLabel: "Complete Movement",
      tone: "primary",
      reasonLabel: "Ops settlement note",
      reasonPlaceholder: "e.g. Confirmed on card provider settlement portal",
      reasonRequired: true,
    });
    if (ok) {
      const note = getLastConfirmReason() || "Marked completed by ops";
      completeMutation.mutate({ id: item.id, note });
    }
  };

  const handleMarkFailed = async (item: CardMovement) => {
    if (!isOpsRole) return;
    const ok = await confirm({
      title: "Mark Movement as Failed?",
      message:
        "This operation marks the transaction as failed and initiates reversal in the customer ledger. This moves money back to the user wallet.",
      confirmLabel: "Mark as Failed",
      tone: "danger",
      reasonLabel: "Failure reason / note",
      reasonPlaceholder: "e.g. Issuer card transaction declined or reversed",
      reasonRequired: true,
    });
    if (ok) {
      const note = getLastConfirmReason() || "Marked failed by ops";
      failMutation.mutate({ id: item.id, note });
    }
  };

  const exportMovements = async () => {
    try {
      const result = await apiGet<CursorPage<CardMovement>>(
        "/admin/cards/movements",
        { status: status || undefined, limit: 100 },
        { purpose: "export" },
      );
      const rows = result.items ?? [];
      downloadCsv("card-movements", rows, [
        { label: "Reference", value: (row) => row.reference },
        { label: "Customer", value: (row) => row.userName },
        { label: "User ID", value: (row) => row.userId },
        { label: "Card ID", value: (row) => row.cardId },
        { label: "Card Last 4", value: (row) => row.last4 ?? "" },
        { label: "Direction", value: (row) => row.direction },
        { label: "Status", value: (row) => row.status },
        {
          label: "Amount (USD)",
          value: (row) => (row.amountUsd / 100).toFixed(2),
        },
        {
          label: "Amount (NGN)",
          value: (row) => (row.amount / 100).toFixed(2),
        },
        { label: "Resolution Note", value: (row) => row.resolutionNote ?? "" },
        { label: "Resolved By", value: (row) => row.resolvedBy ?? "" },
        { label: "Created At", value: (row) => row.createdAt },
        { label: "Completed At", value: (row) => row.completedAt ?? "" },
      ]);
      trackExport({
        resource: "card_movements",
        rows: rows.length,
        filters: { status: status || "ALL" },
      });
      toast.success("Card movements exported");
    } catch {
      toast.error("Failed to export card movements");
    }
  };

  const allMovements =
    movementsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedMovement = detailQuery.data;

  const isActionPending = completeMutation.isPending || failMutation.isPending;

  const columns: Column<CardMovement>[] = [
    {
      id: "reference",
      header: "Reference",
      mobile: "primary",
      cell: (mov) => (
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ui-ink">
            <span>{mov.reference}</span>
            <CopyButton
              value={mov.reference}
              toastMessage="Reference copied"
              onClick={() =>
                trackAction("movement_reference_copy", { id: mov.id })
              }
            />
          </div>
          <span className="text-[11px] text-ui-muted">
            Card {mov.last4 ? `•••• ${mov.last4}` : mov.cardId.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      mobile: "primary",
      cell: (mov) => (
        <div className="flex items-center gap-2">
          <BubbleAvatar seed={mov.userName} size={30} />
          <div>
            <Link
              href={`/users?user=${encodeURIComponent(mov.userId)}`}
              className="font-medium text-ui-ink hover:text-ui-accent hover:underline line-clamp-1 text-xs"
            >
              {mov.userName}
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "direction",
      header: "Direction",
      mobile: "secondary",
      cell: (mov) => {
        const isFund = mov.direction.toUpperCase() === "FUND";
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
              isFund
                ? "bg-ui-success-soft text-ui-success"
                : "bg-blue-50 text-ui-accent"
            }`}
          >
            {isFund ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
            <span>{mov.direction}</span>
          </span>
        );
      },
    },
    {
      id: "amounts",
      header: "Amounts (USD / NGN)",
      mobile: "secondary",
      cell: (mov) => (
        <div>
          <span className="font-semibold text-ui-ink">
            {formatUsd(mov.amountUsd)}
          </span>
          <span className="block text-[11px] text-ui-muted">
            ₦{formatNaira(mov.amount / 100)}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (mov) => <StatusChip status={mov.status} />,
    },
    {
      id: "created",
      header: "Created",
      mobile: "hidden",
      cell: (mov) => (
        <span className="text-xs text-ui-muted">
          {formatRelative(mov.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      mobile: "primary",
      className: "text-right",
      cell: (mov) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => openDetail(mov)}
          >
            Details
          </button>
          {isOpsRole &&
            (mov.status === "UNKNOWN" || mov.status === "PENDING") && (
              <>
                <button
                  type="button"
                  className="ui-btn ui-btn-sm ui-btn-primary"
                  onClick={() => void handleMarkCompleted(mov)}
                  disabled={isActionPending}
                  title="Mark completed (moves money)"
                >
                  Complete
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-sm ui-btn-danger"
                  onClick={() => void handleMarkFailed(mov)}
                  disabled={isActionPending}
                  title="Mark failed (moves money)"
                >
                  Fail
                </button>
              </>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Card Movements Queue"
        crumb="Virtual Cards"
        subtitle="Funding and withdrawal settlements between Naira wallets and USD cards"
        icon={CreditCard}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Last refreshed timer */}
          <div className="flex items-center gap-1 text-xs text-ui-muted mr-1">
            <Clock size={13} />
            <span>Updated {secondsAgo}s ago</span>
          </div>

          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void movementsQuery.refetch()}
            disabled={movementsQuery.isFetching}
            aria-label="Refresh movements queue"
          >
            <RefreshCw
              size={13}
              className={movementsQuery.isFetching ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {movementsQuery.isFetching ? "Refreshing…" : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void exportMovements()}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </PageHeader>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatus("UNKNOWN")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "UNKNOWN" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Needs Action</span>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {tally.unknown}
          </p>
          <p className="text-[11px] text-ui-muted">Unknown settlement status</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus("PENDING")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "PENDING" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Pending Float</span>
            <Clock size={14} className="text-ui-accent" />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {tally.pending}
          </p>
          <p className="text-[11px] text-ui-muted">Awaiting confirmation</p>
        </button>

        <div className="ui-card">
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>Float on Hold</span>
            <span className="text-xs font-semibold text-ui-accent">USD</span>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {formatUsd(tally.unknownUsdCents)}
          </p>
          <p className="text-[11px] text-ui-muted">Pending settlement value</p>
        </div>

        <button
          type="button"
          onClick={() => setStatus("")}
          className={`ui-card text-left transition-colors hover:border-ui-accent ${
            status === "" ? "border-ui-accent bg-ui-accent-soft/30" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-ui-muted">
            <span>All Movements</span>
            <CreditCard size={14} />
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
            {tally.all}
          </p>
          <p className="text-[11px] text-ui-muted">Historical movements</p>
        </button>
      </div>

      {/* Main Table Section */}
      <section className="ui-panel">
        <div className="ui-panel-head">
          <div className="flex items-center gap-3">
            <h2 className="ui-panel-title">Movements Queue</h2>
            <span className="text-xs text-ui-muted">
              {allMovements.length} record{allMovements.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex ui-tabs" role="tablist">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                className={`ui-tab ${status === tab.value ? "ui-tab-active" : ""}`}
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            className="ui-btn ui-btn-sm md:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter size={14} />
            <span>Status: {status || "All"}</span>
          </button>
        </div>

        <div className="ui-panel-body">
          <DataTable
            data={allMovements}
            columns={columns}
            keyExtractor={(mov) => mov.id}
            loading={movementsQuery.isLoading}
            onRowClick={(mov) => openDetail(mov)}
            hasMore={Boolean(movementsQuery.hasNextPage)}
            isLoadingMore={movementsQuery.isFetchingNextPage}
            onLoadMore={() => void movementsQuery.fetchNextPage()}
            emptyState={
              <EmptyState
                icon={CreditCard}
                title="No card movements found"
                message={
                  status
                    ? `There are no movements with status "${status}".`
                    : "No card funding or withdrawal movements recorded."
                }
              />
            }
          />
        </div>
      </section>

      {/* Mobile Filters Bottom Sheet */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter Movements"
        className="md:hidden"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Filter by Status</h2>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body space-y-2 p-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium ${
                status === tab.value
                  ? "border-ui-accent bg-ui-accent-soft text-ui-accent"
                  : "border-ui-line text-ui-ink hover:bg-ui-sunken"
              }`}
              onClick={() => {
                setStatus(tab.value);
                setMobileFiltersOpen(false);
              }}
            >
              <span>{tab.label}</span>
              {status === tab.value && (
                <span className="text-xs font-semibold">Active</span>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Movement Detail Drawer / Modal */}
      <Modal
        open={Boolean(movementId)}
        onClose={closeDetail}
        title={
          selectedMovement
            ? `Movement ${selectedMovement.reference}`
            : "Movement Details"
        }
        className="max-h-[92dvh] overflow-y-auto sm:max-w-xl"
      >
        <div className="ui-modal-head border-b border-ui-line bg-ui-rail">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-ui-accent" />
            <h2 className="ui-modal-title">Card Movement Details</h2>
          </div>
          <button
            type="button"
            className="ui-icon-btn"
            onClick={closeDetail}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="ui-modal-body space-y-5 p-5">
          {detailQuery.isLoading ? (
            <div className="py-12 text-center text-sm text-ui-muted">
              Loading movement details…
            </div>
          ) : selectedMovement ? (
            <>
              {/* Header card */}
              <div className="rounded-xl border border-ui-line bg-ui-sunken/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-ui-ink">
                    <span>{selectedMovement.reference}</span>
                    <CopyButton
                      value={selectedMovement.reference}
                      toastMessage="Reference copied"
                    />
                  </div>
                  <StatusChip status={selectedMovement.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ui-line/60 pt-3">
                  <div>
                    <span className="text-xs text-ui-muted">Direction</span>
                    <span className="block text-sm font-semibold text-ui-ink">
                      {selectedMovement.direction}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-ui-muted">Amount</span>
                    <span className="block text-base font-bold text-ui-ink">
                      {formatUsd(selectedMovement.amountUsd)}{" "}
                      <span className="text-xs font-normal text-ui-muted">
                        (₦{formatNaira(selectedMovement.amount / 100)})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
                  Customer & Card
                </h3>
                <div className="rounded-lg border border-ui-line p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <BubbleAvatar
                        seed={selectedMovement.userName}
                        size={32}
                      />
                      <div>
                        <p className="text-sm font-medium text-ui-ink">
                          {selectedMovement.userName}
                        </p>
                        <p className="font-mono text-[11px] text-ui-muted">
                          ID: {selectedMovement.userId}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/users?user=${encodeURIComponent(selectedMovement.userId)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ui-accent hover:underline"
                    >
                      <User size={13} />
                      <span>Profile</span>
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>

                  <div className="border-t border-ui-line pt-2.5 flex items-center justify-between text-xs">
                    <span className="text-ui-muted">Virtual Card</span>
                    <span className="font-mono font-medium text-ui-ink">
                      {selectedMovement.last4
                        ? `•••• •••• •••• ${selectedMovement.last4}`
                        : selectedMovement.cardId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Info (if completed or failed) */}
              {(selectedMovement.resolutionNote ||
                selectedMovement.resolvedBy) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
                    Resolution Audit
                  </h3>
                  <div className="rounded-lg border border-ui-line bg-ui-sunken/40 p-3.5 space-y-2 text-xs">
                    {selectedMovement.resolutionNote && (
                      <div>
                        <span className="text-ui-muted">Note:</span>
                        <p className="mt-0.5 font-medium text-ui-ink">
                          {selectedMovement.resolutionNote}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ui-line pt-2 text-ui-muted">
                      <span>
                        Resolved by: {selectedMovement.resolvedBy || "System"}
                      </span>
                      {selectedMovement.completedAt && (
                        <span>
                          {formatDateTime(selectedMovement.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons with warning banner */}
              {isOpsRole &&
                (selectedMovement.status === "UNKNOWN" ||
                  selectedMovement.status === "PENDING") && (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <p className="font-medium">
                        Financial settlement warning:
                      </p>
                      <p className="mt-0.5 text-amber-700">
                        Resolving this movement executes money movements across
                        user wallets and the card issuer reserve float. Verify
                        provider settlement logs before proceeding.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary flex-1"
                        onClick={() =>
                          void handleMarkCompleted(selectedMovement)
                        }
                        disabled={isActionPending}
                      >
                        <CheckCircle2 size={15} />
                        <span>
                          {completeMutation.isPending
                            ? "Completing…"
                            : "Mark Completed"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-danger flex-1"
                        onClick={() => void handleMarkFailed(selectedMovement)}
                        disabled={isActionPending}
                      >
                        <XCircle size={15} />
                        <span>
                          {failMutation.isPending ? "Failing…" : "Mark Failed"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-ui-muted">
              Movement not found.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <CardsContent />
    </Suspense>
  );
}
