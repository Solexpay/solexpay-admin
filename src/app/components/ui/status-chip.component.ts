import { Component, Input } from "@angular/core";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<string, Tone> = {
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

/** A soft pill for a backend status such as "UNDER_REVIEW" ("Under review"). */
@Component({
  selector: "app-status-chip",
  standalone: true,
  template: `<span class="ui-badge" [class]="chipClass">{{ label }}</span>`,
})
export class StatusChipComponent {
  @Input() status!: string;

  get tone(): Tone {
    return TONES[(this.status ?? "").toUpperCase()] ?? "neutral";
  }

  get chipClass(): string {
    return `ui-badge-${this.tone}`;
  }

  get label(): string {
    const words = (this.status ?? "")
      .replace(/[_-]+/g, " ")
      .trim()
      .toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
