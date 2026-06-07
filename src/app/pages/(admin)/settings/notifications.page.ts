import { Component, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  AdminService,
  NotificationSettings,
} from "../../../services/admin.service";
import { ToastService } from "../../../services/toast.service";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-xl sm:text-2xl font-bold text-on-surface">
        Notification Preferences
      </h1>

      @if (notificationsQuery.isPending()) {
        <div class="space-y-6 animate-pulse">
          <div
            class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)] space-y-4"
          >
            <div
              class="h-6 bg-surface-container-highest rounded w-1/3 mb-2"
            ></div>
            <div class="h-12 bg-surface-container-highest rounded-xl"></div>
            <div class="h-12 bg-surface-container-highest rounded-xl"></div>
            <div class="h-12 bg-surface-container-highest rounded-xl"></div>
            <div class="h-12 bg-surface-container-highest rounded-xl"></div>
          </div>
          <div
            class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)] space-y-4"
          >
            <div
              class="h-6 bg-surface-container-highest rounded w-1/3 mb-2"
            ></div>
            <div class="h-12 bg-surface-container-highest rounded-xl"></div>
          </div>
          <div class="h-10 bg-surface-container-highest rounded-xl w-36"></div>
        </div>
      } @else {
        <div
          class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">
            Email Notifications
          </h2>
          <div class="space-y-3">
            <label
              class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-on-surface">
                  New User Registrations
                </p>
                <p class="text-xs text-on-surface-variant">
                  Get notified when new users sign up
                </p>
              </div>
              <input
                type="checkbox"
                [ngModel]="newUserRegistrations()"
                (ngModelChange)="newUserRegistrations.set($event)"
                class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
              />
            </label>

            <label
              class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-on-surface">
                  Loan Applications
                </p>
                <p class="text-xs text-on-surface-variant">
                  Get notified of new loan applications
                </p>
              </div>
              <input
                type="checkbox"
                [ngModel]="loanApplications()"
                (ngModelChange)="loanApplications.set($event)"
                class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
              />
            </label>

            <label
              class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-on-surface">
                  KYC Submissions
                </p>
                <p class="text-xs text-on-surface-variant">
                  Get notified of pending KYC verifications
                </p>
              </div>
              <input
                type="checkbox"
                [ngModel]="kycSubmissions()"
                (ngModelChange)="kycSubmissions.set($event)"
                class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
              />
            </label>

            <label
              class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-on-surface">
                  System Alerts
                </p>
                <p class="text-xs text-on-surface-variant">
                  Get notified of system errors and warnings
                </p>
              </div>
              <input
                type="checkbox"
                [ngModel]="systemAlerts()"
                (ngModelChange)="systemAlerts.set($event)"
                class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <div
          class="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.06)]"
        >
          <h2 class="text-base sm:text-lg font-bold text-on-surface mb-4">
            Push Notifications
          </h2>
          <div class="space-y-3">
            <label
              class="flex items-start sm:items-center justify-between gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-on-surface">
                  Browser Notifications
                </p>
                <p class="text-xs text-on-surface-variant">
                  Show browser push notifications
                </p>
              </div>
              <input
                type="checkbox"
                [ngModel]="browserNotifications()"
                (ngModelChange)="browserNotifications.set($event)"
                class="w-5 h-5 shrink-0 rounded border-outline text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <button
          [disabled]="updateMutation.isPending()"
          (click)="savePreferences()"
          class="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
        >
          Save Preferences
        </button>
      }
    </div>
  `,
})
export class NotificationsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  newUserRegistrations = signal(false);
  loanApplications = signal(false);
  kycSubmissions = signal(false);
  systemAlerts = signal(false);
  browserNotifications = signal(false);

  notificationsQuery = injectQuery(() => ({
    queryKey: ["notifications-settings"],
    queryFn: () => lastValueFrom(this.adminService.getNotificationSettings()),
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      lastValueFrom(this.adminService.updateNotificationSettings(settings)),
    onSuccess: () => {
      this.toast.show("success", "Notification preferences saved");
      this.queryClient.invalidateQueries({
        queryKey: ["notifications-settings"],
      });
    },
    onError: () => this.toast.show("error", "Failed to save preferences"),
  }));

  constructor() {
    effect(
      () => {
        const data = this.notificationsQuery.data();
        if (data) {
          this.newUserRegistrations.set(!!data.newUserRegistrations);
          this.loanApplications.set(!!data.loanApplications);
          this.kycSubmissions.set(!!data.kycSubmissions);
          this.systemAlerts.set(!!data.systemAlerts);
          this.browserNotifications.set(!!data.browserNotifications);
        }
      },
      { allowSignalWrites: true },
    );
  }

  savePreferences() {
    this.updateMutation.mutate({
      newUserRegistrations: this.newUserRegistrations(),
      loanApplications: this.loanApplications(),
      kycSubmissions: this.kycSubmissions(),
      systemAlerts: this.systemAlerts(),
      browserNotifications: this.browserNotifications(),
    });
  }
}
