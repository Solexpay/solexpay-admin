"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  CircleAlert,
  Clock,
  Eye,
  HandCoins,
  Landmark,
  RefreshCw,
  SearchX,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  approveLoan,
  getDashboardMetrics,
  getLoans,
  getOpsPendingLoans,
  getOverdueLoans,
  rejectLoan,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { trackAction } from "@/lib/telemetry";
import type { CursorPage, Loan } from "@/lib/types";
import { confirm, getLastConfirmReason } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

const TABS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Ops Review", value: "OPS_REVIEW" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Disbursed", value: "DISBURSED" },
] as const;

function LoansContent() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("ALL").withOptions(queryOptions),
  );
  const [loanId, setLoanId] = useQueryState(
    "loan",
    parseAsString.withDefault("").withOptions(queryOptions),
  );

  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const session = useAdminSession();
  const queryClient = useQueryClient();
  const isOpsRole =
    session.admin?.role === "OPS" || session.admin?.role === "SUPER_ADMIN";

  const isOpsPendingQueue = tab === "OPS_REVIEW";

  // Dashboard quick stats
  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard", "metrics"],
    queryFn: () => getDashboardMetrics(),
  });

  // Loans list query
  const loansQuery = useInfiniteQuery<CursorPage<Loan>>({
    queryKey: ["admin", "loans", { tab }],
    queryFn: async ({ pageParam }) => {
      const cursor = (pageParam as string | undefined) || undefined;
      if (tab === "OPS_REVIEW") {
        return getOpsPendingLoans({ limit: 20, cursor });
      }
      if (tab === "OVERDUE") {
        return getOverdueLoans({ limit: 20, cursor });
      }
      return getLoans({
        status: tab === "ALL" ? undefined : tab,
        limit: 20,
        cursor,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    refetchInterval: isOpsPendingQueue ? 30_000 : false,
  });

  // Track elapsed seconds since last fetch for queue view
  useEffect(() => {
    if (loansQuery.dataUpdatedAt) {
      setLastRefreshedAt(loansQuery.dataUpdatedAt);
      setSecondsAgo(0);
    }
  }, [loansQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!isOpsPendingQueue) return;
    const timer = setInterval(() => {
      setSecondsAgo(
        Math.max(0, Math.floor((Date.now() - lastRefreshedAt) / 1000)),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpsPendingQueue, lastRefreshedAt]);

  const allLoans = loansQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedLoan = allLoans.find((l) => l.id === loanId);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => approveLoan(id),
    onSuccess: (_, { name }) => {
      toast.success(`Loan approved for ${name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard", "metrics"],
      });
      void setLoanId("");
    },
    onError: () => toast.error("Failed to approve loan"),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
      name: string;
    }) => rejectLoan(id, reason),
    onSuccess: (_, { name }) => {
      toast.success(`Loan rejected for ${name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard", "metrics"],
      });
      void setLoanId("");
    },
    onError: () => toast.error("Failed to reject loan"),
  });

  const handleApprove = async (loan: Loan) => {
    const name = loan.userName || "the applicant";
    const amountStr = formatNaira(loan.amount);
    const ok = await confirm({
      title: `Approve ₦${amountStr} loan for ${name}?`,
      message: "It's disbursed after the 24-hour cooling-off period.",
      confirmLabel: "Approve",
      tone: "primary",
    });
    if (ok) {
      approveMutation.mutate({ id: loan.id, name });
    }
  };

  const handleReject = async (loan: Loan) => {
    const name = loan.userName || "the applicant";
    const ok = await confirm({
      title: `Reject loan for ${name}?`,
      message: "The applicant is notified with the reason you provide.",
      confirmLabel: "Reject",
      tone: "danger",
      reasonLabel: "Reason shown to the applicant",
      reasonPlaceholder:
        "e.g. Insufficient credit history or unsupported school",
    });
    if (ok) {
      const reason = getLastConfirmReason() || "Rejected by Ops";
      rejectMutation.mutate({ id: loan.id, reason, name });
    }
  };

  const openDetail = (loan: Loan) => {
    trackAction("loan_detail_open", { id: loan.id });
    void setLoanId(loan.id);
  };

  const closeDetail = () => {
    void setLoanId("");
  };

  const columns: Column<Loan>[] = [
    {
      id: "applicant",
      header: "Applicant",
      mobile: "primary",
      cell: (loan) => (
        <div className="flex items-center gap-2.5">
          <BubbleAvatar seed={loan.userName || "?"} size={32} />
          <div className="min-w-0 max-w-[170px]">
            {loan.userId ? (
              <Link
                href={`/users?user=${encodeURIComponent(loan.userId)}`}
                className="block truncate font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={loan.userName}
                onClick={(e) => e.stopPropagation()}
              >
                {loan.userName}
              </Link>
            ) : (
              <button
                type="button"
                className="truncate text-left font-medium text-ui-ink hover:text-ui-accent hover:underline"
                title={loan.userName}
                onClick={() => openDetail(loan)}
              >
                {loan.userName}
              </button>
            )}
            <p className="truncate text-xs text-ui-muted" title={loan.purpose}>
              {loan.purpose || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "school",
      header: "School",
      mobile: "secondary",
      cell: (loan) => (
        <p
          className="max-w-[150px] truncate text-sm text-ui-ink"
          title={loan.schoolName}
        >
          {loan.schoolName || "—"}
        </p>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      mobile: "primary",
      cell: (loan) => (
        <div className="whitespace-nowrap">
          <p className="font-semibold tabular-nums text-ui-ink">
            ₦{formatNaira(loan.amount)}
          </p>
          {loan.interestRate != null && (
            <p className="text-xs text-ui-muted">{loan.interestRate}% APR</p>
          )}
        </div>
      ),
    },
    {
      id: "tenor",
      header: "Tenor",
      mobile: "hidden",
      cell: (loan) => (
        <div className="whitespace-nowrap text-xs text-ui-muted">
          <p className="text-ui-ink">
            {loan.tenorMonths ?? loan.tenureMonths ?? "—"} months
          </p>
          {loan.monthlyRepayment != null && (
            <p className="tabular-nums">
              ₦{formatNaira(loan.monthlyRepayment)}/mo
            </p>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "primary",
      cell: (loan) => <StatusChip status={loan.status} />,
    },
    {
      id: "creditScore",
      header: "Credit score",
      mobile: "hidden",
      cell: (loan) => {
        if (loan.creditScore == null)
          return <span className="text-ui-faint">—</span>;
        const color =
          loan.creditScore >= 700
            ? "bg-ui-success"
            : loan.creditScore >= 500
              ? "bg-ui-warning"
              : "bg-ui-danger";
        const width = Math.min(
          100,
          Math.max(0, (loan.creditScore / 850) * 100),
        );
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ui-sunken">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="tabular-nums text-xs font-medium text-ui-ink">
              {loan.creditScore}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Loan Applications"
        icon={HandCoins}
        subtitle="Review and manage student loan applications"
      />

      <div className="space-y-4">
        {/* Quick Stats */}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Quick stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            {dashboardQuery.isPending ? (
              [1, 2, 3, 4].map((n) => (
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
                  label="Pending Review"
                  icon={Clock}
                  value={
                    allLoans.filter(
                      (l) =>
                        l.status === "PENDING" || l.status === "OPS_REVIEW",
                    ).length
                  }
                />
                <MetricCard
                  label="Loan portfolio"
                  icon={Landmark}
                  prefix="₦"
                  value={dashboardQuery.data?.totalLoanPortfolio ?? 0}
                />
                <MetricCard
                  label="Active loans"
                  icon={Banknote}
                  value={dashboardQuery.data?.activeLoans ?? 0}
                />
                <MetricCard
                  label="Overdue loans"
                  icon={TriangleAlert}
                  value={dashboardQuery.data?.overdueLoans ?? 0}
                />
              </>
            )}
          </div>
        </section>

        {/* Applications Table */}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Applications</h2>

            <div className="flex flex-wrap items-center gap-3">
              {/* Queue refresh info when in Ops Review */}
              {isOpsPendingQueue && (
                <div className="flex items-center gap-2 text-xs text-ui-muted">
                  <span>Updated {secondsAgo}s ago</span>
                  <button
                    type="button"
                    className="ui-icon-btn h-7 w-7"
                    title="Refresh queue"
                    aria-label="Refresh queue"
                    onClick={() => void loansQuery.refetch()}
                  >
                    <RefreshCw
                      size={13}
                      className={
                        loansQuery.isFetching
                          ? "animate-spin text-ui-accent"
                          : ""
                      }
                    />
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="ui-tabs overflow-x-auto" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`ui-tab ${tab === t.value ? "ui-tab-active" : ""}`}
                    role="tab"
                    aria-selected={tab === t.value}
                    onClick={() => void setTab(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loansQuery.isError && (
            <div className="ui-alert ui-alert-danger m-4">
              <CircleAlert size={16} />
              <div className="flex-1">Couldn&apos;t load loans.</div>
              <button
                type="button"
                className="ui-btn ui-btn-sm"
                onClick={() => void loansQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          <div className="ui-panel-body overflow-hidden">
            <DataTable
              data={allLoans}
              columns={columns}
              keyExtractor={(l) => l.id}
              loading={loansQuery.isPending}
              onRowClick={openDetail}
              hasMore={Boolean(loansQuery.hasNextPage)}
              isLoadingMore={loansQuery.isFetchingNextPage}
              onLoadMore={() => void loansQuery.fetchNextPage()}
              totalText={`${allLoans.length} shown${loansQuery.hasNextPage ? " · more available" : ""}`}
              rowActions={(loan) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    className="ui-icon-btn"
                    onClick={() => openDetail(loan)}
                    aria-label="View Details"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>

                  {loan.status === "OPS_REVIEW" && isOpsRole && (
                    <>
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary ui-btn-sm"
                        onClick={() => void handleApprove(loan)}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-danger ui-btn-sm"
                        onClick={() => void handleReject(loan)}
                        disabled={rejectMutation.isPending}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
              emptyState={
                <EmptyState
                  icon={SearchX}
                  message="No loans found matching your criteria"
                  action={
                    tab !== "ALL"
                      ? {
                          label: "Show all loans",
                          onClick: () => void setTab("ALL"),
                        }
                      : undefined
                  }
                />
              }
            />
          </div>
        </section>
      </div>

      {/* Loan Details Modal */}
      <LoanDetailModal
        open={Boolean(loanId)}
        onClose={closeDetail}
        loan={selectedLoan}
        isOpsRole={isOpsRole}
        onApprove={(l) => void handleApprove(l)}
        onReject={(l) => void handleReject(l)}
      />
    </>
  );
}

function LoanDetailModal({
  open,
  onClose,
  loan,
  isOpsRole,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  loan?: Loan;
  isOpsRole: boolean;
  onApprove: (loan: Loan) => void;
  onReject: (loan: Loan) => void;
}) {
  if (!loan) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Loan details"
      className="max-h-[92dvh] overflow-y-auto md:max-w-2xl"
    >
      <div className="ui-modal-head">
        <h2 className="ui-modal-title">Loan details</h2>
        <button
          type="button"
          className="ui-icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="ui-modal-body space-y-6">
        <dl className="ui-dl">
          <div>
            <dt className="ui-dt">Applicant</dt>
            <dd className="ui-dd font-medium text-ui-ink">
              {loan.userId ? (
                <Link
                  href={`/users?user=${encodeURIComponent(loan.userId)}`}
                  className="hover:text-ui-accent hover:underline"
                >
                  {loan.userName || "—"}
                </Link>
              ) : (
                loan.userName || "—"
              )}
            </dd>
          </div>

          <div>
            <dt className="ui-dt">School</dt>
            <dd className="ui-dd">{loan.schoolName || "—"}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="ui-dt">Purpose</dt>
            <dd className="ui-dd">{loan.purpose || "—"}</dd>
          </div>

          <div>
            <dt className="ui-dt">Amount</dt>
            <dd className="ui-dd font-medium tabular-nums text-ui-ink">
              ₦{formatNaira(loan.amount)}
            </dd>
          </div>

          <div>
            <dt className="ui-dt">Interest rate</dt>
            <dd className="ui-dd">{loan.interestRate ?? "—"}% APR</dd>
          </div>

          <div>
            <dt className="ui-dt">Tenor</dt>
            <dd className="ui-dd">
              {loan.tenorMonths ?? loan.tenureMonths ?? "—"} months
            </dd>
          </div>

          <div>
            <dt className="ui-dt">Monthly repayment</dt>
            <dd className="ui-dd tabular-nums">
              {loan.monthlyRepayment != null
                ? `₦${formatNaira(loan.monthlyRepayment)}`
                : "—"}
            </dd>
          </div>

          <div>
            <dt className="ui-dt">Credit score</dt>
            <dd className="ui-dd">
              {loan.creditScore != null ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ui-sunken">
                    <div
                      className={`h-full rounded-full ${
                        loan.creditScore >= 700
                          ? "bg-ui-success"
                          : loan.creditScore >= 500
                            ? "bg-ui-warning"
                            : "bg-ui-danger"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, (loan.creditScore / 850) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="tabular-nums font-medium text-ui-ink">
                    {loan.creditScore}
                  </span>
                </div>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <div>
            <dt className="ui-dt">Status</dt>
            <dd className="ui-dd">
              <StatusChip status={loan.status} />
            </dd>
          </div>

          {loan.outstandingPrincipal != null && (
            <div>
              <dt className="ui-dt">Outstanding principal</dt>
              <dd className="ui-dd tabular-nums">
                ₦{formatNaira(loan.outstandingPrincipal)}
              </dd>
            </div>
          )}

          {loan.outstandingInterest != null && (
            <div>
              <dt className="ui-dt">Outstanding interest</dt>
              <dd className="ui-dd tabular-nums">
                ₦{formatNaira(loan.outstandingInterest)}
              </dd>
            </div>
          )}

          {loan.rejectionReason && (
            <div className="sm:col-span-2">
              <dt className="ui-dt">Rejection reason</dt>
              <dd className="mt-1 rounded-lg border border-red-200 bg-ui-danger-soft p-2.5 text-[13px] text-ui-danger">
                {loan.rejectionReason}
              </dd>
            </div>
          )}

          <div>
            <dt className="ui-dt">Applied</dt>
            <dd className="ui-dd">
              {loan.appliedAt || loan.createdAt
                ? formatDate(loan.appliedAt || loan.createdAt || "")
                : "—"}
            </dd>
          </div>
        </dl>

        {/* Linked Bank Connection Panel (Mono Connect) */}
        <section className="rounded-xl border border-ui-line bg-ui-sunken/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-ui-accent" />
            <h3 className="text-sm font-semibold text-ui-ink">Linked bank</h3>
          </div>

          {loan.bankConnection ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <dt className="text-ui-muted">Bank name</dt>
                <dd className="font-medium text-ui-ink mt-0.5">
                  {loan.bankConnection.institutionName || "—"}
                </dd>
              </div>

              <div>
                <dt className="text-ui-muted">Account number</dt>
                <dd className="font-mono font-medium text-ui-ink mt-0.5">
                  {loan.bankConnection.accountNumberMasked || "—"}
                </dd>
              </div>

              <div>
                <dt className="text-ui-muted">Account balance</dt>
                <dd className="font-semibold tabular-nums text-ui-ink mt-0.5">
                  {loan.bankConnection.balance != null
                    ? `₦${formatNaira(loan.bankConnection.balance)}`
                    : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-ui-muted">Account type / Status</dt>
                <dd className="mt-0.5">
                  <span className="ui-badge ui-badge-info">
                    {loan.bankConnection.dataStatus || "Active"}
                  </span>
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-ui-muted">Last refreshed</dt>
                <dd className="text-ui-body mt-0.5">
                  {loan.bankConnection.lastSyncedAt
                    ? formatDateTime(loan.bankConnection.lastSyncedAt)
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="rounded-lg border border-dashed border-ui-line bg-white p-3 text-center">
              <p className="text-sm font-medium text-ui-ink">
                No bank connected
              </p>
              <p className="mt-1 text-xs text-ui-muted">
                The customer can connect their bank account from the app&apos;s
                Loans screen to speed up review.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="ui-modal-foot flex-col gap-2 sm:flex-row">
        {loan.status === "OPS_REVIEW" && isOpsRole && (
          <>
            <button
              type="button"
              className="ui-btn ui-btn-primary w-full sm:w-auto"
              onClick={() => onApprove(loan)}
            >
              Approve
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-danger w-full sm:w-auto"
              onClick={() => onReject(loan)}
            >
              Reject
            </button>
          </>
        )}
        <button
          type="button"
          className="ui-btn w-full sm:w-auto sm:ml-auto"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <LoansContent />
    </Suspense>
  );
}
