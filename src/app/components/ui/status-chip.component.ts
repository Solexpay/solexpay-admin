import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-status-chip",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide
                 transition-transform duration-200"
      [class]="chipClass"
    >
      {{ status }}
    </span>
  `,
})
export class StatusChipComponent {
  @Input() status!: string;

  get chipClass(): string {
    const statusMap: Record<string, string> = {
      SUCCESS: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      ACTIVE: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      APPROVED: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      VERIFIED: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      PENDING: "bg-secondary-fixed text-on-secondary-fixed-variant",
      PROCESSING: "bg-secondary-fixed text-on-secondary-fixed-variant",
      UNDER_REVIEW: "bg-secondary-fixed text-on-secondary-fixed-variant",
      FAILED: "bg-error-container text-on-error-container",
      REJECTED: "bg-error-container text-on-error-container",
      SUSPENDED: "bg-error-container text-on-error-container",
      OVERDUE: "bg-error-container text-on-error-container",
      INACTIVE: "bg-surface-container-high text-on-surface-variant",
    };

    return (
      statusMap[this.status] ||
      "bg-surface-container-high text-on-surface-variant"
    );
  }
}
