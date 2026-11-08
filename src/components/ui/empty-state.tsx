import { SearchX } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ComponentType<{ size?: number | string; className?: string }>;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  message = "No data found",
  action,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      {Icon && <Icon size={28} className="text-ui-faint" />}
      {title && <p className="text-sm font-semibold text-ui-ink">{title}</p>}
      {message && <p className="text-xs text-ui-muted">{message}</p>}
      {action && (
        <button
          type="button"
          className="ui-btn ui-btn-sm min-h-[40px] px-3 sm:min-h-[32px]"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}
