import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { RippleDirective } from '../directives/ripple.directive';
import { ShakeOnErrorDirective } from '../directives/shake-on-error.directive';
import { GlowEffectDirective } from '../directives/glow-effect.directive';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function emailValidator(control: AbstractControl) {
  const v = control.value as string;
  return v && !EMAIL_RE.test(v) ? { invalidEmail: true } : null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RippleDirective, ShakeOnErrorDirective, GlowEffectDirective],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <button
          type="button"
          (click)="goBack()"
          class="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors mb-5">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        <!-- Logo -->
        <div class="text-center mb-8">
          <img src="/logo-icon.png" alt="Solexpay" class="h-20 w-auto mx-auto mb-4 object-contain drop-shadow-[0_4px_16px_rgba(0,91,191,0.25)]"/>
          <h1 class="text-2xl font-bold text-on-surface">Solexpay</h1>
          <p class="text-sm text-on-surface-variant mt-1">Admin Portal</p>
        </div>

        <!-- Login Card -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_40px_rgba(25,28,29,0.08)]">
          <h2 class="text-xl font-bold text-on-surface mb-6">Sign In</h2>

          <form [formGroup]="form" (ngSubmit)="login()" class="space-y-4">
            <!-- Email -->
            <div [shakeOnError]="emailInvalid()">
              <label class="block text-sm font-medium text-on-surface-variant mb-1">Email Address</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">email</span>
                <input
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-4
                         transition-all duration-200 text-sm font-medium outline-none
                         focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 animate-focus-ring"
                  placeholder="admin&#64;solexpay.com"
                  [class.ring-2]="emailInvalid()"
                  [class.ring-error]="emailInvalid()">
              </div>
              @if (emailInvalid()) {
                <p class="text-xs text-error mt-1">{{ emailError() }}</p>
              } @else if (showEmailHelperWarning()) {
                <p class="mt-1.5 text-xs text-amber-700 bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">warning</span>
                  Use format like name&#64;school.edu.ng
                </p>
              }
            </div>

            <!-- Password -->
            <div [shakeOnError]="passwordInvalid()">
              <label class="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  class="w-full bg-surface-container-highest rounded-xl py-3 pl-10 pr-10
                         transition-all duration-200 text-sm font-medium outline-none
                         focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                  [class.ring-2]="passwordInvalid()"
                  [class.ring-error]="passwordInvalid()"
                  placeholder="••••••••">
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors">
                  <span class="material-symbols-outlined text-sm">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (passwordInvalid()) {
                <p class="text-xs text-error mt-1">{{ passwordError() }}</p>
              } @else if (showPasswordHelperWarning()) {
                <p class="mt-1.5 text-xs text-amber-700 bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">warning</span>
                  Password must be at least 8 characters
                </p>
              }
            </div>

            <!-- Role Toggle -->
            <div class="flex gap-2 p-1 bg-surface-container rounded-xl">
              <button
                type="button"
                (click)="role.set('ADMIN')"
                class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                [class]="role() === 'ADMIN' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'">
                Admin
              </button>
              <button
                type="button"
                (click)="role.set('SCHOOL')"
                class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                [class]="role() === 'SCHOOL' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'">
                School
              </button>
            </div>

            <!-- Submit -->
            <button
              solexRipple
              glowEffect="always"
              type="submit"
              [disabled]="isLoading()"
              class="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm
                     transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-[0_4px_16px_rgba(0,91,191,0.3)]">
              @if (isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
                  Signing in...
                </span>
              } @else {
                Sign In
              }
            </button>
          </form>

          <!-- Links -->
          <div class="mt-6 text-center">
            <button
              type="button"
              (click)="forgotPassword()"
              [disabled]="forgotLoading()"
              class="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline">
              @if (forgotLoading()) {
                Sending reset link...
              } @else {
                Forgot password?
              }
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-on-surface-variant mt-8">
          © 2026 SolexPay. All rights reserved.
        </p>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.maxLength(320), emailValidator]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  showPassword = signal(false);
  isLoading = signal(false);
  forgotLoading = signal(false);
  role = signal<'ADMIN' | 'SCHOOL'>('ADMIN');

  private get emailCtrl() { return this.form.controls.email; }
  private get passwordCtrl() { return this.form.controls.password; }

  emailInvalid = computed(() => this.emailCtrl.invalid && this.emailCtrl.touched);
  showEmailHelperWarning = computed(() => {
    const value = (this.emailCtrl.value || '').trim();
    return value.length > 0 && !EMAIL_RE.test(value) && !this.emailCtrl.touched;
  });
  emailError = computed(() => {
    if (this.emailCtrl.hasError('required')) return 'Email is required';
    if (this.emailCtrl.hasError('invalidEmail')) return 'Enter a valid email address';
    return null;
  });

  passwordInvalid = computed(() => this.passwordCtrl.invalid && this.passwordCtrl.touched);
  showPasswordHelperWarning = computed(() => {
    const value = this.passwordCtrl.value || '';
    return value.length > 0 && value.length < 8 && !this.passwordCtrl.touched;
  });
  passwordError = computed(() => {
    if (this.passwordCtrl.hasError('required')) return 'Password is required';
    if (this.passwordCtrl.hasError('minlength')) return 'Password must be at least 8 characters';
    return null;
  });

  goBack() {
    this.router.navigate(['/']);
  }

  login() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    this.isLoading.set(true);

    this.auth.login({ email, password }, this.role()).subscribe({
      next: () => {
        this.toast.show('success', 'Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show('error', err.error?.message || 'Invalid credentials');
      }
    });
  }

  forgotPassword() {
    const email = this.emailCtrl.value.trim();
    if (!email || !EMAIL_RE.test(email)) {
      this.emailCtrl.markAsTouched();
      this.toast.show('error', 'Enter a valid email to reset password');
      return;
    }

    this.forgotLoading.set(true);
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.forgotLoading.set(false);
        this.toast.show('success', 'Password reset instructions sent to your email');
      },
      error: (err: any) => {
        this.forgotLoading.set(false);
        this.toast.show('error', err.error?.message || 'Unable to send reset link');
      }
    });
  }
}
