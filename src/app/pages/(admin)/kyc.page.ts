import { Component, inject, computed, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AdminService, KycItem } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfettiService } from "../../services/confetti.service";
import { StatusChipComponent } from "../../components/ui/status-chip.component";
import { RippleDirective } from "../../directives/ripple.directive";
import { HoverScaleDirective } from "../../directives/hover-scale.directive";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { CopyToClipboardDirective } from "../../directives/copy-to-clipboard.directive";
import { BounceOnDirective } from "../../directives/bounce-on.directive";
import { ScrollRevealDirective } from "../../directives/scroll-reveal.directive";
import { MagneticDirective } from "../../directives/magnetic.directive";

@Component({
  selector: "app-kyc",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusChipComponent,
    RippleDirective,
    HoverScaleDirective,
    TooltipDirective,
    CopyToClipboardDirective,
    BounceOnDirective,
    ScrollRevealDirective,
    MagneticDirective,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
            KYC Verification Queue
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">
            Review and approve identity verifications
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span
            class="px-3 py-1 bg-secondary-fixed rounded-full text-on-secondary-fixed-variant font-semibold"
          >
            {{ pendingCount() }} Pending
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-primary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">Total Today</p>
          <p class="text-2xl font-bold text-on-surface mt-1">
            {{ totalToday() }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-tertiary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Approved Today
          </p>
          <p class="text-2xl font-bold text-on-surface mt-1">
            {{ approvedCount() }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-error shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Rejected Today
          </p>
          <p class="text-2xl font-bold text-on-surface mt-1">
            {{ rejectedCount() }}
          </p>
        </div>
        <div
          class="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-secondary shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <p class="text-xs text-on-surface-variant uppercase">
            Avg. Review Time
          </p>
          <p class="text-2xl font-bold text-on-surface mt-1">4m</p>
        </div>
      </div>

      <!-- KYC Queue -->
      @if (loading()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (n of [1, 2, 3, 4]; track n; let i = $index) {
            <div
              class="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_12px_rgba(25,28,29,0.06)] skeleton-peak"
              [style.animation-delay]="i * 80 + 'ms'"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-full bg-surface-container-high"
                ></div>
                <div>
                  <div
                    class="h-4 w-28 bg-surface-container-high rounded-full mb-2"
                  ></div>
                  <div
                    class="h-3 w-20 bg-surface-container-high rounded-full"
                  ></div>
                </div>
              </div>
              <div class="space-y-2">
                <div
                  class="h-3 w-full bg-surface-container-high rounded-full"
                ></div>
                <div
                  class="h-3 w-full bg-surface-container-high rounded-full"
                ></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (item of kycQueue(); track item.id; let i = $index) {
            <div
              class="bg-surface-container-lowest rounded-xl p-5 shadow-[0_2px_12px_rgba(25,28,29,0.06)] animate-stagger-in opacity-0 hover-lift transition-all duration-200"
              scrollReveal
              [style.animation-delay]="i * 80 + 'ms'"
              [style.animation-fill-mode]="'forwards'"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center"
                  >
                    <span class="text-lg font-bold text-primary">{{
                      item.userName[0]
                    }}</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-on-surface">
                      {{ item.userName }}
                    </h3>
                    <p class="text-xs text-on-surface-variant">
                      User ID: {{ item.userId }}
                    </p>
                  </div>
                </div>
                <app-status-chip [status]="item.status"></app-status-chip>
              </div>

              <div class="space-y-2 mb-4">
                <div
                  class="flex items-center justify-between py-2 border-b border-surface-container"
                >
                  <span class="text-sm text-on-surface-variant"
                    >Verification Type</span
                  >
                  <span class="text-sm font-semibold text-on-surface">{{
                    item.type
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between py-2 border-b border-surface-container"
                >
                  <span class="text-sm text-on-surface-variant"
                    >Document Number</span
                  >
                  <span
                    class="text-sm font-semibold text-on-surface cursor-pointer hover:text-primary transition-colors"
                    copyToClipboard
                    tooltip="Click to copy document number"
                    tooltipPosition="left"
                    >{{ maskNumber(item.documentNumber) }}</span
                  >
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-sm text-on-surface-variant">Submitted</span>
                  <span class="text-sm font-semibold text-on-surface">{{
                    item.submittedAt | date: "short"
                  }}</span>
                </div>
              </div>

              <!-- Documents -->
              <div class="flex gap-2 mb-4">
                @for (doc of item.documents; track doc) {
                  <button
                    class="flex items-center gap-1 px-3 py-1.5 bg-surface-container rounded-lg text-xs text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm"
                      >description</span
                    >
                    {{ doc }}
                  </button>
                }
              </div>

              <!-- Actions -->
              @if (item.status === "PENDING") {
                <div class="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    solexRipple
                    magnetic
                    (click)="
                      approveMutation.mutate({
                        id: item.id,
                        userName: item.userName,
                      })
                    "
                    [disabled]="approveMutation.isPending()"
                    class="flex-1 min-w-[80px] py-2.5 bg-tertiary text-on-tertiary rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    tooltip="Approve this KYC verification"
                    tooltipPosition="bottom"
                  >
                    Approve
                  </button>
                  <button
                    solexRipple
                    magnetic
                    (click)="
                      rejectMutation.mutate({
                        id: item.id,
                        userName: item.userName,
                      })
                    "
                    [disabled]="rejectMutation.isPending()"
                    class="flex-1 min-w-[80px] py-2.5 bg-error-container text-on-error-container rounded-xl font-bold text-sm transition-all hover:bg-error hover:text-on-error active:scale-95 disabled:opacity-50"
                    tooltip="Reject this KYC verification"
                    tooltipPosition="bottom"
                  >
                    Reject
                  </button>
                  <button
                    magnetic
                    (click)="viewDetails(item)"
                    class="px-3 sm:px-4 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
                    tooltip="View detailed information"
                    tooltipPosition="bottom"
                  >
                    <span class="material-symbols-outlined text-sm"
                      >visibility</span
                    >
                  </button>
                </div>
              }
            </div>
          }

          @if (kycQueue().length === 0) {
            <div
              class="lg:col-span-2 text-center py-12 bg-surface-container-lowest rounded-xl"
            >
              <span
                class="material-symbols-outlined text-4xl text-surface-variant"
                >verified</span
              >
              <p class="text-sm text-on-surface-variant mt-2">
                No pending KYC verifications
              </p>
            </div>
          }

          @if (hasMore()) {
            <div class="lg:col-span-2 flex justify-center py-4">
              <button
                (click)="loadMore()"
                [disabled]="isLoadingMore()"
                class="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2"
              >
                @if (isLoadingMore()) {
                  <span
                    class="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></span>
                  <span>Loading...</span>
                } @else {
                  <span>Load more</span>
                  <span class="material-symbols-outlined text-sm"
                    >expand_more</span
                  >
                }
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class KycPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();
  private confetti = inject(ConfettiService);

  kycQuery = injectQuery(() => ({
    queryKey: ["kyc-queue"],
    queryFn: () => lastValueFrom(this.adminService.getKycQueue("PENDING")),
  }));

  approveMutation = injectMutation(() => ({
    mutationFn: ({ id }: { id: string; userName: string }) =>
      lastValueFrom(this.adminService.approveKyc(id)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `KYC approved for ${userName}`);
      this.confetti.success();
      this.queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    },
    onError: () => this.toast.show("error", "Failed to approve KYC"),
  }));

  rejectMutation = injectMutation(() => ({
    mutationFn: ({ id }: { id: string; userName: string }) =>
      lastValueFrom(this.adminService.rejectKyc(id)),
    onSuccess: (_, { userName }) => {
      this.toast.show("success", `KYC rejected for ${userName}`);
      this.queryClient.invalidateQueries({ queryKey: ["kyc-queue"] });
    },
    onError: () => this.toast.show("error", "Failed to reject KYC"),
  }));

  loading = computed(() => this.kycQuery.isPending());

  rawAppendedKyc = signal<KycItem[]>([]);
  rawHasMore = signal<boolean | null>(null);
  hasMore = computed(() => {
    if (this.rawHasMore() !== null) return this.rawHasMore()!;
    return this.kycQuery.data()?.hasMore ?? false;
  });
  nextCursor = signal<string | null>(null);
  isLoadingMore = signal(false);

  kycQueue = computed<KycItem[]>(() => {
    const response = this.kycQuery.data();
    const initial =
      response?.items ||
      (response as unknown as { content?: KycItem[] })?.content ||
      (Array.isArray(response) ? response : []);
    return [...initial, ...this.rawAppendedKyc()];
  });

  pendingCount = computed(
    () => this.kycQueue().filter((k) => k.status === "PENDING").length,
  );
  totalToday = computed(() => this.kycQueue().length);
  approvedCount = computed(
    () => this.kycQueue().filter((k) => k.status === "APPROVED").length,
  );
  rejectedCount = computed(
    () => this.kycQueue().filter((k) => k.status === "REJECTED").length,
  );

  maskNumber(number: string): string {
    if (number.length <= 4) return number;
    return "*".repeat(number.length - 4) + number.slice(-4);
  }

  loadMore() {
    const cursor = this.nextCursor() ?? this.kycQuery.data()?.nextCursor;
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.adminService
      .getKycQueue({
        status: "PENDING",
        limit: 20,
        cursor,
      })
      .subscribe({
        next: (res) => {
          this.rawAppendedKyc.update((prev) => [...prev, ...(res.items || [])]);
          this.nextCursor.set(res.nextCursor);
          this.rawHasMore.set(res.hasMore);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.isLoadingMore.set(false);
          this.toast.show("error", "Failed to load more KYC submissions");
        },
      });
  }

  viewDetails(item: KycItem) {
    this.toast.show("info", `Viewing details for ${item.userName}`);
  }
}
