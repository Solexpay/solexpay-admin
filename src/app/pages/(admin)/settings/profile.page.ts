import { Component, inject, signal, computed, effect } from "@angular/core";

import { FormsModule } from "@angular/forms";
import {
  injectQuery,
  injectMutation,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
  LucideKeyRound as KeyRound,
  LucideDynamicIcon,
  LucideLoaderCircle as LoaderCircle,
  LucideShieldCheck as ShieldCheck,
  LucideTriangleAlert as TriangleAlert,
  LucideUser as User,
} from "@lucide/angular";
import { AdminService, Profile } from "../../../services/admin.service";
import { ToastService } from "../../../services/toast.service";
import { PageHeaderComponent } from "../../../components/ui/page-header.component";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: "app-profile",
  imports: [FormsModule, LucideDynamicIcon, PageHeaderComponent],
  template: `
    <app-page-header
      title="Profile Settings"
      [icon]="UserIcon"
      subtitle="Manage your account details and security"
    ></app-page-header>

    <div class="space-y-4">
      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Account Information</h2>
        </div>
        <div class="ui-panel-body p-4 sm:p-5">
          @if (profileQuery.isPending()) {
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              @for (n of [1, 2, 3, 4]; track n) {
                <div class="space-y-1.5">
                  <div class="ui-skel h-3 w-20"></div>
                  <div class="ui-skel h-9 w-full"></div>
                </div>
              }
            </div>
            <div class="ui-skel mt-5 h-9 w-32"></div>
          } @else {
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label for="firstName" class="ui-label">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  class="ui-input"
                  [ngModel]="firstName()"
                  (ngModelChange)="firstName.set($event)"
                />
              </div>
              <div>
                <label for="lastName" class="ui-label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  class="ui-input"
                  [ngModel]="lastName()"
                  (ngModelChange)="lastName.set($event)"
                />
              </div>
              <div>
                <label for="email" class="ui-label">Email</label>
                <input
                  id="email"
                  type="email"
                  class="ui-input"
                  [ngModel]="email()"
                  (ngModelChange)="email.set($event)"
                  [class.border-ui-danger]="emailInvalid()"
                  [attr.aria-invalid]="emailInvalid()"
                />
                @if (emailInvalid()) {
                  <p class="mt-1.5 text-xs text-ui-danger">
                    Enter a valid email
                  </p>
                }
              </div>
              <div>
                <label for="phone" class="ui-label">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  class="ui-input"
                  [ngModel]="phone()"
                  (ngModelChange)="phone.set($event)"
                />
              </div>
            </div>
            <div class="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="ui-btn ui-btn-primary w-full sm:w-auto"
                [disabled]="!dirty() || !valid() || updateMutation.isPending()"
                (click)="saveChanges()"
              >
                @if (updateMutation.isPending()) {
                  <svg
                    [lucideIcon]="LoaderIcon"
                    [size]="15"
                    class="animate-spin"
                  ></svg>
                  Saving…
                } @else {
                  Save Changes
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
      </section>

      <section class="ui-panel">
        <div class="ui-panel-head">
          <h2 class="ui-panel-title">Security</h2>
        </div>
        <div class="ui-panel-body">
          <div
            class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <button
              type="button"
              class="ui-btn w-full sm:w-auto"
              [attr.aria-expanded]="showPasswordForm()"
              (click)="togglePasswordForm()"
            >
              <svg [lucideIcon]="KeyRoundIcon" [size]="15"></svg>
              Change Password
            </button>
            <div class="flex items-center gap-2.5">
              <svg
                [lucideIcon]="ShieldCheckIcon"
                [size]="18"
                class="text-ui-success"
              ></svg>
              <div class="min-w-0">
                <p class="text-sm font-medium text-ui-ink">
                  Two-factor authentication
                </p>
                <p class="text-xs text-ui-muted">Required for all admins</p>
              </div>
              <span class="ui-badge ui-badge-success">On</span>
            </div>
          </div>

          @if (showPasswordForm()) {
            <form
              class="space-y-4 border-t border-ui-line p-4"
              (ngSubmit)="submitPasswordChange()"
            >
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                  <label for="currentPassword" class="ui-label"
                    >Current password</label
                  >
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    autocomplete="current-password"
                    class="ui-input"
                    [ngModel]="currentPassword()"
                    (ngModelChange)="currentPassword.set($event)"
                  />
                </div>
                <div>
                  <label for="newPassword" class="ui-label">New password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autocomplete="new-password"
                    class="ui-input"
                    [ngModel]="newPassword()"
                    (ngModelChange)="newPassword.set($event)"
                    [class.border-ui-danger]="
                      newPasswordTooShort() || newPasswordSameAsCurrent()
                    "
                  />
                  @if (newPasswordTooShort()) {
                    <p class="mt-1.5 text-xs text-ui-danger">
                      Use 8–128 characters
                    </p>
                  } @else if (newPasswordSameAsCurrent()) {
                    <p class="mt-1.5 text-xs text-ui-danger">
                      New password must differ from the current one
                    </p>
                  }
                </div>
                <div>
                  <label for="confirmPassword" class="ui-label"
                    >Confirm new password</label
                  >
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    class="ui-input"
                    [ngModel]="confirmPassword()"
                    (ngModelChange)="confirmPassword.set($event)"
                    [class.border-ui-danger]="confirmMismatch()"
                  />
                  @if (confirmMismatch()) {
                    <p class="mt-1.5 text-xs text-ui-danger">
                      Passwords don't match
                    </p>
                  }
                </div>
              </div>

              @if (passwordError()) {
                <div class="ui-alert ui-alert-danger text-[13px]">
                  <svg
                    [lucideIcon]="TriangleAlertIcon"
                    [size]="16"
                    class="mt-0.5 shrink-0"
                  ></svg>
                  <span>{{ passwordError() }}</span>
                </div>
              }

              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  class="ui-btn ui-btn-primary w-full sm:w-auto"
                  [disabled]="
                    !passwordFormValid() || changePasswordMutation.isPending()
                  "
                >
                  @if (changePasswordMutation.isPending()) {
                    <svg
                      [lucideIcon]="LoaderIcon"
                      [size]="15"
                      class="animate-spin"
                    ></svg>
                    Changing…
                  } @else {
                    Update password
                  }
                </button>
                <button
                  type="button"
                  class="ui-btn ui-btn-ghost w-full sm:w-auto"
                  (click)="closePasswordForm()"
                >
                  Cancel
                </button>
              </div>
            </form>
          }
        </div>
      </section>
    </div>
  `,
})
export class ProfilePageComponent {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private queryClient = injectQueryClient();

  readonly UserIcon = User;
  readonly KeyRoundIcon = KeyRound;
  readonly LoaderIcon = LoaderCircle;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly TriangleAlertIcon = TriangleAlert;

  firstName = signal("");
  lastName = signal("");
  email = signal("");
  phone = signal("");

  loaded = signal<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  showPasswordForm = signal(false);
  currentPassword = signal("");
  newPassword = signal("");
  confirmPassword = signal("");
  passwordError = signal<string | null>(null);

  profileQuery = injectQuery(() => ({
    queryKey: ["admin-profile"],
    queryFn: () => lastValueFrom(this.adminService.getProfile()),
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (profile: Partial<Profile>) =>
      lastValueFrom(this.adminService.updateProfile(profile)),
    onSuccess: () => {
      const saved: Profile = {
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        email: this.email().trim(),
        phone: this.phone().trim(),
      };
      this.loaded.set(saved);
      this.applyProfile(saved);
      this.toast.show("success", "Profile updated successfully");
      this.queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    },
    onError: () => this.toast.show("error", "Failed to update profile"),
  }));

  changePasswordMutation = injectMutation(() => ({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      lastValueFrom(
        this.adminService.changePassword(
          values.currentPassword,
          values.newPassword,
        ),
      ),
    onSuccess: () => {
      this.toast.show("success", "Password changed");
      this.closePasswordForm();
    },
    onError: (err) => {
      this.passwordError.set(
        (err as { error?: { message?: string } })?.error?.message ||
          "Couldn't change password. Please try again.",
      );
    },
  }));

  emailInvalid = computed(() => !EMAIL_RE.test(this.email().trim()));

  valid = computed(
    () =>
      this.firstName().trim().length > 0 &&
      this.lastName().trim().length > 0 &&
      !this.emailInvalid(),
  );

  dirty = computed(() => {
    const l = this.loaded();
    return (
      this.firstName().trim() !== (l.firstName || "").trim() ||
      this.lastName().trim() !== (l.lastName || "").trim() ||
      this.email().trim() !== (l.email || "").trim() ||
      this.phone().trim() !== (l.phone || "").trim()
    );
  });

  newPasswordTooShort = computed(() => {
    const value = this.newPassword();
    return value.length > 0 && (value.length < 8 || value.length > 128);
  });

  newPasswordSameAsCurrent = computed(
    () =>
      this.newPassword().length > 0 &&
      this.newPassword() === this.currentPassword(),
  );

  confirmMismatch = computed(
    () =>
      this.confirmPassword().length > 0 &&
      this.confirmPassword() !== this.newPassword(),
  );

  passwordFormValid = computed(
    () =>
      this.currentPassword().length > 0 &&
      this.newPassword().length >= 8 &&
      this.newPassword().length <= 128 &&
      this.newPassword() !== this.currentPassword() &&
      this.confirmPassword() === this.newPassword(),
  );

  constructor() {
    effect(
      () => {
        const data = this.profileQuery.data() as Profile | undefined;
        if (data) {
          this.loaded.set(data);
          this.applyProfile(data);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private applyProfile(profile: Profile) {
    this.firstName.set(profile.firstName || "");
    this.lastName.set(profile.lastName || "");
    this.email.set(profile.email || "");
    this.phone.set(profile.phone || "");
  }

  saveChanges() {
    if (!this.dirty() || !this.valid()) return;
    this.updateMutation.mutate({
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      phone: this.phone().trim(),
    });
  }

  cancel() {
    this.applyProfile(this.loaded());
  }

  togglePasswordForm() {
    if (this.showPasswordForm()) {
      this.closePasswordForm();
    } else {
      this.passwordError.set(null);
      this.showPasswordForm.set(true);
    }
  }

  closePasswordForm() {
    this.showPasswordForm.set(false);
    this.currentPassword.set("");
    this.newPassword.set("");
    this.confirmPassword.set("");
    this.passwordError.set(null);
  }

  submitPasswordChange() {
    this.passwordError.set(null);
    if (!this.passwordFormValid()) return;
    this.changePasswordMutation.mutate({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    });
  }
}
