"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Activity, Ban, Download, Eye, Search, Users, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import {
  getUserActivity,
  getUserDetail,
  getUsers,
  reactivateUser,
  suspendUser,
} from "@/lib/api/admin";
import { useAdminSession } from "@/lib/auth/session";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { apiGet } from "@/lib/http";
import { trackAction, trackExport } from "@/lib/telemetry";
import type { User, UserActivity, UserDetail } from "@/lib/types";
import { confirm, getLastConfirmReason } from "@/lib/ui/confirm";
import { toast } from "@/lib/ui/toast";

const queryOptions = { history: "replace" as const, shallow: true };

function UsersContent() {
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [tier, setTier] = useQueryState(
    "kycTier",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [userId, setUserId] = useQueryState(
    "user",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [tab, setTab] = useState<"Overview" | "Activity">("Overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const session = useAdminSession();
  const queryClient = useQueryClient();
  const params = { search, status, kycTier: tier, limit: 20 };
  const apiSearch = /^\+?[\d\s-]{6,}$/.test(search.trim())
    ? { phoneNumber: search.trim() }
    : { search: search.trim() };
  const usersQuery = useInfiniteQuery({
    queryKey: ["admin", "users", params],
    queryFn: ({ pageParam }) =>
      getUsers({
        ...apiSearch,
        status,
        kycTier: tier,
        limit: 20,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.hasMore ? (page.nextCursor ?? undefined) : undefined,
  });
  const detailQuery = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => getUserDetail(userId),
    enabled: Boolean(userId),
  });
  const canSeeActivity = session.canAccess("audit");
  const activityQuery = useQuery({
    queryKey: ["admin", "user", userId, "activity"],
    queryFn: () => getUserActivity(userId),
    enabled: Boolean(userId) && canSeeActivity,
  });
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendUser(id, reason),
    onSuccess: () => {
      toast.success("User suspended");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "user", userId],
      });
    },
    onError: () => toast.error("Failed to suspend user"),
  });
  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      toast.success("User reactivated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "user", userId],
      });
    },
    onError: () => toast.error("Failed to reactivate user"),
  });

  useEffect(() => {
    if (!canSeeActivity && tab === "Activity") setTab("Overview");
  }, [canSeeActivity, tab]);
  const users = usersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const openDetail = (user: User) => {
    setTab("Overview");
    void setUserId(user.id);
    trackAction("user_detail_open", { id: user.id });
  };
  const closeDetail = () => {
    void setUserId("");
    setTab("Overview");
  };
  const runSuspend = async (
    item: Pick<User, "id" | "firstName" | "lastName">,
  ) => {
    const ok = await confirm({
      title: `Suspend ${item.firstName} ${item.lastName}?`,
      message: "They will no longer be able to use their account.",
      confirmLabel: "Suspend",
      tone: "danger",
      reasonLabel: "Reason",
      reasonPlaceholder: "Enter a reason",
    });
    if (ok)
      suspendMutation.mutate({
        id: item.id,
        reason: getLastConfirmReason() || "Suspended by admin",
      });
  };
  const runReactivate = async (
    item: Pick<User, "id" | "firstName" | "lastName">,
  ) => {
    if (
      await confirm({
        title: `Reactivate ${item.firstName} ${item.lastName}?`,
        message: "This will restore account access.",
        confirmLabel: "Reactivate",
        tone: "primary",
      })
    )
      reactivateMutation.mutate(item.id);
  };
  const exportRows = async () => {
    try {
      const result = await apiGet<{ items: User[] }>(
        "/admin/users",
        { ...apiSearch, status, kycTier: tier, limit: 20 },
        { purpose: "export" },
      );
      const rows = result.items ?? [];
      downloadCsv("users", rows, [
        { label: "User ID", value: (row) => row.id },
        { label: "First name", value: (row) => row.firstName },
        { label: "Last name", value: (row) => row.lastName },
        { label: "Email", value: (row) => row.email },
        { label: "Phone", value: (row) => row.phoneNumber },
        { label: "Status", value: (row) => row.status },
        { label: "KYC tier", value: (row) => row.kycTier },
        {
          label: "Wallet balance (NGN)",
          value: (row) => row.walletBalance / 100,
        },
      ]);
      trackExport({
        resource: "users",
        rows: rows.length,
        filters: { search: Boolean(search), status, kycTier: tier },
      });
      toast.success("Users exported");
    } catch {
      toast.error("Failed to export users");
    }
  };
  const columns: Column<User>[] = [
    {
      id: "name",
      header: "User",
      mobile: "primary",
      cell: (user) => (
        <span className="flex items-center gap-2">
          <BubbleAvatar seed={user.firstName} size={32} />
          <span>
            {user.firstName} {user.lastName}
          </span>
        </span>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      mobile: "secondary",
      cell: (user) => (
        <span className="block max-w-56 truncate">
          <CopyButton
            value={user.email}
            className="block max-w-full truncate"
            toastMessage="Email copied"
            onClick={() => trackAction("user_email_copy", { id: user.id })}
          />
          <CopyButton
            value={user.phoneNumber}
            className="block text-xs text-ui-muted"
            toastMessage="Phone copied"
            onClick={() => trackAction("user_phone_copy", { id: user.id })}
          />
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (user) => <StatusChip status={user.status} />,
    },
    {
      id: "kyc",
      header: "KYC",
      mobile: "secondary",
      cell: (user) => (
        <span className="ui-badge ui-badge-neutral">
          {user.kycTier.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      id: "balance",
      header: "Balance",
      mobile: "secondary",
      cell: (user) => `₦${formatNaira(user.walletBalance / 100)}`,
    },
    {
      id: "joined",
      header: "Joined",
      mobile: "hidden",
      cell: (user) => formatDate(user.createdAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        icon={Users}
        subtitle="Manage user accounts and KYC status"
      >
        <button
          className="ui-btn"
          type="button"
          onClick={() => void exportRows()}
        >
          <Download size={15} />
          Export CSV
        </button>
      </PageHeader>
      <section className="ui-panel">
        <div className="ui-panel-head">
          <h2 className="ui-panel-title">All users</h2>
          <button
            type="button"
            className="ui-btn ui-btn-sm md:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
          <div className="hidden w-full flex-col gap-2 md:flex lg:w-auto lg:flex-row lg:items-center">
            <label className="ui-search w-full lg:w-64">
              <Search size={15} />
              <input
                className="ui-input"
                value={search}
                onChange={(event) => void setSearch(event.target.value)}
                placeholder="Search by name, email, phone..."
                onKeyDown={(event) => {
                  if (event.key === "Escape") void setSearch("");
                }}
              />
            </label>
            <select
              aria-label="KYC tier"
              className="ui-input w-full lg:w-auto"
              value={tier}
              onChange={(event) => void setTier(event.target.value)}
            >
              <option value="">All tiers</option>
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={`TIER_${value}`}>
                  Tier {value}
                </option>
              ))}
            </select>
            <div className="ui-tabs">
              {[
                ["", "All"],
                ["ACTIVE", "Active"],
                ["SUSPENDED", "Suspended"],
                ["PENDING", "Pending"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`ui-tab ${status === value ? "ui-tab-active" : ""}`}
                  type="button"
                  onClick={() => void setStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {usersQuery.isError && (
          <div className="ui-alert ui-alert-danger m-4">
            Couldn't load users.
            <button
              type="button"
              className="ui-btn ui-btn-sm ml-auto"
              onClick={() => void usersQuery.refetch()}
            >
              Try again
            </button>
          </div>
        )}
        <div className="ui-panel-body overflow-hidden">
          <DataTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
            loading={usersQuery.isPending}
            onRowClick={openDetail}
            hasMore={usersQuery.hasNextPage}
            isLoadingMore={usersQuery.isFetchingNextPage}
            onLoadMore={() => void usersQuery.fetchNextPage()}
            totalText={`Showing ${users.length} users${usersQuery.hasNextPage ? " · more available" : ""}`}
            rowActions={(user) => (
              <span className="flex justify-end gap-1">
                <button
                  type="button"
                  className="ui-icon-btn"
                  aria-label="View user details"
                  title="View user details"
                  onClick={() => openDetail(user)}
                >
                  <Eye size={16} />
                </button>
                {user.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="ui-icon-btn"
                    aria-label="Suspend user account"
                    onClick={() => void runSuspend(user)}
                  >
                    <Ban size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ui-btn ui-btn-sm"
                    onClick={() => void runReactivate(user)}
                  >
                    Reactivate
                  </button>
                )}
              </span>
            )}
            emptyState={
              <EmptyState
                message="No users found matching your criteria"
                action={
                  search || status || tier
                    ? {
                        label: "Clear filters",
                        onClick: () => {
                          void setSearch("");
                          void setStatus("");
                          void setTier("");
                        },
                      }
                    : undefined
                }
              />
            }
          />
        </div>
      </section>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        className="max-h-[90dvh] overflow-y-auto md:max-w-lg"
      >
        <div className="ui-modal-head">
          <h2 className="ui-modal-title">Filters</h2>
          <button
            type="button"
            className="ui-icon-btn"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="ui-modal-body space-y-3">
          <label className="ui-label">
            Search
            <input
              className="ui-input mt-1"
              value={search}
              onChange={(event) => void setSearch(event.target.value)}
              placeholder="Name, email, phone"
            />
          </label>
          <label className="ui-label">
            KYC tier
            <select
              className="ui-input mt-1"
              value={tier}
              onChange={(event) => void setTier(event.target.value)}
            >
              <option value="">All tiers</option>
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={`TIER_${value}`}>
                  Tier {value}
                </option>
              ))}
            </select>
          </label>
          <label className="ui-label">
            Status
            <select
              className="ui-input mt-1"
              value={status}
              onChange={(event) => void setStatus(event.target.value)}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
        </div>
        <div className="ui-modal-foot">
          <button
            type="button"
            className="ui-btn w-full"
            onClick={() => setFiltersOpen(false)}
          >
            Apply filters
          </button>
        </div>
      </Modal>
      <UserDrawer
        open={Boolean(userId)}
        onClose={closeDetail}
        detail={detailQuery.data}
        loading={detailQuery.isPending}
        error={detailQuery.isError}
        retry={() => void detailQuery.refetch()}
        canSeeActivity={canSeeActivity}
        tab={tab}
        setTab={setTab}
        activity={activityQuery.data}
        activityLoading={activityQuery.isPending}
        activityError={activityQuery.isError}
        retryActivity={() => void activityQuery.refetch()}
        onSuspend={(user) => void runSuspend(user)}
        onReactivate={(user) => void runReactivate(user)}
      />
    </>
  );
}

function UserDrawer({
  open,
  onClose,
  detail,
  loading,
  error,
  retry,
  canSeeActivity,
  tab,
  setTab,
  activity,
  activityLoading,
  activityError,
  retryActivity,
  onSuspend,
  onReactivate,
}: {
  open: boolean;
  onClose: () => void;
  detail?: UserDetail;
  loading: boolean;
  error: boolean;
  retry: () => void;
  canSeeActivity: boolean;
  tab: "Overview" | "Activity";
  setTab: (tab: "Overview" | "Activity") => void;
  activity?: UserActivity;
  activityLoading: boolean;
  activityError: boolean;
  retryActivity: () => void;
  onSuspend: (user: UserDetail) => void;
  onReactivate: (user: UserDetail) => void;
}) {
  const loginColumns: Column<UserActivity["loginEvents"][number]>[] = [
    {
      id: "time",
      header: "Time",
      mobile: "primary",
      cell: (event) => formatDateTime(event.occurredAt),
    },
    {
      id: "outcome",
      header: "Outcome",
      mobile: "secondary",
      cell: (event) => <StatusChip status={event.outcome} />,
    },
    {
      id: "device",
      header: "Device ID",
      mobile: "secondary",
      cell: (event) => event.deviceId ?? "—",
    },
    {
      id: "ip",
      header: "Source IP",
      mobile: "secondary",
      cell: (event) => event.sourceIp ?? "—",
    },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="User details"
      className="max-h-[92dvh] overflow-y-auto md:max-w-3xl"
    >
      <div className="ui-modal-head">
        <h2 className="ui-modal-title">User Details</h2>
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
            <div className="ui-skel h-12 w-12 rounded-full" />
            <div className="ui-skel h-4 w-40" />
          </div>
        )}
        {error && (
          <EmptyState
            title="Couldn't load user details"
            message="Try again."
            action={{ label: "Try again", onClick: retry }}
          />
        )}
        {detail && (
          <>
            <div className="flex items-center gap-3">
              <BubbleAvatar seed={detail.firstName} size={40} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">
                  {detail.firstName} {detail.lastName}
                </p>
                <CopyButton
                  value={detail.id}
                  className="text-xs text-ui-muted"
                  toastMessage="User ID copied"
                  onClick={() => trackAction("user_id_copy", { id: detail.id })}
                >
                  ID: {detail.id}
                </CopyButton>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <StatusChip status={detail.status} />
                <span className="ui-badge ui-badge-neutral">
                  {detail.kycTier.replaceAll("_", " ")}
                </span>
              </div>
            </div>
            <div className="ui-tabs my-4" role="tablist">
              <button
                type="button"
                className={`ui-tab ${tab === "Overview" ? "ui-tab-active" : ""}`}
                onClick={() => setTab("Overview")}
                role="tab"
                aria-selected={tab === "Overview"}
              >
                Overview
              </button>
              {canSeeActivity && (
                <button
                  type="button"
                  className={`ui-tab ${tab === "Activity" ? "ui-tab-active" : ""}`}
                  onClick={() => setTab("Activity")}
                  role="tab"
                  aria-selected={tab === "Activity"}
                >
                  <Activity size={14} />
                  Activity
                </button>
              )}
            </div>
            {tab === "Overview" ? (
              <div className="space-y-5">
                <dl className="ui-dl">
                  <div>
                    <dt className="ui-dt">Email</dt>
                    <dd className="ui-dd break-all">
                      <CopyButton
                        value={detail.email}
                        className="text-left"
                        toastMessage="Email copied"
                        onClick={() =>
                          trackAction("user_email_copy", { id: detail.id })
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="ui-dt">Phone</dt>
                    <dd className="ui-dd">
                      <CopyButton
                        value={detail.phoneNumber}
                        toastMessage="Phone copied"
                        onClick={() =>
                          trackAction("user_phone_copy", { id: detail.id })
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="ui-dt">Wallet Balance</dt>
                    <dd className="ui-dd">
                      ₦{formatNaira(detail.walletBalance / 100)}
                    </dd>
                  </div>
                  <div>
                    <dt className="ui-dt">Joined</dt>
                    <dd className="ui-dd">{formatDate(detail.createdAt)}</dd>
                  </div>
                </dl>
                {detail.status === "SUSPENDED" && (
                  <div className="ui-alert ui-alert-danger">
                    <div>
                      <strong>Suspended</strong>
                      {detail.suspensionReason && (
                        <p className="mt-1">{detail.suspensionReason}</p>
                      )}
                      {detail.suspendedAt && (
                        <p className="mt-1 text-xs">
                          {formatDateTime(detail.suspendedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <DetailList
                  title="Recent Transactions"
                  empty="No transactions yet"
                  items={detail.recentTransactions}
                  render={(txn) => (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {txn.description}
                        </p>
                        <p className="text-xs text-ui-muted">
                          {txn.reference} · {formatDateTime(txn.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        ₦{formatNaira(txn.amount / 100)}
                        <StatusChip status={txn.status} />
                      </div>
                    </>
                  )}
                />
                <DetailList
                  title="Loans"
                  empty="No loans on record"
                  items={detail.loans}
                  render={(loan) => (
                    <>
                      <div>
                        <p className="text-sm font-medium">{loan.schoolName}</p>
                        <p className="text-xs text-ui-muted">
                          {formatDate(loan.submittedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        ₦{formatNaira(loan.amount / 100)}
                        <StatusChip status={loan.status} />
                      </div>
                    </>
                  )}
                />
                <DetailList
                  title="KYC Verifications"
                  empty="No KYC submissions yet"
                  items={detail.kycVerifications}
                  render={(kyc) => (
                    <>
                      <div>
                        <p className="text-sm font-medium">
                          {kyc.idType} · {kyc.requestedTier}
                        </p>
                        <p className="text-xs text-ui-muted">
                          {formatDate(kyc.createdAt)}
                        </p>
                      </div>
                      <StatusChip status={kyc.status} />
                    </>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-ui-muted">
                  Activity in the last {activity?.windowDays ?? "—"} days
                </p>
                {activityLoading && (
                  <div className="ui-empty">Loading activity…</div>
                )}
                {activityError && (
                  <div className="ui-alert ui-alert-danger">
                    Couldn't load activity.
                    <button
                      type="button"
                      className="ui-btn ui-btn-sm"
                      onClick={retryActivity}
                    >
                      Try again
                    </button>
                  </div>
                )}
                {activity && (
                  <>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      <MetricCard
                        label="Transfers"
                        value={activity.transferProfile.count}
                      />
                      <MetricCard
                        label="Total"
                        value={activity.transferProfile.total / 100}
                        prefix="₦"
                      />
                      <MetricCard
                        label="Average"
                        value={activity.transferProfile.average / 100}
                        prefix="₦"
                      />
                      <MetricCard
                        label="Median"
                        value={activity.transferProfile.median / 100}
                        prefix="₦"
                      />
                      <MetricCard
                        label="Largest"
                        value={activity.transferProfile.largest / 100}
                        prefix="₦"
                      />
                    </div>
                    <section>
                      <h3 className="mb-2 text-sm font-semibold">
                        Login events
                      </h3>
                      <DataTable
                        data={activity.loginEvents}
                        columns={loginColumns}
                        keyExtractor={(event, index) =>
                          `${event.occurredAt}-${index}`
                        }
                        emptyState={
                          <EmptyState message="No login events in this window" />
                        }
                      />
                    </section>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {detail && (
        <div className="ui-modal-foot flex-col sm:flex-row">
          {detail.status === "ACTIVE" ? (
            <button
              type="button"
              className="ui-btn ui-btn-danger w-full sm:w-auto"
              onClick={() => onSuspend(detail)}
            >
              Suspend
            </button>
          ) : (
            <button
              type="button"
              className="ui-btn w-full sm:w-auto"
              onClick={() => onReactivate(detail)}
            >
              Reactivate
            </button>
          )}
          <button
            type="button"
            className="ui-btn w-full sm:w-auto"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

function DetailList<T extends { id: string }>({
  title,
  empty,
  items,
  render,
}: {
  title: string;
  empty: string;
  items: T[];
  render: (item: T) => ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-ui-muted">{empty}</p>
      ) : (
        <div className="divide-y divide-ui-line rounded-xl border border-ui-line">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48" />}>
      <UsersContent />
    </Suspense>
  );
}
