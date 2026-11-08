"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  CircleAlert,
  HandCoins,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { BubbleAvatar } from "@/components/ui/bubble-avatar";
import { DidYouKnow } from "@/components/ui/did-you-know";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { getDashboardMetrics } from "@/lib/api/admin";
import { formatDateTime, formatNaira } from "@/lib/format";

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardMetrics,
  });
  const metrics = query.data;
  const monthsVolume =
    metrics?.transactionVolumeThisMonth ??
    metrics?.totalVolume ??
    metrics?.totalTransactionVolume ??
    0;
  const volumeData = metrics?.volumeByDay ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumb="Overview"
        icon={LayoutDashboard}
        meta={metrics?.reportDate ? formatDateTime(metrics.reportDate) : ""}
      >
        <button
          className="ui-btn"
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw
            size={15}
            className={query.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </PageHeader>
      <div className="space-y-4">
        {query.isError && (
          <div className="ui-alert ui-alert-danger">
            <CircleAlert size={16} />
            Couldn't load the dashboard.
            <button
              type="button"
              className="ui-btn ui-btn-sm ml-auto"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </div>
        )}
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Quick stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
            <Link href="/users">
              <MetricCard
                label="Total users"
                icon={Users}
                value={metrics?.totalUsers ?? 0}
                trend={metrics?.trends?.users}
                hint={`+${metrics?.newUsersToday ?? 0} today`}
              />
            </Link>
            <Link href="/users">
              <MetricCard
                label="Active today"
                icon={Activity}
                value={metrics?.activeUsersToday ?? metrics?.activeUsers ?? 0}
                hint="signed in today"
              />
            </Link>
            <Link href="/transactions">
              <MetricCard
                label="Volume this month"
                icon={Banknote}
                prefix="₦"
                value={monthsVolume / 100}
                trend={metrics?.trends?.volume}
                hint="vs last month"
              />
            </Link>
            <Link href="/transactions">
              <MetricCard
                label="Volume today"
                icon={ArrowLeftRight}
                prefix="₦"
                value={(metrics?.transactionVolumeToday ?? 0) / 100}
                hint={`${metrics?.transactionCountToday ?? 0} transactions`}
              />
            </Link>
            <Link href="/loans">
              <MetricCard
                label="Active loans"
                icon={HandCoins}
                value={metrics?.activeLoans ?? 0}
                trend={metrics?.trends?.loans}
                hint={`${metrics?.overdueLoans ?? 0} overdue`}
              />
            </Link>
            <Link href="/kyc">
              <MetricCard
                label="Pending KYC"
                icon={ShieldCheck}
                value={metrics?.pendingKyc ?? 0}
                hint="awaiting review"
              />
            </Link>
          </div>
        </section>
        <DidYouKnow />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="ui-panel lg:col-span-2">
            <div className="ui-panel-head">
              <h2 className="ui-panel-title">Transaction volume</h2>
              <span className="ui-meta">Last 7 days</span>
            </div>
            <div className="ui-panel-body h-56 p-4">
              {volumeData.length ? (
                <div
                  aria-label="Transaction volume over the last 7 days"
                  role="img"
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) =>
                          `₦${formatNaira(Number(value) / 100)}`
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-ui-accent)"
                        fill="var(--color-ui-accent)"
                        fillOpacity={0.18}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="ui-empty h-full">
                  {query.isPending ? "Loading volume…" : "No volume yet"}
                </div>
              )}
            </div>
          </section>
          <section className="ui-panel">
            <div className="ui-panel-head">
              <h2 className="ui-panel-title">Books</h2>
              <Link href="/loans" className="ui-btn ui-btn-ghost ui-btn-sm">
                Loans <ArrowRight size={14} />
              </Link>
            </div>
            <div className="ui-panel-body divide-y divide-ui-line">
              {[
                [
                  "Total loan portfolio",
                  `₦${formatNaira((metrics?.totalLoanPortfolio ?? metrics?.totalLoanDisbursed ?? 0) / 100)}`,
                  "/loans",
                ],
                ["Overdue loans", String(metrics?.overdueLoans ?? 0), "/loans"],
                ["Default rate", `${metrics?.defaultRate ?? 0}%`, ""],
              ].map(([label, value, href]) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    className="flex justify-between gap-3 px-4 py-3 text-sm hover:bg-ui-rail"
                  >
                    <span className="text-ui-muted">{label}</span>
                    <strong>{value}</strong>
                  </Link>
                ) : (
                  <div
                    key={label}
                    className="flex justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="text-ui-muted">{label}</span>
                    <strong>{value}</strong>
                  </div>
                ),
              )}
              {(metrics?.pendingKycItems ?? []).map((item) => (
                <Link
                  key={item.id}
                  href="/kyc"
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ui-rail"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <BubbleAvatar seed={item.name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="text-xs text-ui-muted">
                        {item.type} · KYC
                      </span>
                    </span>
                  </span>
                  <span className="ui-meta">{item.time}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Recent transactions</h2>
            <Link href="/transactions" className="ui-btn ui-btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="ui-panel-body overflow-hidden">
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden md:table-cell">Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.recentTransactions ?? []).map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className="flex items-center gap-2">
                          <BubbleAvatar seed={tx.userName} size={32} />
                          <span className="font-medium">{tx.userName}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell">
                        {tx.type.replaceAll("_", " ")}
                      </td>
                      <td className="whitespace-nowrap">
                        ₦{formatNaira(tx.amount / 100)}
                      </td>
                      <td>
                        <StatusChip status={tx.status} />
                      </td>
                      <td className="hidden md:table-cell">
                        {formatDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!query.isPending && !metrics?.recentTransactions?.length && (
                    <tr>
                      <td colSpan={5}>
                        <div className="ui-empty">No transactions yet</div>
                      </td>
                    </tr>
                  )}
                  {query.isPending && (
                    <tr>
                      <td colSpan={5}>
                        <div className="ui-empty">Loading dashboard…</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
