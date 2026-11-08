import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";

import { ActivatedRoute, Router } from "@angular/router";
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import {
  LucideDynamicIcon,
  LucideCopy as Copy,
  LucideEye as Eye,
  LucideEyeOff as EyeOff,
  LucideLoaderCircle as LoaderCircle,
  LucideLock as Lock,
  LucideMail as Mail,
  LucideShieldCheck as ShieldCheck,
  LucideSmartphone as Smartphone,
  LucideTriangleAlert as TriangleAlert,
} from "@lucide/angular";
import { AuthService, TOTPEnrollResponse } from "../services/auth.service";
import { ToastService } from "../services/toast.service";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

function emailValidator(control: AbstractControl) {
  const v = control.value as string;
  return v && !EMAIL_RE.test(v) ? { invalidEmail: true } : null;
}

@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, FormsModule, LucideDynamicIcon],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-ui-frame p-4">
      <div class="w-full max-w-[400px]">
        <div
          class="w-full max-w-[400px] rounded-2xl border border-ui-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-8"
        >
          <!-- Brand -->
          <div class="mb-6 flex items-center gap-3">
            <img src="/logo-icon.png" alt="" class="h-8 w-9 object-contain" />
            <div class="min-w-0 leading-tight">
              <p class="text-[15px] font-semibold text-ui-ink">SolexPay</p>
              <p class="text-xs text-ui-muted">Operations console</p>
            </div>
          </div>

          @if (isEnrolling()) {
            <!-- TOTP enrolment -->
            <div class="flex items-center gap-2">
              <svg
                [lucideIcon]="ShieldCheckIcon"
                [size]="18"
                class="text-ui-accent"
              ></svg>
              <h1 class="text-lg font-semibold text-ui-ink">
                Setup Two-Factor Auth
              </h1>
            </div>
            <p class="mb-5 mt-1 text-[13px] text-ui-muted">
              Two-factor authentication is required. Add this secret or URL to
              your authenticator app (Google Authenticator, Authy, etc.) to
              continue.
            </p>

            @if (enrollData(); as data) {
              <div
                class="mb-5 space-y-4 rounded-xl border border-ui-line bg-ui-rail p-4"
              >
                <div>
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <span class="text-xs font-medium text-ui-muted"
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
                      class="ui-btn ui-btn-ghost ui-btn-sm h-7 px-2 text-ui-accent"
                    >
                      <svg [lucideIcon]="CopyIcon" [size]="14"></svg>
                      Copy
                    </button>
                  </div>
                  <code
                    class="block select-all break-all text-xs font-semibold text-ui-ink"
                    >{{ data.secret }}</code
                  >
                </div>

                <div class="border-t border-ui-line pt-4">
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <span class="text-xs font-medium text-ui-muted"
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
                      class="ui-btn ui-btn-ghost ui-btn-sm h-7 px-2 text-ui-accent"
                    >
                      <svg [lucideIcon]="CopyIcon" [size]="14"></svg>
                      Copy
                    </button>
                  </div>
                  <code
                    class="block select-all break-all text-xs text-ui-body"
                    >{{ data.otpauthUrl }}</code
                  >
                </div>
              </div>

              <div class="space-y-3">
                <div>
                  <label for="enrollCodeInput" class="ui-label">
                    Enter 6-digit Code from App
                  </label>
                  <input
                    #enrollCodeInput
                    id="enrollCodeInput"
                    type="text"
                    maxlength="6"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    [ngModel]="enrollConfirmCode()"
                    (ngModelChange)="onEnrollCodeChange($event)"
                    class="ui-input h-11 text-center font-mono text-lg tracking-[0.4em]"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="button"
                  (click)="confirmEnrollment()"
                  [disabled]="
                    isConfirmingEnroll() ||
                    enrollConfirmCode().trim().length !== 6
                  "
                  class="ui-btn ui-btn-primary h-10 w-full"
                >
                  @if (isConfirmingEnroll()) {
                    <svg
                      [lucideIcon]="LoaderIcon"
                      [size]="16"
                      class="animate-spin"
                    ></svg>
                    <span>Verifying...</span>
                  } @else {
                    <span>Confirm & Finish Sign In</span>
                  }
                </button>

                <button
                  type="button"
                  (click)="cancelEnrollment()"
                  class="ui-btn ui-btn-ghost h-10 w-full"
                >
                  Cancel
                </button>
              </div>
            } @else {
              <div
                class="flex flex-col items-center gap-2 py-8 text-center text-[13px] text-ui-muted"
              >
                <svg
                  [lucideIcon]="LoaderIcon"
                  [size]="20"
                  class="animate-spin text-ui-accent"
                ></svg>
                <p>Loading enrollment details...</p>
              </div>
            }
          } @else {
            <!-- Sign in -->
            <h1 class="mb-4 text-lg font-semibold text-ui-ink">Sign In</h1>

            @if (reasonMessage(); as message) {
              <div class="mb-4 ui-alert ui-alert-info text-[13px]">
                <svg
                  [lucideIcon]="ShieldCheckIcon"
                  [size]="16"
                  class="mt-0.5 shrink-0"
                ></svg>
                <span>{{ message }}</span>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="login()" class="space-y-4">
              <!-- Role switch -->
              <div class="rounded-lg bg-ui-sunken p-1">
                <div class="ui-tabs" role="group" aria-label="Sign in as">
                  <button
                    type="button"
                    (click)="role.set('ADMIN')"
                    class="ui-tab flex-1 justify-center"
                    [class.ui-tab-active]="role() === 'ADMIN'"
                    [attr.aria-pressed]="role() === 'ADMIN'"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    (click)="role.set('SCHOOL')"
                    class="ui-tab flex-1 justify-center"
                    [class.ui-tab-active]="role() === 'SCHOOL'"
                    [attr.aria-pressed]="role() === 'SCHOOL'"
                  >
                    School
                  </button>
                </div>
              </div>

              <!-- Email -->
              <div>
                <label for="emailInput" class="ui-label">Email Address</label>
                <div class="relative">
                  <svg
                    [lucideIcon]="MailIcon"
                    [size]="15"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-faint"
                  ></svg>
                  <input
                    #emailInput
                    id="emailInput"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="ui-input h-10 pl-9"
                    placeholder="admin&#64;solexpay.com"
                    [class.border-ui-danger]="emailInvalid()"
                    [attr.aria-invalid]="emailInvalid()"
                  />
                </div>
                @if (emailInvalid()) {
                  <p class="mt-1.5 text-xs text-ui-danger">
                    {{ emailError() }}
                  </p>
                } @else if (showEmailHelperWarning()) {
                  <p
                    class="mt-1.5 flex items-center gap-1.5 text-xs text-ui-warning"
                  >
                    <svg [lucideIcon]="TriangleAlertIcon" [size]="13"></svg>
                    Use format like name&#64;school.edu.ng
                  </p>
                }
              </div>

              <!-- Password -->
              <div>
                <label for="passwordInput" class="ui-label">Password</label>
                <div class="relative">
                  <svg
                    [lucideIcon]="LockIcon"
                    [size]="15"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-faint"
                  ></svg>
                  <input
                    id="passwordInput"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
                    (focus)="passwordFocused.set(true)"
                    (blur)="passwordFocused.set(false)"
                    (keydown)="onPasswordKey($event)"
                    (keyup)="onPasswordKey($event)"
                    class="ui-input h-10 pl-9 pr-10"
                    [class.border-ui-danger]="passwordInvalid()"
                    [attr.aria-invalid]="passwordInvalid()"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="ui-icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                    [attr.aria-label]="
                      showPassword() ? 'Hide password' : 'Show password'
                    "
                  >
                    <svg
                      [lucideIcon]="showPassword() ? EyeOffIcon : EyeIcon"
                      [size]="15"
                    ></svg>
                  </button>
                </div>
                @if (passwordInvalid()) {
                  <p class="mt-1.5 text-xs text-ui-danger">
                    {{ passwordError() }}
                  </p>
                } @else {
                  <!-- Strength hint shown while typing -->
                  @if (
                    passwordFocused() &&
                    passwordLength() > 0 &&
                    passwordLength() < 8
                  ) {
                    <div class="mt-1.5 flex items-center gap-2">
                      <div class="flex flex-1 gap-0.5">
                        @for (n of [1, 2, 3, 4]; track n) {
                          <div
                            class="h-1 flex-1 rounded-full transition-colors"
                            [class]="
                              n <= passwordStrengthBars()
                                ? strengthBarColor()
                                : 'bg-ui-line'
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
                  <p class="mt-1.5 text-xs text-ui-muted">
                    Must be 8–128 characters
                  </p>
                }
                @if (capsLock()) {
                  <p
                    class="mt-1.5 flex items-center gap-1.5 text-xs text-ui-warning"
                  >
                    <svg [lucideIcon]="TriangleAlertIcon" [size]="13"></svg>
                    Caps Lock is on
                  </p>
                }
              </div>

              <!-- TOTP code (if enabled) -->
              <div>
                <label for="totpInput" class="ui-label">
                  Authenticator Code
                  <span class="font-normal text-ui-muted">(if configured)</span>
                </label>
                <div class="relative">
                  <svg
                    [lucideIcon]="SmartphoneIcon"
                    [size]="15"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-faint"
                  ></svg>
                  <input
                    id="totpInput"
                    type="text"
                    maxlength="6"
                    inputmode="numeric"
                    formControlName="totpCode"
                    autocomplete="one-time-code"
                    class="ui-input h-10 pl-9 font-mono tracking-wider"
                    placeholder="6-digit code"
                  />
                </div>
              </div>

              <!-- Failed login warning -->
              @if (
                failedAttempts() >= 3 && failedAttempts() < LOCKOUT_THRESHOLD
              ) {
                <div class="ui-alert ui-alert-warning text-[13px]">
                  <svg
                    [lucideIcon]="TriangleAlertIcon"
                    [size]="16"
                    class="mt-0.5 shrink-0"
                  ></svg>
                  <span>
                    {{ LOCKOUT_THRESHOLD - failedAttempts() }} attempt{{
                      LOCKOUT_THRESHOLD - failedAttempts() === 1 ? "" : "s"
                    }}
                    remaining before your account is temporarily locked.
                  </span>
                </div>
              }
              @if (isLockedOut()) {
                <div class="ui-alert ui-alert-danger text-[13px]">
                  <svg
                    [lucideIcon]="LockIcon"
                    [size]="16"
                    class="mt-0.5 shrink-0"
                  ></svg>
                  <span>
                    Too many failed attempts. Please wait
                    {{ lockoutMinutesLeft() }} minute{{
                      lockoutMinutesLeft() === 1 ? "" : "s"
                    }}
                    before trying again.
                  </span>
                </div>
              }

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="isLoading() || isLockedOut()"
                class="ui-btn ui-btn-primary h-10 w-full"
              >
                @if (isLoading()) {
                  <svg
                    [lucideIcon]="LoaderIcon"
                    [size]="16"
                    class="animate-spin"
                  ></svg>
                  Signing in...
                } @else if (isLockedOut()) {
                  Account Locked — Try Again Later
                } @else {
                  Sign In
                }
              </button>
            </form>
          }
        </div>

        <p class="mt-5 text-center text-xs text-ui-muted">
          Private console · staff only
        </p>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  readonly LOCKOUT_THRESHOLD = LOCKOUT_THRESHOLD;

  readonly CopyIcon = Copy;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly LoaderIcon = LoaderCircle;
  readonly LockIcon = Lock;
  readonly MailIcon = Mail;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly SmartphoneIcon = Smartphone;
  readonly TriangleAlertIcon = TriangleAlert;

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private injector = inject(Injector);

  private emailInput = viewChild<ElementRef<HTMLInputElement>>("emailInput");
  private enrollCodeInput =
    viewChild<ElementRef<HTMLInputElement>>("enrollCodeInput");

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

  private formState = toSignal(this.form.events, { initialValue: null });

  showPassword = signal(false);
  isLoading = signal(false);
  role = signal<"ADMIN" | "SCHOOL">("ADMIN");
  passwordFocused = signal(false);
  capsLock = signal(false);

  failedAttempts = signal(0);
  private lockoutUntil = signal<number | null>(null);
  now = signal(Date.now());
  private lockoutTimer: ReturnType<typeof setInterval> | null = null;

  isEnrolling = signal(false);
  enrollmentToken = signal<string | null>(null);
  enrollData = signal<TOTPEnrollResponse | null>(null);
  enrollConfirmCode = signal("");
  isConfirmingEnroll = signal(false);

  reasonMessage = computed(() => {
    const reason = this.route.snapshot.queryParamMap.get("reason");
    if (reason === "expired")
      return "Your session ended. Sign in again to continue.";
    if (reason === "signed-out") return "You've signed out.";
    return null;
  });

  isLockedOut = computed(() => {
    const until = this.lockoutUntil();
    return until !== null && this.now() < until;
  });

  lockoutMinutesLeft = computed(() => {
    const until = this.lockoutUntil();
    if (!until) return 0;
    return Math.ceil((until - this.now()) / 60000);
  });

  private get emailCtrl() {
    return this.form.controls.email;
  }
  private get passwordCtrl() {
    return this.form.controls.password;
  }

  emailInvalid = computed(() => {
    this.formState();
    return this.emailCtrl.invalid && this.emailCtrl.touched;
  });
  showEmailHelperWarning = computed(() => {
    this.formState();
    const value = (this.emailCtrl.value || "").trim();
    return value.length > 0 && !EMAIL_RE.test(value) && !this.emailCtrl.touched;
  });
  emailError = computed(() => {
    this.formState();
    if (this.emailCtrl.hasError("required")) return "Email is required";
    if (this.emailCtrl.hasError("invalidEmail"))
      return "Enter a valid email address";
    return null;
  });

  passwordInvalid = computed(() => {
    this.formState();
    return this.passwordCtrl.invalid && this.passwordCtrl.touched;
  });
  passwordError = computed(() => {
    this.formState();
    if (this.passwordCtrl.hasError("required")) return "Password is required";
    if (this.passwordCtrl.hasError("minlength"))
      return "Password must be at least 8 characters";
    return null;
  });

  passwordLength = computed(() => {
    this.formState();
    return (this.passwordCtrl.value || "").length;
  });

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
    if (bars <= 1) return "bg-ui-danger";
    if (bars === 2) return "bg-ui-warning";
    if (bars === 3) return "bg-ui-accent";
    return "bg-ui-success";
  });

  strengthTextColor = computed(() => {
    const bars = this.passwordStrengthBars();
    if (bars <= 1) return "text-ui-danger";
    if (bars === 2) return "text-ui-warning";
    if (bars === 3) return "text-ui-accent";
    return "text-ui-success";
  });

  constructor() {
    afterNextRender(() => this.emailInput()?.nativeElement.focus());

    effect(() => {
      if (!this.enrollData()) return;
      afterNextRender(() => this.enrollCodeInput()?.nativeElement.focus(), {
        injector: this.injector,
      });
    });

    const destroyRef = inject(DestroyRef);

    effect(() => {
      const until = this.lockoutUntil();
      if (until !== null && this.now() < until) {
        if (this.lockoutTimer === null) {
          this.lockoutTimer = setInterval(
            () => this.now.set(Date.now()),
            15000,
          );
        }
        return;
      }
      this.clearLockoutTimer();
      if (until !== null) {
        this.failedAttempts.set(0);
        this.lockoutUntil.set(null);
      }
    });

    destroyRef.onDestroy(() => this.clearLockoutTimer());
  }

  private clearLockoutTimer() {
    if (this.lockoutTimer !== null) {
      clearInterval(this.lockoutTimer);
      this.lockoutTimer = null;
    }
  }

  private redirectTarget(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    return returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : "/dashboard";
  }

  onPasswordKey(event: KeyboardEvent) {
    this.capsLock.set(event.getModifierState("CapsLock"));
  }

  onEnrollCodeChange(value: string) {
    const digits = (value ?? "").replace(/\D/g, "").slice(0, 6);
    this.enrollConfirmCode.set(digits);
    if (digits.length === 6 && !this.isConfirmingEnroll()) {
      this.confirmEnrollment();
    }
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
    if (!token || code.length !== 6 || this.isConfirmingEnroll()) return;

    this.isConfirmingEnroll.set(true);
    this.auth.confirmTotp(token, code).subscribe({
      next: () => {
        this.isConfirmingEnroll.set(false);
        this.isEnrolling.set(false);
        this.toast.show(
          "success",
          "Two-factor authentication configured! Welcome.",
        );
        this.router.navigateByUrl(this.redirectTarget());
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
          this.router.navigateByUrl(this.redirectTarget());
        },
        error: (err) => {
          this.isLoading.set(false);
          const attempts = this.failedAttempts() + 1;
          this.failedAttempts.set(attempts);
          if (attempts >= LOCKOUT_THRESHOLD) {
            const now = Date.now();
            this.now.set(now);
            this.lockoutUntil.set(now + LOCKOUT_MINUTES * 60 * 1000);
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
