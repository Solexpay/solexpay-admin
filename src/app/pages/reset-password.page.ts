import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ToastService } from "../services/toast.service";
import { RippleDirective } from "../directives/ripple.directive";
import { ShakeOnErrorDirective } from "../directives/shake-on-error.directive";

function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get("newPassword")?.value;
  const confirm = control.get("confirmPassword")?.value;
  return password && confirm && password !== confirm
    ? { mismatch: true }
    : null;
}

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RippleDirective,
    ShakeOnErrorDirective,
  ],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <img
            src="/logo-icon.png"
            alt="Solexpay"
            class="h-20 w-auto mx-auto mb-4 object-contain drop-shadow-[0_4px_16px_rgba(0,91,191,0.25)]"
          />
          <h1 class="text-2xl font-bold text-on-surface">Solexpay</h1>
          <p class="text-sm text-on-surface-variant mt-1">Admin Portal</p>
        </div>

        <!-- Card -->
        <div
          class="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_40px_rgba(25,28,29,0.08)]"
        >
          @if (success()) {
            <div class="text-center space-y-4">
              <div
                class="w-14 h-14 rounded-full bg-[color:var(--md-sys-color-secondary-container)] flex items-center justify-center mx-auto"
              >
                <span
                  class="material-symbols-outlined text-[color:var(--md-sys-color-on-secondary-container)] text-3xl"
                  >check_circle</span
                >
              </div>
              <h2 class="text-xl font-bold text-on-surface">Password Reset</h2>
              <p class="text-sm text-on-surface-variant">
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <button
                solexRipple
                type="button"
                (click)="goToLogin()"
                class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm
                       transition-all hover:brightness-110 active:scale-95
                       shadow-[0_4px_16px_rgba(0,91,191,0.3)]"
              >
                Sign In
              </button>
            </div>
          } @else if (invalidLink()) {
            <div class="text-center space-y-4">
              <div
                class="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto"
              >
                <span
                  class="material-symbols-outlined text-on-error-container text-3xl"
                  >link_off</span
                >
              </div>
              <h2 class="text-xl font-bold text-on-surface">
                Invalid Reset Link
              </h2>
              <p class="text-sm text-on-surface-variant">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <button
                solexRipple
                type="button"
                (click)="goToLogin()"
                class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm
                       transition-all hover:brightness-110 active:scale-95
                       shadow-[0_4px_16px_rgba(0,91,191,0.3)]"
              >
                Back to Sign In
              </button>
            </div>
          } @else {
            <h2 class="text-xl font-bold text-on-surface mb-2">
              Set New Password
            </h2>
            <p class="text-sm text-on-surface-variant mb-6">
              Resetting password for
              <span class="font-medium text-on-surface">{{ email() }}</span>
            </p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
              <!-- New Password -->
              <div [shakeOnError]="newPasswordInvalid()">
                <label
                  for="newPasswordInput"
                  class="block text-sm font-medium text-on-surface-variant mb-1"
                  >New Password</label
                >
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    >lock</span
                  >
                  <input
                    id="newPasswordInput"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="newPassword"
                    autocomplete="new-password"
                    class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-10
                           transition-all duration-200 text-sm font-medium outline-none
                           focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                    [class.ring-2]="newPasswordInvalid()"
                    [class.ring-error]="newPasswordInvalid()"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm">
                      {{ showPassword() ? "visibility_off" : "visibility" }}
                    </span>
                  </button>
                </div>
                @if (newPasswordInvalid()) {
                  <p class="text-xs text-error mt-1">
                    @if (form.controls.newPassword.hasError("required")) {
                      Password is required
                    } @else if (
                      form.controls.newPassword.hasError("minlength")
                    ) {
                      Must be at least 8 characters
                    }
                  </p>
                }
              </div>

              <!-- Confirm Password -->
              <div [shakeOnError]="confirmInvalid()">
                <label
                  for="confirmPasswordInput"
                  class="block text-sm font-medium text-on-surface-variant mb-1"
                  >Confirm Password</label
                >
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    >lock_reset</span
                  >
                  <input
                    id="confirmPasswordInput"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-4
                           transition-all duration-200 text-sm font-medium outline-none
                           focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                    [class.ring-2]="confirmInvalid()"
                    [class.ring-error]="confirmInvalid()"
                    placeholder="Repeat your password"
                  />
                </div>
                @if (confirmInvalid()) {
                  <p class="text-xs text-error mt-1">Passwords do not match</p>
                }
              </div>

              <button
                solexRipple
                type="submit"
                [disabled]="isLoading()"
                class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm
                       transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_4px_16px_rgba(0,91,191,0.3)]"
              >
                @if (isLoading()) {
                  <span class="flex items-center justify-center gap-2">
                    <span
                      class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"
                    ></span>
                    Updating...
                  </span>
                } @else {
                  Reset Password
                }
              </button>
            </form>
          }
        </div>

        <p class="text-center text-xs text-on-surface-variant mt-8">
          © 2026 SolexPay. All rights reserved.
        </p>
      </div>
    </div>
  `,
})
export class ResetPasswordPageComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group(
    {
      newPassword: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
        ],
      ],
      confirmPassword: ["", Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  showPassword = signal(false);
  isLoading = signal(false);
  success = signal(false);
  invalidLink = signal(false);

  private _token = signal("");
  private _email = signal("");
  email = this._email.asReadonly();

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    if (!token || !email) {
      this.invalidLink.set(true);
      return;
    }

    this._token.set(token);
    this._email.set(email);
  }

  newPasswordInvalid() {
    const c = this.form.controls.newPassword;
    return c.invalid && c.touched;
  }

  confirmInvalid() {
    const c = this.form.controls.confirmPassword;
    return (c.touched || this.form.touched) && this.form.hasError("mismatch");
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.http
      .post<{ message: string }>("/api/auth/reset-password", {
        token: this._token(),
        email: this._email(),
        newPassword: this.form.getRawValue().newPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.success.set(true);
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          const errorObj = err as { error?: { message?: string } };
          const msg =
            errorObj.error?.message ||
            "Unable to reset password. The link may have expired.";
          if (
            msg.toLowerCase().includes("invalid") ||
            msg.toLowerCase().includes("expired")
          ) {
            this.invalidLink.set(true);
          } else {
            this.toast.show("error", msg);
          }
        },
      });
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }
}
