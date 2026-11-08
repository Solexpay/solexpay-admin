export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS_TONES: Record<string, StatusTone> = {
  SUCCESS: "success",
  SUCCESSFUL: "success",
  COMPLETED: "success",
  ACTIVE: "success",
  APPROVED: "success",
  VERIFIED: "success",
  PAID: "success",
  DELIVERED: "success",
  FULFILLED: "success",
  RESOLVED: "success",
  REPAID: "success",
  DISBURSED: "success",
  PENDING: "warning",
  PROCESSING: "info",
  UNDER_REVIEW: "warning",
  IN_REVIEW: "warning",
  SUBMITTED: "warning",
  AWAITING: "warning",
  ON_HOLD: "warning",
  OPEN: "info",
  QUEUED: "info",
  FAILED: "danger",
  REJECTED: "danger",
  DECLINED: "danger",
  SUSPENDED: "danger",
  OVERDUE: "danger",
  DEFAULTED: "danger",
  REVERSED: "danger",
  REFUNDED: "danger",
  BLOCKED: "danger",
  INACTIVE: "neutral",
  CANCELLED: "neutral",
  CANCELED: "neutral",
  EXPIRED: "neutral",
  UNVERIFIED: "neutral",
  CLOSED: "neutral",
};

export function getStatusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return STATUS_TONES[status.toUpperCase()] ?? "neutral";
}

export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  const words = status.replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!words) return "—";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface StatusChipProps {
  status: string | null | undefined;
  className?: string;
}

/**
 * A soft pill for a backend status such as "UNDER_REVIEW" ("Under review").
 */
export function StatusChip({ status, className = "" }: StatusChipProps) {
  const tone = getStatusTone(status);
  const label = formatStatusLabel(status);

  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>
      {label}
    </span>
  );
}
