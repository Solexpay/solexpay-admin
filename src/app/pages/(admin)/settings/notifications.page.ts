import { Component, inject, signal, computed, effect } from "@angular/core";

import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideDynamicIcon,
  LucideBell as Bell,
  LucideLoaderCircle as LoaderCircle,
} from "@lucide/angular";
import {
  AdminService,
  NotificationSettings,
} from "../../../services/admin.service";
import { ToastService } from "../../../services/toast.service";
import { PageHeaderComponent } from "../../../components/ui/page-header.component";

@Component({
  selector: "app-notifications",
  imports: [FormsModule, LucideDynamicIcon, PageHeaderComponent],
  template: `
    <app-page-header
      title="Notification Preferences"
      [icon]="BellIcon"
      subtitle="Choose what you want to be notified about"
    ></app-page-header>

    <div class="space-y-4">
      @if (notificationsQuery.isPending()) {
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Email Notifications</h2>
          </div>
          <div class="ui-panel-body space-y-3 p-4">
            <div class="ui-skel h-9 w-full"></div>
            <div class="ui-skel h-9 w-full"></div>
            <div class="ui-skel h-9 w-full"></div>
            <div class="ui-skel h-9 w-full"></div>
          </div>
        </section>
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Push Notifications</h2>
          </div>
          <div class="ui-panel-body p-4">
            <div class="ui-skel h-9 w-full"></div>
          </div>
        </section>
        <div class="ui-skel h-9 w-36"></div>
      } @else {
        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Email Notifications</h2>
          </div>
          <div class="ui-panel-body divide-y divide-ui-line">
            <label
              class="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ui-ink">
                  New User Registrations
                </p>
                <p class="text-xs text-ui-muted">
                  Get notified when new users sign up
                </p>
              </div>
              <input
                type="checkbox"
                role="switch"
                [attr.aria-checked]="newUserRegistrations()"
                [ngModel]="newUserRegistrations()"
                (ngModelChange)="newUserRegistrations.set($event)"
                class="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent"
              />
            </label>

            <label
              class="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ui-ink">Loan Applications</p>
                <p class="text-xs text-ui-muted">
                  Get notified of new loan applications
                </p>
              </div>
              <input
                type="checkbox"
                role="switch"
                [attr.aria-checked]="loanApplications()"
                [ngModel]="loanApplications()"
                (ngModelChange)="loanApplications.set($event)"
                class="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent"
              />
            </label>

            <label
              class="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ui-ink">KYC Submissions</p>
                <p class="text-xs text-ui-muted">
                  Get notified of pending KYC verifications
                </p>
              </div>
              <input
                type="checkbox"
                role="switch"
                [attr.aria-checked]="kycSubmissions()"
                [ngModel]="kycSubmissions()"
                (ngModelChange)="kycSubmissions.set($event)"
                class="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent"
              />
            </label>

            <label
              class="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ui-ink">System Alerts</p>
                <p class="text-xs text-ui-muted">
                  Get notified of system errors and warnings
                </p>
              </div>
              <input
                type="checkbox"
                role="switch"
                [attr.aria-checked]="systemAlerts()"
                [ngModel]="systemAlerts()"
                (ngModelChange)="systemAlerts.set($event)"
                class="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent"
              />
            </label>
          </div>
        </section>

        <section class="ui-panel">
          <div class="ui-panel-head">
            <h2 class="ui-panel-title">Push Notifications</h2>
          </div>
          <div class="ui-panel-body">
            <label
              class="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ui-ink">
                  Browser Notifications
                </p>
                <p class="text-xs text-ui-muted">
                  {{
                    browserNotificationsSupported
                      ? "Show browser push notifications"
                      : "Not supported in this browser"
                  }}
                </p>
              </div>
              <input
                type="checkbox"
                role="switch"
                [attr.aria-checked]="browserNotifications()"
                [ngModel]="browserNotifications()"
                (ngModelChange)="setBrowserNotifications($event)"
                [disabled]="!browserNotificationsSupported"
                class="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
          </div>
        </section>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="ui-btn ui-btn-primary w-full sm:w-auto"
            [disabled]="!dirty() || updateMutation.isPending()"
            (click)="savePreferences()"
          >
            @if (updateMutation.isPending()) {
              <svg
                [lucideIcon]="LoaderIcon"
                [size]="15"
                class="animate-spin"
              ></svg>
              Saving…
            } @else {
              Save Preferences
            }
          </button>
          @if (dirty()) {
            <button
              type="button"
              class="ui-btn ui-btn-ghost w-full sm:w-auto"
              (click)="cancel()"
            >
              Cancel
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsPageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  readonly BellIcon = Bell;
  readonly LoaderIcon = LoaderCircle;

  readonly browserNotificationsSupported = typeof Notification !== "undefined";

  newUserRegistrations = signal(false);
  loanApplications = signal(false);
  kycSubmissions = signal(false);
  systemAlerts = signal(false);
  browserNotifications = signal(false);

  loaded = signal<NotificationSettings>({
    newUserRegistrations: false,
    loanApplications: false,
    kycSubmissions: false,
    systemAlerts: false,
    browserNotifications: false,
  });

  notificationsQuery = injectQuery(() => ({
    queryKey: ["notifications-settings"],
    queryFn: () => lastValueFrom(this.adminService.getNotificationSettings()),
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      lastValueFrom(this.adminService.updateNotificationSettings(settings)),
    onSuccess: () => {
      this.loaded.set(this.currentSettings());
      this.toast.show("success", "Notification preferences saved");
      this.queryClient.invalidateQueries({
        queryKey: ["notifications-settings"],
      });
    },
    onError: () => this.toast.show("error", "Failed to save preferences"),
  }));

  dirty = computed(() => {
    const l = this.loaded();
    return (
      this.newUserRegistrations() !== l.newUserRegistrations ||
      this.loanApplications() !== l.loanApplications ||
      this.kycSubmissions() !== l.kycSubmissions ||
      this.systemAlerts() !== l.systemAlerts ||
      this.browserNotifications() !== l.browserNotifications
    );
  });

  constructor() {
    effect(
      () => {
        const data = this.notificationsQuery.data();
        if (data) {
          this.loaded.set(data);
          this.applySettings(data);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private currentSettings(): NotificationSettings {
    return {
      newUserRegistrations: this.newUserRegistrations(),
      loanApplications: this.loanApplications(),
      kycSubmissions: this.kycSubmissions(),
      systemAlerts: this.systemAlerts(),
      browserNotifications: this.browserNotifications(),
    };
  }

  private applySettings(settings: NotificationSettings) {
    this.newUserRegistrations.set(!!settings.newUserRegistrations);
    this.loanApplications.set(!!settings.loanApplications);
    this.kycSubmissions.set(!!settings.kycSubmissions);
    this.systemAlerts.set(!!settings.systemAlerts);
    this.browserNotifications.set(!!settings.browserNotifications);
  }

  async setBrowserNotifications(enabled: boolean) {
    if (!enabled) {
      this.browserNotifications.set(false);
      return;
    }
    if (!this.browserNotificationsSupported) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      this.browserNotifications.set(false);
      this.toast.show(
        "error",
        "Your browser blocked notifications for this site. Allow them in the browser's site settings.",
      );
      return;
    }
    this.browserNotifications.set(true);
  }

  cancel() {
    this.applySettings(this.loaded());
  }

  savePreferences() {
    if (!this.dirty()) return;
    this.updateMutation.mutate(this.currentSettings());
  }
}
