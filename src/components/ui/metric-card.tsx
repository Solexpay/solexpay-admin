import { ArrowDown, ArrowUp } from "lucide-react";
import type { ComponentType } from "react";

export function compactValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toLocaleString("en-NG");
}

export interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  hint?: string;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  className?: string;
}

/**
 * A quick-stat card: label with an icon tile, then the value in a sunken box
 * with an optional trend and hint underneath. Put several in a ui-panel.
 */
export function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  hint = "",
  icon: Icon,
  className = "",
}: MetricCardProps) {
  const fullValue = `${prefix}${Math.round(value).toLocaleString("en-NG")}${suffix}`;

  return (
    <div
      className={`rounded-xl border border-ui-line bg-white p-1.5 ${className}`.trim()}
    >
      <div className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        {Icon && (
          <span className="ui-icon-tile h-6 w-6 rounded-md">
            <Icon size={14} />
          </span>
        )}
        <p className="truncate text-[13px] text-ui-muted">{label}</p>
      </div>
      <div className="rounded-lg bg-ui-sunken px-3 py-3">
        <p
          className="truncate text-xl font-semibold tabular-nums text-ui-ink"
          title={fullValue}
        >
          {prefix}
          {compactValue(value)}
          {suffix}
        </p>
        {(trend !== undefined || hint) && (
          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px]">
            {trend !== undefined && (
              <>
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-white ${
                    trend >= 0 ? "bg-ui-success" : "bg-ui-danger"
                  }`}
                >
                  {trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    trend >= 0 ? "text-ui-success" : "text-ui-danger"
                  }`}
                >
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              </>
            )}
            {hint && <span className="truncate text-ui-muted">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
