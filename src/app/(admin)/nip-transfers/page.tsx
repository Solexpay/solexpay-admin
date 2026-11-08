"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CircleAlert, Eye, Landmark, Send, X } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getNipTransfer, getNipTransfers } from "@/lib/api/admin";
import { formatDateTime, formatNaira, maskAccountNumber } from "@/lib/format";
import { trackAction } from "@/lib/telemetry";
import type { CursorPage, NipTransfer } from "@/lib/types";

const queryOptions = { history: "replace" as const, shallow: true };

const STATUS_TABS = [
  { label: "All Transfers", value: "" },
  { label: "Success", value: "SUCCESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
];

function NipTransfersContent() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [transferId, setTransferId] = useQueryState(
    "transfer",
    parseAsString.withDefault("").withOptions(queryOptions),
  );

  const transfersQuery = useInfiniteQuery<CursorPage<NipTransfer>>({
    queryKey: ["admin", "nip-transfers", { status }],
    queryFn: ({ pageParam }) =>
      getNipTransfers({
        status: status || undefined,
        limit: 20,
        cursor: (pageParam as string | undefined) || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

  const detailQuery = useQuery<NipTransfer>({
    queryKey: ["admin", "nip-transfer", transferId],
    queryFn: () => getNipTransfer(transferId),
    enabled: Boolean(transferId),
  });

  const allTransfers =
    transfersQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const openDetail = (tx: NipTransfer) => {
    trackAction("nip_transfer_detail_open", { id: tx.id });
    void setTransferId(tx.id);
  };

  const closeDetail = () => {
    void setTransferId("");
  };

  const columns: Column<NipTransfer>[] = [
    {
      id: "reference",
      header: "Reference",
      mobile: "primary",
      cell: (tx) => (
        <div className="min-w-0 max-w-[200px]">
          <button
            type="button"
            className="truncate text-left font-mono text-[13px] font-medium text-ui-ink hover:text-ui-accent hover:underline"
            title={tx.reference}
            onClick={() => openDetail(tx)}
          >
            {tx.reference}
          </button>
          {tx.anchorTransferId && (
            <p
              className="truncate font-mono text-xs text-ui-muted"
              title={tx.anchorTransferId}
            >
              Anchor: {tx.anchorTransferId}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "beneficiary",
      header: "Beneficiary",
      mobile: "secondary",
      cell: (tx) => (
        <div className="min-w-0 max-w-[180px]">
          <p
            className="truncate font-medium text-ui-ink"
            title={tx.accountName}
          >
            {tx.accountName}
          </p>
          <p
            className="truncate text-xs text-ui-muted"
            title={`${tx.accountNumber} · ${tx.bankName}`}
          >
            {maskAccountNumber(tx.accountNumber)} · {tx.bankName}
          </p>
        </div>
      ),
    },
    {
      id: "sender",
      header: "Sender",
      mobile: "secondary",
      cell: (tx) => (
        <div className="flex items-center gap-2.5">
          <BubbleAvatar seed={tx.userName || "?"} size={32} />
          <div className="min-w-0 max-w-[170px]">
            {tx.userId ? (
              <Link
                href={`/users?user=${encodeURIComponent(tx.userId)}`}
                className="block truncate font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={tx.userName}
                onClick={(e) => e.stopPropagation()}
              >
                {tx.userName}
              </Link>
            ) : (
              <p
                className="truncate font-medium text-ui-ink"
                title={tx.userName}
              >
                {tx.userName}
              </p>
            )}
            <p
              className="truncate font-mono text-xs text-ui-muted"
              title={tx.userId}
            >
              {tx.userId}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      mobile: "primary",
      cell: (tx) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-ui-ink">
          ₦{formatNaira(tx.amount)}
        </span>
      ),
    },
    {
      id: "fee",
      header: "Fee",
      mobile: "hidden",
      cell: (tx) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-ui-muted">
          ₦{formatNaira(tx.fee)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "primary",
      cell: (tx) => (
        <div className="flex items-center gap-1.5">
          <StatusChip status={tx.status} />
          {tx.stuckAlertedAt && (
            <span
              className="ui-badge ui-badge-warning"
              title={`Stuck alert sent ${formatDateTime(tx.stuckAlertedAt)}`}
            >
              Stuck
            </span>
          )}
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      mobile: "hidden",
      cell: (tx) => (
        <span className="whitespace-nowrap text-xs text-ui-muted">
          {formatDateTime(tx.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="NIP Transfers"
        icon={Landmark}
        subtitle="Read-only ledger of NIP inter-bank transfers and settlement responses"
      />

      <div className="space-y-4">
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">All transfers</h2>
            <div className="ui-tabs overflow-x-auto" role="tablist">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`ui-tab ${status === tab.value ? "ui-tab-active" : ""}`}
                  role="tab"
                  aria-selected={status === tab.value}
                  onClick={() => void setStatus(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {transfersQuery.isError && (
            <div className="ui-alert ui-alert-danger m-4">
              <CircleAlert size={16} />
              <div className="flex-1">Couldn&apos;t load NIP transfers.</div>
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => void transfersQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={allTransfers}
              columns={columns}
              keyExtractor={(tx) => tx.id}
              loading={transfersQuery.isPending}
              onRowClick={openDetail}
              hasMore={Boolean(transfersQuery.hasNextPage)}
              isLoadingMore={transfersQuery.isFetchingNextPage}
              onLoadMore={() => void transfersQuery.fetchNextPage()}
              totalText={`${allTransfers.length} shown${transfersQuery.hasNextPage ? " · more available" : ""}`}
              rowActions={(tx) => (
                <button
                  type="button"
                  className="ui-icon-btn"
                  onClick={() => openDetail(tx)}
                  aria-label="View Full NIP Details"
                  title="View Full NIP Details"
                >
                  <Eye size={16} />
                </button>
              )}
              emptyState={
                <EmptyState
                  icon={Send}
                  message="No NIP transfers found"
                  action={
                    status
                      ? {
                          label: "Show all transfers",
                          onClick: () => void setStatus(""),
                        }
                      : undefined
                  }
                />
              }
            />
          </div>
        </section>
      </div>

      {/* Transfer Detail Drawer/Modal */}
      <NipTransferDrawer
        open={Boolean(transferId)}
        onClose={closeDetail}
        transfer={detailQuery.data}
        loading={detailQuery.isPending}
        error={detailQuery.isError}
        retry={() => void detailQuery.refetch()}
      />
    </>
  );
}

function NipTransferDrawer({
  open,
  onClose,
  transfer,
  loading,
  error,
  retry,
}: {
  open: boolean;
  onClose: () => void;
  transfer?: NipTransfer;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="NIP Transfer Details"
      className="max-h-[92dvh] overflow-y-auto md:max-w-xl"
    >
      <div className="ui-modal-head">
        <h2 className="ui-modal-title">NIP Transfer Details</h2>
        <button
          type="button"
          className="ui-icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="ui-modal-body">
        {loading && (
          <div className="space-y-3 py-4">
            <div className="ui-skel h-4 w-48" />
            <div className="ui-skel h-4 w-32" />
            <div className="ui-skel h-24 w-full" />
            <div className="ui-skel h-4 w-40" />
          </div>
        )}

        {error && (
          <EmptyState
            title="Couldn't load transfer details"
            message="Please try again."
            action={{ label: "Try again", onClick: retry }}
          />
        )}

        {transfer && (
          <dl className="ui-dl">
            <div>
              <dt className="ui-dt">Reference</dt>
              <dd className="ui-dd flex items-center gap-1.5 font-mono text-[13px]">
                <span className="truncate">{transfer.reference}</span>
                <CopyButton
                  value={transfer.reference}
                  onClick={() =>
                    trackAction("nip_reference_copy", { id: transfer.id })
                  }
                  aria-label="Copy reference"
                />
              </dd>
            </div>

            {transfer.anchorTransferId && (
              <div>
                <dt className="ui-dt">Anchor transfer ID</dt>
                <dd className="ui-dd flex items-center gap-1.5 font-mono text-[13px]">
                  <span className="truncate">{transfer.anchorTransferId}</span>
                  <CopyButton
                    value={transfer.anchorTransferId}
                    aria-label="Copy anchor transfer id"
                  />
                </dd>
              </div>
            )}

            <div>
              <dt className="ui-dt">Status</dt>
              <dd className="ui-dd">
                <StatusChip status={transfer.status} />
              </dd>
            </div>

            <div>
              <dt className="ui-dt">Amount</dt>
              <dd className="ui-dd font-medium tabular-nums text-ui-ink">
                ₦{formatNaira(transfer.amount)}
              </dd>
            </div>

            <div>
              <dt className="ui-dt">Fee</dt>
              <dd className="ui-dd font-medium tabular-nums text-ui-ink">
                ₦{formatNaira(transfer.fee)}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="ui-dt">Beneficiary Details</dt>
              <dd className="ui-dd font-medium text-ui-ink">
                {transfer.accountName}
              </dd>
              <dd className="mt-0.5 flex items-center gap-1.5 text-xs text-ui-muted">
                <span>
                  Account: {transfer.accountNumber} · {transfer.bankName}
                </span>
                <CopyButton
                  value={transfer.accountNumber}
                  onClick={() =>
                    trackAction("beneficiary_account_copy", { id: transfer.id })
                  }
                  aria-label="Copy beneficiary account number"
                />
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="ui-dt">Sender Details</dt>
              <dd className="ui-dd font-medium text-ui-ink">
                {transfer.userId ? (
                  <Link
                    href={`/users?user=${encodeURIComponent(transfer.userId)}`}
                    className="hover:text-ui-accent hover:underline"
                  >
                    {transfer.userName}
                  </Link>
                ) : (
                  transfer.userName
                )}
              </dd>
              <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ui-muted">
                <span>User ID: {transfer.userId}</span>
                <CopyButton
                  value={transfer.userId}
                  aria-label="Copy sender user ID"
                />
              </dd>
            </div>

            {transfer.failureReason && (
              <div className="sm:col-span-2">
                <dt className="ui-dt">Failure reason</dt>
                <dd className="mt-1 rounded-lg border border-red-200 bg-ui-danger-soft p-2.5 text-[13px] text-ui-danger">
                  {transfer.failureReason}
                </dd>
              </div>
            )}

            {transfer.stuckAlertedAt && (
              <div>
                <dt className="ui-dt">Stuck alert sent</dt>
                <dd className="ui-dd text-xs text-ui-warning">
                  {formatDateTime(transfer.stuckAlertedAt)}
                </dd>
              </div>
            )}

            <div>
              <dt className="ui-dt">Timestamp</dt>
              <dd className="ui-dd text-xs text-ui-muted">
                {formatDateTime(transfer.createdAt)}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="ui-modal-foot">
        <button
          type="button"
          className="ui-btn w-full sm:w-auto"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function NipTransfersPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <NipTransfersContent />
    </Suspense>
  );
}
