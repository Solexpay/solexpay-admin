import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { AuthService, TOTPEnrollResponse } from "../services/auth.service";
import { ToastService } from "../services/toast.service";
import { RippleDirective } from "../directives/ripple.directive";
import { ShakeOnErrorDirective } from "../directives/shake-on-error.directive";
import { GlowEffectDirective } from "../directives/glow-effect.directive";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

function emailValidator(control: AbstractControl) {
  const v = control.value as string;
  return v && !EMAIL_RE.test(v) ? { invalidEmail: true } : null;
}

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RippleDirective,
    ShakeOnErrorDirective,
    GlowEffectDirective,
  ],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors mb-5"
        >
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

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

        @if (isEnrolling()) {
          <!-- TOTP Enrollment Card -->
          <div
            class="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_40px_rgba(25,28,29,0.08)] animate-modal-scale-in"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="material-symbols-outlined text-primary text-2xl"
                >security</span
              >
              <h2 class="text-xl font-bold text-on-surface">
                Setup Two-Factor Auth
              </h2>
            </div>
            <p class="text-sm text-on-surface-variant mb-6">
              Two-factor authentication is required. Add this secret or URL to
              your authenticator app (Google Authenticator, Authy, etc.) to
              continue.
            </p>

            @if (enrollData(); as data) {
              <!-- Secret Box -->
              <div class="bg-surface-container rounded-xl p-4 mb-4">
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                    >Secret Key</span
                  >
                  <button
                    type="button"
                    (click)="
                      copyToClipboard(
                        data.secret,
                        'Secret copied to clipboard!'
                      )
                    "
                    class="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-xs"
                      >content_copy</span
                    >
                    Copy
                  </button>
                </div>
                <p
                  class="font-mono text-sm text-on-surface font-semibold select-all break-all"
                >
                  {{ data.secret }}
                </p>
              </div>

              <!-- OTPAuth URL Box -->
              <div class="bg-surface-container rounded-xl p-4 mb-6">
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                    >otpauth URL</span
                  >
                  <button
                    type="button"
                    (click)="
                      copyToClipboard(
                        data.otpauthUrl,
                        'URL copied to clipboard!'
                      )
                    "
                    class="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-xs"
                      >content_copy</span
                    >
                    Copy
                  </button>
                </div>
                <p
                  class="font-mono text-xs text-on-surface-variant select-all break-all line-clamp-3"
                >
                  {{ data.otpauthUrl }}
                </p>
              </div>

              <!-- Confirm with Code -->
              <div class="space-y-4">
                <div>
                  <label
                    for="enrollCodeInput"
                    class="block text-sm font-medium text-on-surface-variant mb-1"
                  >
                    Enter 6-digit Code from App
                  </label>
                  <input
                    id="enrollCodeInput"
                    type="text"
                    maxlength="6"
                    [ngModel]="enrollConfirmCode()"
                    (ngModelChange)="enrollConfirmCode.set($event)"
                    class="w-full bg-surface-container-highest rounded-xl py-3 px-4 text-center text-xl font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="000000"
                  />
                </div>

                <button
                  solexRipple
                  type="button"
                  (click)="confirmEnrollment()"
                  [disabled]="
                    isConfirmingEnroll() ||
                    enrollConfirmCode().trim().length !== 6
                  "
                  class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
                >
                  @if (isConfirmingEnroll()) {
                    <span>Verifying...</span>
                  } @else {
                    <span>Confirm & Finish Sign In</span>
                  }
                </button>

                <button
                  type="button"
                  (click)="cancelEnrollment()"
                  class="w-full py-2.5 bg-surface-container text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              </div>
            } @else {
              <div class="text-center py-8">
                <span
                  class="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
                ></span>
                <p class="text-sm text-on-surface-variant mt-2">
                  Loading enrollment details...
                </p>
              </div>
            }
          </div>
        } @else {
          <!-- Login Card -->
          <div
            class="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_40px_rgba(25,28,29,0.08)]"
          >
            <h2 class="text-xl font-bold text-on-surface mb-6">Sign In</h2>

            <form [formGroup]="form" (ngSubmit)="login()" class="space-y-4">
              <!-- Email -->
              <div [shakeOnError]="emailInvalid()">
                <label
                  for="emailInput"
                  class="block text-sm font-medium text-on-surface-variant mb-1"
                  >Email Address</label
                >
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    >email</span
                  >
                  <input
                    id="emailInput"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-4
                           transition-all duration-200 text-sm font-medium outline-none
                           focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 animate-focus-ring"
                    placeholder="admin&#64;solexpay.com"
                    [class.ring-2]="emailInvalid()"
                    [class.ring-error]="emailInvalid()"
                  />
                </div>
                @if (emailInvalid()) {
                  <p class="text-xs text-error mt-1">{{ emailError() }}</p>
                } @else if (showEmailHelperWarning()) {
                  <p
                    class="mt-1.5 text-xs text-amber-700 bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <span class="material-symbols-outlined text-sm"
                      >warning</span
                    >
                    Use format like name&#64;school.edu.ng
                  </p>
                }
              </div>

              <!-- Password -->
              <div [shakeOnError]="passwordInvalid()">
                <label
                  for="passwordInput"
                  class="block text-sm font-medium text-on-surface-variant mb-1"
                  >Password</label
                >
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    >lock</span
                  >
                  <input
                    id="passwordInput"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
                    (focus)="passwordFocused.set(true)"
                    (blur)="passwordFocused.set(false)"
                    class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-10
                           transition-all duration-200 text-sm font-medium outline-none
                           focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                    [class.ring-2]="passwordInvalid()"
                    [class.ring-error]="passwordInvalid()"
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
                @if (passwordInvalid()) {
                  <p class="text-xs text-error mt-1">{{ passwordError() }}</p>
                } @else {
                  <!-- Strength hint shown while typing -->
                  @if (
                    passwordFocused() &&
                    passwordLength() > 0 &&
                    passwordLength() < 8
                  ) {
                    <div class="mt-1.5 flex items-center gap-2">
                      <div class="flex gap-0.5 flex-1">
                        @for (n of [1, 2, 3, 4]; track n) {
                          <div
                            class="h-1 flex-1 rounded-full transition-colors duration-200"
                            [class]="
                              n <= passwordStrengthBars()
                                ? strengthBarColor()
                                : 'bg-surface-container-high'
                            "
                          ></div>
                        }
                      </div>
                      <span class="text-xs" [class]="strengthTextColor()">{{
                        passwordStrengthLabel()
                      }}</span>
                    </div>
                  }
                }
                @if (!passwordFocused() && !passwordInvalid()) {
                  <p class="text-xs text-on-surface-variant mt-1">
                    Must be 8–128 characters
                  </p>
                }
              </div>

              <!-- TOTP Code (Optional/If enabled) -->
              <div>
                <label
                  for="totpInput"
                  class="block text-sm font-medium text-on-surface-variant mb-1"
                >
                  Authenticator Code
                  <span class="text-xs text-on-surface-variant font-normal"
                    >(if configured)</span
                  >
                </label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    >phonelink_lock</span
                  >
                  <input
                    id="totpInput"
                    type="text"
                    maxlength="6"
                    formControlName="totpCode"
                    autocomplete="one-time-code"
                    class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-4
                           transition-all duration-200 text-sm font-medium outline-none
                           focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 font-mono tracking-wider"
                    placeholder="6-digit code"
                  />
                </div>
              </div>

              <!-- Failed login warning -->
              @if (
                failedAttempts() >= 3 && failedAttempts() < LOCKOUT_THRESHOLD
              ) {
                <div
                  class="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800"
                >
                  <span
                    class="material-symbols-outlined text-[16px] text-amber-600 mt-0.5 shrink-0"
                    >warning</span
                  >
                  <span>
                    {{ LOCKOUT_THRESHOLD - failedAttempts() }} attempt{{
                      LOCKOUT_THRESHOLD - failedAttempts() === 1 ? "" : "s"
                    }}
                    remaining before your account is temporarily locked.
                  </span>
                </div>
              }
              @if (isLockedOut()) {
                <div
                  class="flex items-start gap-2.5 bg-error-container border border-error/20 rounded-xl px-3 py-2.5 text-xs text-on-error-container"
                >
                  <span
                    class="material-symbols-outlined text-[16px] mt-0.5 shrink-0"
                    >lock</span
                  >
                  <span>
                    Too many failed attempts. Please wait
                    {{ lockoutMinutesLeft() }} minute{{
                      lockoutMinutesLeft() === 1 ? "" : "s"
                    }}
                    before trying again.
                  </span>
                </div>
              }

              <!-- Role Toggle -->
              <div class="flex gap-2 p-1 bg-surface-container rounded-xl">
                <button
                  type="button"
                  (click)="role.set('ADMIN')"
                  class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                  [class]="
                    role() === 'ADMIN'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  "
                >
                  Admin
                </button>
                <button
                  type="button"
                  (click)="role.set('SCHOOL')"
                  class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                  [class]="
                    role() === 'SCHOOL'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  "
                >
                  School
                </button>
              </div>

              <!-- Submit -->
              <button
                solexRipple
                glowEffect="always"
                type="submit"
                [disabled]="isLoading() || isLockedOut()"
                class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm
                       transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_4px_16px_rgba(0,91,191,0.3)]"
              >
                @if (isLoading()) {
                  <span class="flex items-center justify-center gap-2">
                    <span
                      class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"
                    ></span>
                    Signing in...
                  </span>
                } @else if (isLockedOut()) {
                  Account Locked — Try Again Later
                } @else {
                  Sign In
                }
              </button>
            </form>

            <!-- Links -->
            <div
              class="mt-6 flex items-center justify-between text-xs text-on-surface-variant"
            >
              <span>Secure 256-bit encrypted login</span>
              <span>Two-factor protected</span>
            </div>
          </div>
        }

        <!-- Footer -->
        <p class="text-center text-xs text-on-surface-variant mt-8">
          © 2026 SolexPay. All rights reserved.
        </p>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  readonly LOCKOUT_THRESHOLD = LOCKOUT_THRESHOLD;

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: [
      "",
      [Validators.required, Validators.maxLength(320), emailValidator],
    ],
    password: [
      "",
      [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    ],
    totpCode: [""],
  });

  showPassword = signal(false);
  isLoading = signal(false);
  role = signal<"ADMIN" | "SCHOOL">("ADMIN");
  passwordFocused = signal(false);

  failedAttempts = signal(0);
  private lockoutUntil = signal<number | null>(null);

  isEnrolling = signal(false);
  enrollmentToken = signal<string | null>(null);
  enrollData = signal<TOTPEnrollResponse | null>(null);
  enrollConfirmCode = signal("");
  isConfirmingEnroll = signal(false);

  isLockedOut = computed(() => {
    const until = this.lockoutUntil();
    return until !== null && Date.now() < until;
  });

  lockoutMinutesLeft = computed(() => {
    const until = this.lockoutUntil();
    if (!until) return 0;
    return Math.ceil((until - Date.now()) / 60000);
  });

  private get emailCtrl() {
    return this.form.controls.email;
  }
  private get passwordCtrl() {
    return this.form.controls.password;
  }

  emailInvalid = computed(
    () => this.emailCtrl.invalid && this.emailCtrl.touched,
  );
  showEmailHelperWarning = computed(() => {
    const value = (this.emailCtrl.value || "").trim();
    return value.length > 0 && !EMAIL_RE.test(value) && !this.emailCtrl.touched;
  });
  emailError = computed(() => {
    if (this.emailCtrl.hasError("required")) return "Email is required";
    if (this.emailCtrl.hasError("invalidEmail"))
      return "Enter a valid email address";
    return null;
  });

  passwordInvalid = computed(
    () => this.passwordCtrl.invalid && this.passwordCtrl.touched,
  );
  passwordError = computed(() => {
    if (this.passwordCtrl.hasError("required")) return "Password is required";
    if (this.passwordCtrl.hasError("minlength"))
      return "Password must be at least 8 characters";
    return null;
  });

  passwordLength = computed(() => (this.passwordCtrl.value || "").length);

  passwordStrengthBars = computed(() => {
    const len = this.passwordLength();
    if (len === 0) return 0;
    if (len < 4) return 1;
    if (len < 6) return 2;
    if (len < 8) return 3;
    return 4;
  });

  passwordStrengthLabel = computed(() => {
    const bars = this.passwordStrengthBars();
    return ["", "Weak", "Fair", "Almost", "Ready"][bars];
  });

  strengthBarColor = computed(() => {
    const bars = this.passwordStrengthBars();
    if (bars <= 1) return "bg-error";
    if (bars === 2) return "bg-amber-400";
    if (bars === 3) return "bg-yellow-400";
    return "bg-tertiary";
  });

  strengthTextColor = computed(() => {
    const bars = this.passwordStrengthBars();
    if (bars <= 1) return "text-error";
    if (bars === 2) return "text-amber-600";
    if (bars === 3) return "text-yellow-600";
    return "text-tertiary";
  });

  goBack() {
    this.router.navigate(["/"]);
  }

  copyToClipboard(text: string, msg: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.toast.show("success", msg);
    }
  }

  cancelEnrollment() {
    this.isEnrolling.set(false);
    this.enrollmentToken.set(null);
    this.enrollData.set(null);
    this.enrollConfirmCode.set("");
  }

  confirmEnrollment() {
    const token = this.enrollmentToken();
    const code = this.enrollConfirmCode().trim();
    if (!token || code.length !== 6) return;

    this.isConfirmingEnroll.set(true);
    this.auth.confirmTotp(token, code).subscribe({
      next: () => {
        this.isConfirmingEnroll.set(false);
        this.isEnrolling.set(false);
        this.toast.show(
          "success",
          "Two-factor authentication configured! Welcome.",
        );
        this.router.navigate(["/dashboard"]);
      },
      error: (err) => {
        this.isConfirmingEnroll.set(false);
        this.toast.show(
          "error",
          err.error?.message || "Invalid verification code. Please try again.",
        );
      },
    });
  }

  login() {
    if (this.isLockedOut()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password, totpCode } = this.form.getRawValue();
    this.isLoading.set(true);

    this.auth
      .login(
        {
          email,
          password,
          totpCode: totpCode.trim() || undefined,
        },
        this.role(),
      )
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if ("enrollmentRequired" in response && response.enrollmentRequired) {
            this.enrollmentToken.set(response.enrollmentToken);
            this.isEnrolling.set(true);
            this.auth.enrollTotp(response.enrollmentToken).subscribe({
              next: (data) => this.enrollData.set(data),
              error: (err) =>
                this.toast.show(
                  "error",
                  err.error?.message ||
                    "Failed to load TOTP enrollment details",
                ),
            });
            return;
          }

          this.failedAttempts.set(0);
          this.lockoutUntil.set(null);
          this.toast.show("success", "Welcome back!");
          this.router.navigate(["/dashboard"]);
        },
        error: (err) => {
          this.isLoading.set(false);
          const attempts = this.failedAttempts() + 1;
          this.failedAttempts.set(attempts);
          if (attempts >= LOCKOUT_THRESHOLD) {
            this.lockoutUntil.set(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            this.toast.show(
              "error",
              `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
            );
          } else {
            this.toast.show(
              "error",
              err.error?.message || "Invalid credentials",
            );
          }
        },
      });
  }
}
