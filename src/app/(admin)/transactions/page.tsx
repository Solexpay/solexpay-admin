"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  CircleAlert,
  CreditCard,
  Download,
  Eye,
  Landmark,
  Receipt,
  Search,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useState, useTransition } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  getDashboardMetrics,
  getTransaction,
  getTransactions,
} from "@/lib/api/admin";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime, formatNaira } from "@/lib/format";
import { apiGet } from "@/lib/http";
import { trackAction, trackExport } from "@/lib/telemetry";
import type { CursorPage, Transaction, TransactionDetail } from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

function dayStart(date: string): string | undefined {
  return date ? `${date}T00:00:00+01:00` : undefined;
}

function dayEnd(date: string): string | undefined {
  return date ? `${date}T23:59:59.999+01:00` : undefined;
}

function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "WALLET_FUNDING":
      return <ArrowDownLeft size={14} className="text-ui-accent" />;
    case "LOAN_DISBURSEMENT":
      return <Banknote size={14} className="text-ui-success" />;
    case "NIP_TRANSFER":
      return <Send size={14} className="text-ui-body" />;
    case "LOAN_REPAYMENT":
      return <Landmark size={14} className="text-ui-accent" />;
    case "BILL_PAYMENT":
      return <Receipt size={14} className="text-ui-muted" />;
    default:
      return <CreditCard size={14} className="text-ui-muted" />;
  }
}

interface TransactionRow extends Transaction {
  userId?: string;
}

function TransactionsContent() {
  const [reference, setReference] = useQueryState(
    "reference",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [type, setType] = useQueryState(
    "type",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [from, setFrom] = useQueryState(
    "from",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [to, setTo] = useQueryState(
    "to",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [txId, setTxId] = useQueryState(
    "tx",
    parseAsString.withDefault("").withOptions(queryOptions),
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();

  const metricsQuery = useQuery({
    queryKey: ["admin", "dashboard", "metrics"],
    queryFn: () => getDashboardMetrics(),
  });

  const queryParams = {
    limit: 20,
    status: status || undefined,
    type: type || undefined,
    reference: reference || undefined,
    from: dayStart(from),
    to: dayEnd(to),
  };

  const transactionsQuery = useInfiniteQuery<CursorPage<Transaction>>({
    queryKey: ["admin", "transactions", { status, type, reference, from, to }],
    queryFn: ({ pageParam }) =>
      getTransactions({
        ...queryParams,
        cursor: (pageParam as string | undefined) || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

  const detailQuery = useQuery<TransactionDetail>({
    queryKey: ["admin", "transaction", txId],
    queryFn: () => getTransaction(txId),
    enabled: Boolean(txId),
  });

  const allTransactions: TransactionRow[] =
    transactionsQuery.data?.pages.flatMap(
      (page) => page.items as TransactionRow[],
    ) ?? [];

  const openDetail = (tx: TransactionRow) => {
    trackAction("transaction_detail_open", { id: tx.id });
    void setTxId(tx.id);
  };

  const closeDetail = () => {
    void setTxId("");
  };

  const clearFilters = () => {
    startTransition(() => {
      void setReference("");
      void setType("");
      void setStatus("");
      void setFrom("");
      void setTo("");
    });
  };

  const hasActiveFilters = Boolean(reference || type || status || from || to);

  const exportRows = async () => {
    try {
      const result = await apiGet<CursorPage<Transaction>>(
        "/admin/transactions",
        {
          limit: 100,
          status: status || undefined,
          type: type || undefined,
          reference: reference || undefined,
          from: dayStart(from),
          to: dayEnd(to),
        },
        { purpose: "export" },
      );
      const rows = result.items ?? [];
      downloadCsv("transactions", rows, [
        { label: "Reference", value: (tx) => tx.reference },
        { label: "Type", value: (tx) => tx.type },
        { label: "Sender", value: (tx) => tx.senderName },
        { label: "Recipient", value: (tx) => tx.recipientName },
        { label: "Amount", value: (tx) => tx.amount },
        { label: "Status", value: (tx) => tx.status },
        { label: "Created", value: (tx) => tx.createdAt },
      ]);
      trackExport({
        resource: "transactions",
        rows: rows.length,
        filters: {
          reference: Boolean(reference),
          type,
          status,
          from: Boolean(from),
          to: Boolean(to),
        },
      });
      toast.success("Transactions exported");
    } catch {
      toast.error("Failed to export transactions");
    }
  };

  const columns: Column<TransactionRow>[] = [
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
          <p className="truncate text-xs text-ui-muted" title={tx.description}>
            {tx.description}
          </p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      mobile: "secondary",
      cell: (tx) => (
        <div className="flex items-center gap-2">
          <span className="ui-icon-tile">
            <TypeIcon type={tx.type} />
          </span>
          <span className="whitespace-nowrap text-sm text-ui-ink">
            {formatType(tx.type)}
          </span>
        </div>
      ),
    },
    {
      id: "parties",
      header: "From / To",
      mobile: "secondary",
      cell: (tx) => (
        <div className="flex items-center gap-2.5">
          <BubbleAvatar seed={tx.senderName || "?"} size={32} />
          <div className="min-w-0 max-w-[170px]">
            {tx.userId ? (
              <Link
                href={`/users?user=${encodeURIComponent(tx.userId)}`}
                className="block truncate font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={tx.senderName}
                onClick={(e) => e.stopPropagation()}
              >
                {tx.senderName}
              </Link>
            ) : (
              <p
                className="truncate font-medium text-ui-ink"
                title={tx.senderName}
              >
                {tx.senderName}
              </p>
            )}
            <p
              className="truncate text-xs text-ui-muted"
              title={tx.recipientName}
            >
              → {tx.recipientName}
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
      id: "status",
      header: "Status",
      mobile: "primary",
      cell: (tx) => <StatusChip status={tx.status} />,
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
        title="Transaction Ledger"
        icon={ArrowLeftRight}
        subtitle="View and search all system transactions"
      >
        <button
          type="button"
          className="ui-btn"
          onClick={() => void exportRows()}
          title="Exports the transactions matching filters"
        >
          <Download size={15} />
          Export CSV
        </button>
      </PageHeader>

      <div className="space-y-4">
        {/* Today's Metrics */}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Today</h2>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {metricsQuery.isPending ? (
              [1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border border-ui-line bg-white p-1.5"
                >
                  <div className="ui-skel mx-1.5 mb-3 mt-1.5 h-3 w-20" />
                  <div className="ui-skel h-[68px] rounded-lg" />
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  label="Volume today"
                  icon={Banknote}
                  prefix="₦"
                  value={metricsQuery.data?.transactionVolumeToday ?? 0}
                />
                <MetricCard
                  label="Transactions today"
                  icon={ArrowLeftRight}
                  value={metricsQuery.data?.transactionCountToday ?? 0}
                />
              </>
            )}
          </div>
        </section>

        {/* Transactions Panel */}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Transactions</h2>

            <button
              type="button"
              className="ui-btn ui-btn-sm md:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-1 h-2 w-2 rounded-full bg-ui-accent" />
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden w-full flex-col gap-2 md:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <div className="ui-search sm:w-64">
                <Search size={15} />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => void setReference(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") void setReference("");
                  }}
                  className="ui-input"
                  placeholder="Search by reference…"
                />
                {reference && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="ui-icon-btn absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => void setReference("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                aria-label="Filter by type"
                value={type}
                onChange={(e) => void setType(e.target.value)}
                className="ui-input sm:w-auto"
              >
                <option value="">All Types</option>
                <option value="WALLET_FUNDING">Wallet Funding</option>
                <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                <option value="NIP_TRANSFER">Bank Transfer</option>
                <option value="LOAN_REPAYMENT">Loan Repayment</option>
                <option value="BILL_PAYMENT">Bill Payment</option>
              </select>

              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => void setStatus(e.target.value)}
                className="ui-input sm:w-auto"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <input
                type="date"
                value={from}
                onChange={(e) => void setFrom(e.target.value)}
                className="ui-input sm:w-auto"
                aria-label="From date"
                max={to || undefined}
              />
              <input
                type="date"
                value={to}
                onChange={(e) => void setTo(e.target.value)}
                className="ui-input sm:w-auto"
                aria-label="To date"
                min={from || undefined}
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  className="ui-btn ui-btn-sm"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {transactionsQuery.isError && (
            <div className="ui-alert ui-alert-danger m-4">
              <CircleAlert size={16} />
              <div className="flex-1">Couldn&apos;t load transactions.</div>
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => void transactionsQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={allTransactions}
              columns={columns}
              keyExtractor={(tx) => tx.id}
              loading={transactionsQuery.isPending}
              onRowClick={openDetail}
              hasMore={Boolean(transactionsQuery.hasNextPage)}
              isLoadingMore={transactionsQuery.isFetchingNextPage}
              onLoadMore={() => void transactionsQuery.fetchNextPage()}
              totalText={`${allTransactions.length} shown${transactionsQuery.hasNextPage ? " · more available" : ""}`}
              rowActions={(tx) => (
                <button
                  type="button"
                  className="ui-icon-btn"
                  onClick={() => openDetail(tx)}
                  aria-label="View transaction"
                  title="View transaction"
                >
                  <Eye size={16} />
                </button>
              )}
              emptyState={
                <EmptyState
                  message="No transactions found"
                  action={
                    hasActiveFilters
                      ? {
                          label: "Clear filters",
                          onClick: clearFilters,
                        }
                      : undefined
                  }
                />
              }
            />
          </div>
        </section>
      </div>

      {/* Mobile Filters Modal */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter Transactions"
        className="max-h-[90dvh] overflow-y-auto md:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Filter Transactions</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body space-y-3">
          <label className="ui-label">
            Reference
            <input
              type="text"
              className="ui-input mt-1"
              value={reference}
              onChange={(e) => void setReference(e.target.value)}
              placeholder="Search reference…"
            />
          </label>
          <label className="ui-label">
            Type
            <select
              className="ui-input mt-1"
              value={type}
              onChange={(e) => void setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="WALLET_FUNDING">Wallet Funding</option>
              <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
              <option value="NIP_TRANSFER">Bank Transfer</option>
              <option value="LOAN_REPAYMENT">Loan Repayment</option>
              <option value="BILL_PAYMENT">Bill Payment</option>
            </select>
          </label>
          <label className="ui-label">
            Status
            <select
              className="ui-input mt-1"
              value={status}
              onChange={(e) => void setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
          <label className="ui-label">
            From date
            <input
              type="date"
              className="ui-input mt-1"
              value={from}
              onChange={(e) => void setFrom(e.target.value)}
              max={to || undefined}
            />
          </label>
          <label className="ui-label">
            To date
            <input
              type="date"
              className="ui-input mt-1"
              value={to}
              onChange={(e) => void setTo(e.target.value)}
              min={from || undefined}
            />
          </label>
        </div>
        <div className="ui-modal-foot flex-col gap-2 sm:flex-row">
          {hasActiveFilters && (
            <button
              type="button"
              className="ui-btn w-full sm:w-auto"
              onClick={() => {
                clearFilters();
                setMobileFiltersOpen(false);
              }}
            >
              Clear filters
            </button>
          )}
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            onClick={() => setMobileFiltersOpen(false)}
          >
            Apply filters
          </button>
        </div>
      </Modal>

      {/* Transaction Detail Drawer/Modal */}
      <TransactionDrawer
        open={Boolean(txId)}
        onClose={closeDetail}
        detail={detailQuery.data}
        loading={detailQuery.isPending}
        error={detailQuery.isError}
        retry={() => void detailQuery.refetch()}
      />
    </>
  );
}

function TransactionDrawer({
  open,
  onClose,
  detail,
  loading,
  error,
  retry,
}: {
  open: boolean;
  onClose: () => void;
  detail?: TransactionDetail;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const tx = detail?.transaction as TransactionRow | undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Transaction Details"
      className="max-h-[92dvh] overflow-y-auto md:max-w-2xl"
    >
      <div className="ui-modal-head">
        <h2 className="ui-modal-title">Transaction Details</h2>
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
            <div className="ui-skel h-20 w-full" />
            <div className="ui-skel h-4 w-40" />
          </div>
        )}

        {error && (
          <EmptyState
            title="Couldn't load transaction details"
            message="Please try again."
            action={{ label: "Try again", onClick: retry }}
          />
        )}

        {tx && (
          <div className="space-y-5">
            <dl className="ui-dl">
              <div className="min-w-0">
                <dt className="ui-dt">Reference</dt>
                <dd className="ui-dd flex items-center gap-1.5 font-mono text-[13px]">
                  <span className="truncate">{tx.reference}</span>
                  <CopyButton
                    value={tx.reference}
                    onClick={() =>
                      trackAction("transaction_reference_copy", { id: tx.id })
                    }
                    aria-label="Copy reference"
                  />
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Status</dt>
                <dd className="ui-dd">
                  <StatusChip status={tx.status} />
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Type</dt>
                <dd className="ui-dd flex items-center gap-2">
                  <TypeIcon type={tx.type} />
                  <span>{formatType(tx.type)}</span>
                </dd>
              </div>

              <div>
                <dt className="ui-dt">Amount</dt>
                <dd className="ui-dd font-medium tabular-nums text-ui-ink">
                  ₦{formatNaira(tx.amount)}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="ui-dt">Sender → Recipient</dt>
                <dd className="ui-dd flex items-center gap-2">
                  {tx.userId ? (
                    <Link
                      href={`/users?user=${encodeURIComponent(tx.userId)}`}
                      className="font-medium text-ui-ink hover:text-ui-accent hover:underline"
                    >
                      {tx.senderName}
                    </Link>
                  ) : (
                    <span>{tx.senderName}</span>
                  )}
                  <span className="text-ui-muted">→</span>
                  <span>{tx.recipientName}</span>
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="ui-dt">Description</dt>
                <dd className="ui-dd">{tx.description || "—"}</dd>
              </div>

              <div>
                <dt className="ui-dt">Created</dt>
                <dd className="ui-dd">{formatDateTime(tx.createdAt)}</dd>
              </div>
            </dl>

            {/* Ledger Entries / Journals */}
            <section>
              <h3 className="mb-2 text-[13px] font-semibold text-ui-ink">
                Ledger entries
              </h3>
              {(detail?.journals ?? []).length === 0 ? (
                <p className="text-sm text-ui-muted">
                  No ledger entries on record.
                </p>
              ) : (
                (detail?.journals ?? []).map((journal) => (
                  <div
                    key={journal.id}
                    className="mb-3 rounded-xl border border-ui-line overflow-hidden"
                  >
                    <div className="border-b border-ui-line bg-ui-sunken px-3 py-2">
                      <p className="text-sm font-medium text-ui-ink">
                        {journal.kind}
                      </p>
                      {journal.memo && (
                        <p className="text-xs text-ui-muted">{journal.memo}</p>
                      )}
                    </div>
                    <div className="ui-table-wrap">
                      <table className="ui-table">
                        <thead>
                          <tr>
                            <th>Account code</th>
                            <th>Side</th>
                            <th>Amount</th>
                            <th>Balance after</th>
                          </tr>
                        </thead>
                        <tbody>
                          {journal.lines.map((line) => (
                            <tr key={line.id}>
                              <td className="font-mono text-xs">
                                {line.accountCode}
                              </td>
                              <td>
                                <span
                                  className={`ui-badge ${line.side === "DEBIT" ? "ui-badge-info" : "ui-badge-success"}`}
                                >
                                  {line.side}
                                </span>
                              </td>
                              <td className="tabular-nums font-medium">
                                ₦{formatNaira(line.amount)}
                              </td>
                              <td className="tabular-nums text-ui-muted">
                                {line.balanceAfter != null
                                  ? `₦${formatNaira(line.balanceAfter)}`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
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

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <TransactionsContent />
    </Suspense>
  );
}
