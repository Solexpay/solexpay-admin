import type { ComponentType, ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  crumb?: string;
  subtitle?: string;
  meta?: string;
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  children?: ReactNode;
  className?: string;
}

/**
 * Top of every console page: a breadcrumb row (icon, section name, optional
 * meta on the right) above the page title and its actions.
 */
export function PageHeader({
  title,
  crumb = "",
  subtitle = "",
  meta = "",
  icon: Icon,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`mb-5 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <div className="flex min-w-0 items-center gap-2 text-ui-body">
          {Icon && <Icon size={16} className="text-ui-muted" />}
          <span className="truncate">{crumb || title}</span>
        </div>
        {meta && (
          <span className="ui-meta hidden shrink-0 sm:inline">{meta}</span>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ui-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-ui-muted">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}
