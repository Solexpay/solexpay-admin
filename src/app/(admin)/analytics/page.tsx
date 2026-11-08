"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart2,
  Clock,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useMemo } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { getUsageAnalytics } from "@/lib/api/admin";
import type { UsageAnalytics } from "@/lib/types";

const queryOptions = { history: "replace" as const, shallow: true };

const WINDOW_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return "—";
  }
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  if (remainingSecs === 0) return `${mins}m`;
  return `${mins}m ${remainingSecs}s`;
}

function formatFeatureName(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SvgSparkline({
  points,
  height = 140,
}: {
  points: { date: string; users: number }[];
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center text-xs text-ui-muted">
        Not enough daily points for sparkline
      </div>
    );
  }

  const values = points.map((p) => p.users);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = 16;
  const graphWidth = 600;
  const graphHeight = height;

  const coords = points.map((p, idx) => {
    const x =
      padding + (idx / (points.length - 1)) * (graphWidth - padding * 2);
    const y =
      graphHeight -
      padding -
      ((p.users - minVal) / range) * (graphHeight - padding * 2);
    return { x, y, ...p };
  });

  const pathD = coords.reduce(
    (acc, curr, idx) =>
      idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`,
    "",
  );

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${graphHeight} L ${coords[0].x} ${graphHeight} Z`;

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
          className="h-36 w-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Daily active users trend showing ${points.length} days from ${points[0]?.date} to ${points[points.length - 1]?.date}`}
        >
          <defs>
            <linearGradient
              id="analyticsSparklineArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-ui-accent)"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="var(--color-ui-accent)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>
          {/* Subtle grid lines */}
          <line
            x1="0"
            y1={padding}
            x2={graphWidth}
            y2={padding}
            stroke="var(--color-ui-line)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={graphHeight / 2}
            x2={graphWidth}
            y2={graphHeight / 2}
            stroke="var(--color-ui-line)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={graphHeight - padding}
            x2={graphWidth}
            y2={graphHeight - padding}
            stroke="var(--color-ui-line)"
          />

          {/* Area under curve */}
          <path d={areaD} fill="url(#analyticsSparklineArea)" />
          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-ui-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End dot */}
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="4"
            fill="var(--color-ui-accent)"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ui-muted">
        <span>{points[0]?.date}</span>
        <span>Peak: {maxVal.toLocaleString("en-NG")} active users</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const [windowDaysStr, setWindowDays] = useQueryState(
    "days",
    parseAsString.withDefault("30").withOptions(queryOptions),
  );

  const windowDays =
    windowDaysStr === "7" || windowDaysStr === "90"
      ? parseInt(windowDaysStr, 10)
      : 30;

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<UsageAnalytics>({
      queryKey: ["admin", "analytics-usage", { days: windowDays }],
      queryFn: () => getUsageAnalytics({ days: windowDays }),
    });

  const maxFeatureEvents = useMemo(() => {
    if (!data?.featureUsage?.length) return 1;
    return Math.max(...data.featureUsage.map((f) => f.events), 1);
  }, [data?.featureUsage]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Analytics"
        crumb="Analytics"
        subtitle="Aggregated usage insights and core product telemetry"
        icon={BarChart2}
      >
        <div className="flex items-center gap-2">
          {/* Date window selector */}
          <div className="ui-tabs" role="tablist" aria-label="Analytics Window">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={windowDaysStr === opt.value}
                className={`ui-tab ${windowDaysStr === opt.value ? "ui-tab-active" : ""}`}
                onClick={() => setWindowDays(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh analytics"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">
              {isFetching ? "Refreshing…" : "Refresh"}
            </span>
          </button>
        </div>
      </PageHeader>

      {/* Privacy safe badge note */}
      <div className="flex items-center gap-2 rounded-xl border border-ui-line bg-white px-4 py-2.5 text-xs text-ui-muted shadow-xs">
        <ShieldCheck size={16} className="text-ui-success shrink-0" />
        <p>
          <span className="font-medium text-ui-ink">
            Privacy-safe analytics:
          </span>{" "}
          Data is strictly aggregated across cohorts with at least 10 active
          users. Contains no personal identifying data, account balances, or
          credentials.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["s1", "s2", "s3", "s4"].map((key) => (
            <div
              key={key}
              className="ui-card h-28 animate-pulse bg-ui-sunken/60"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="ui-panel p-6 text-center">
          <p className="text-sm text-ui-danger">
            Failed to load analytics data.
          </p>
          <button
            type="button"
            className="ui-btn ui-btn-sm mt-3"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Headline metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Active Users"
              value={data.activeUsers ?? 0}
              icon={Users}
              hint={
                data.activeUsers !== undefined
                  ? `Cohort over last ${data.windowDays} days`
                  : "< 10 users (Cohort protected)"
              }
            />

            <div className="ui-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-ui-muted">
                <span>Avg Logins / User</span>
                <TrendingUp size={16} className="text-ui-accent" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-ui-ink">
                  {data.avgLoginsPerActiveUser !== undefined
                    ? data.avgLoginsPerActiveUser.toFixed(1)
                    : "—"}
                </span>
                <span className="ml-1 text-xs text-ui-muted">sessions</span>
              </div>
              <p className="text-[11px] text-ui-muted">
                Frequency per user in {data.windowDays}d window
              </p>
            </div>

            <div className="ui-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-ui-muted">
                <span>Avg Session Duration</span>
                <Clock size={16} className="text-ui-accent" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-ui-ink">
                  {formatDuration(data.avgForegroundSessionSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-ui-muted">
                Foreground app active time
              </p>
            </div>

            <div className="ui-card flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-ui-muted">
                <span>Median Session Duration</span>
                <Activity size={16} className="text-ui-accent" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold tracking-tight text-ui-ink">
                  {formatDuration(data.medianForegroundSessionSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-ui-muted">
                50th percentile foreground time
              </p>
            </div>
          </div>

          {/* Daily Active Users trend sparkline */}
          <section className="ui-panel">
            <div className="ui-panel-head">
              <div>
                <h2 className="ui-panel-title">Daily Active Users Trend</h2>
                <p className="ui-meta">
                  Unique active users per day across staging and production
                </p>
              </div>
            </div>
            <div className="ui-panel-body p-4 sm:p-5">
              {data.dailyActive && data.dailyActive.length > 0 ? (
                <SvgSparkline points={data.dailyActive} />
              ) : (
                <div className="py-8 text-center text-sm text-ui-muted">
                  No daily active user data recorded in this window.
                </div>
              )}
            </div>
          </section>

          {/* 2-column layout: Top Features + Core Flow Funnels */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Screens / Features as horizontal CSS bars */}
            <section className="ui-panel">
              <div className="ui-panel-head">
                <div>
                  <h2 className="ui-panel-title">Top Features & Screens</h2>
                  <p className="ui-meta">Frequency of feature interactions</p>
                </div>
                <Layers size={16} className="text-ui-muted" />
              </div>
              <div className="ui-panel-body p-4 sm:p-5">
                {data.featureUsage && data.featureUsage.length > 0 ? (
                  <div className="space-y-4">
                    {data.featureUsage.map((f) => {
                      const pct = Math.round(
                        (f.events / maxFeatureEvents) * 100,
                      );
                      return (
                        <div key={f.feature} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-ui-ink">
                              {formatFeatureName(f.feature)}
                            </span>
                            <span className="text-ui-muted">
                              <span className="font-semibold text-ui-ink">
                                {f.events.toLocaleString("en-NG")}
                              </span>{" "}
                              events ({f.users.toLocaleString("en-NG")} users)
                            </span>
                          </div>
                          {/* Pure CSS bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-ui-sunken">
                            <div
                              className="h-full rounded-full bg-ui-accent transition-all duration-300"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-ui-muted">
                    No feature telemetry events in this window.
                  </div>
                )}
              </div>
            </section>

            {/* Core Flow Funnels */}
            <section className="ui-panel">
              <div className="ui-panel-head">
                <div>
                  <h2 className="ui-panel-title">Flow Funnel Completion</h2>
                  <p className="ui-meta">
                    Conversion rates on critical user flows
                  </p>
                </div>
                <TrendingUp size={16} className="text-ui-muted" />
              </div>
              <div className="ui-panel-body p-4 sm:p-5">
                {data.flowUsage && data.flowUsage.length > 0 ? (
                  <div className="space-y-4">
                    {data.flowUsage.map((fl) => {
                      const ratePct = Math.round(fl.completionRate * 100);
                      return (
                        <div key={fl.flow} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-ui-ink">
                              {formatFeatureName(fl.flow)}
                            </span>
                            <span className="font-semibold text-ui-ink">
                              {ratePct}% completed
                            </span>
                          </div>
                          {/* Funnel progress bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-ui-sunken">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                ratePct >= 85
                                  ? "bg-ui-success"
                                  : ratePct >= 65
                                    ? "bg-ui-accent"
                                    : "bg-ui-warning"
                              }`}
                              style={{ width: `${Math.max(ratePct, 2)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-ui-muted">
                            <span>
                              Started: {fl.started.toLocaleString("en-NG")}
                            </span>
                            <span>
                              Completed: {fl.completed.toLocaleString("en-NG")}
                            </span>
                            <span>
                              Failed: {fl.failed.toLocaleString("en-NG")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-ui-muted">
                    No flow completion data recorded.
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="ui-skel h-48 rounded-xl" />}>
      <AnalyticsContent />
    </Suspense>
  );
}
