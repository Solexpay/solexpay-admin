"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ToastOutlet } from "@/components/layout/toast-outlet";
import { useAdminSession } from "@/lib/auth/session";
import { safeReturnUrl } from "@/lib/safe-return-url";
import { toast } from "@/lib/ui/toast";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(320)
  .email("Enter a valid email address");
const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(256),
  totpCode: z
    .string()
    .regex(/^(\d{6})?$/, "Enter the 6-digit code from your authenticator app"),
});
type LoginFields = z.infer<typeof schema>;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function LoginContent() {
  const session = useAdminSession();
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{
    secret: string;
    otpauthUrl: string;
  } | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", totpCode: "" },
  });
  const locked = lockoutUntil !== null && now < lockoutUntil;
  const returnUrl = params.get("returnUrl");
  const redirectTarget = () => safeReturnUrl(returnUrl);

  useEffect(() => {
    if (session.status === "authenticated")
      router.replace(safeReturnUrl(returnUrl));
  }, [session.status, router, returnUrl]);
  useEffect(() => {
    if (!locked) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [locked]);
  useEffect(() => {
    if (lockoutUntil !== null && now >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
    }
  }, [lockoutUntil, now]);

  const onSubmit = async (values: LoginFields) => {
    if (locked || loading) return;
    setLoading(true);
    try {
      const result = await session.login(
        values.email,
        values.password,
        values.totpCode,
      );
      if ("enrollmentRequired" in result) {
        setEnrollmentToken(result.enrollmentToken);
        const data = await session.enrollTotp(result.enrollmentToken);
        setEnrollment(data);
        return;
      }
      setFailedAttempts(0);
      setLockoutUntil(null);
      toast.success("Welcome back!");
      router.replace(redirectTarget());
    } catch (error) {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= LOCKOUT_THRESHOLD) {
        setLockoutUntil(Date.now() + LOCKOUT_MS);
        toast.error("Too many failed attempts. Try again in 15 minutes.");
      } else
        toast.error(
          error instanceof Error ? error.message : "Invalid credentials",
        );
    } finally {
      setLoading(false);
    }
  };
  const confirmEnrollment = async () => {
    if (!enrollmentToken || confirmCode.length !== 6 || confirming) return;
    setConfirming(true);
    try {
      await session.confirmTotp(enrollmentToken, confirmCode);
      toast.success("Two-factor authentication configured! Welcome.");
      router.replace(redirectTarget());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid verification code. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  };
  const onEnrollmentCodeChange = (value: string) => {
    const code = value.replace(/\D/g, "").slice(0, 6);
    setConfirmCode(code);
    if (code.length !== 6 || !enrollmentToken || confirming) return;
    setConfirming(true);
    void session
      .confirmTotp(enrollmentToken, code)
      .then(() => {
        toast.success("Two-factor authentication configured! Welcome.");
        router.replace(redirectTarget());
      })
      .catch(() => toast.error("Invalid verification code. Please try again."))
      .finally(() => setConfirming(false));
  };
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };
  const minsLeft =
    lockoutUntil === null ? 0 : Math.ceil((lockoutUntil - now) / 60_000);
  const reason = params.get("reason");

  return (
    <>
      <div className="flex min-h-dvh items-center justify-center bg-ui-frame p-4">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-ui-line bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <img
                src="/logo-icon.png"
                alt=""
                className="h-8 w-9 object-contain"
              />
              <div className="leading-tight">
                <p className="text-[15px] font-semibold text-ui-ink">
                  SolexPay
                </p>
                <p className="text-xs text-ui-muted">Operations console</p>
              </div>
            </div>
            {enrollmentToken ? (
              <>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-ui-accent" />
                  <h1 className="text-lg font-semibold">
                    Setup Two-Factor Auth
                  </h1>
                </div>
                <p className="mb-5 mt-1 text-[13px] text-ui-muted">
                  Two-factor authentication is required. Add this secret or URL
                  to your authenticator app (Google Authenticator, Authy, etc.)
                  to continue.
                </p>
                {enrollment ? (
                  <>
                    <div className="mb-5 space-y-4 rounded-xl border border-ui-line bg-ui-rail p-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-ui-muted">
                            Secret Key
                          </span>
                          <button
                            type="button"
                            className="ui-btn ui-btn-ghost ui-btn-sm"
                            onClick={() =>
                              void copy(enrollment.secret, "Secret")
                            }
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                        <code className="block break-all text-xs font-semibold">
                          {enrollment.secret}
                        </code>
                      </div>
                      <div className="border-t border-ui-line pt-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-ui-muted">
                            otpauth URL
                          </span>
                          <button
                            type="button"
                            className="ui-btn ui-btn-ghost ui-btn-sm"
                            onClick={() =>
                              void copy(enrollment.otpauthUrl, "URL")
                            }
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                        <code className="block break-all text-xs">
                          {enrollment.otpauthUrl}
                        </code>
                      </div>
                    </div>
                    <label className="ui-label" htmlFor="enroll-code">
                      Enter 6-digit Code from App
                    </label>
                    <input
                      id="enroll-code"
                      className="ui-input my-2 h-11 text-center font-mono text-lg tracking-[0.4em]"
                      value={confirmCode}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      onChange={(event) =>
                        onEnrollmentCodeChange(event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary h-10 w-full"
                      disabled={confirming || confirmCode.length !== 6}
                      onClick={() => void confirmEnrollment()}
                    >
                      {confirming ? "Verifying…" : "Confirm & Finish Sign In"}
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost mt-2 h-10 w-full"
                      onClick={() => {
                        setEnrollmentToken(null);
                        setEnrollment(null);
                        setConfirmCode("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="ui-empty">Loading enrollment details…</div>
                )}
              </>
            ) : (
              <>
                <h1 className="mb-4 text-lg font-semibold">Sign In</h1>
                {reason === "expired" && (
                  <div className="ui-alert ui-alert-info mb-4 text-[13px]">
                    <ShieldCheck size={16} />
                    Your session ended. Sign in again to continue.
                  </div>
                )}
                {reason === "signed-out" && (
                  <div className="ui-alert ui-alert-info mb-4 text-[13px]">
                    <ShieldCheck size={16} />
                    You've signed out.
                  </div>
                )}
                <form
                  className="space-y-4"
                  onSubmit={(event) => void handleSubmit(onSubmit)(event)}
                  noValidate
                >
                  <div>
                    <label className="ui-label" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="ui-input h-10"
                      placeholder="admin@solexpay.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      {...register("email")}
                    />
                    {errors.email && (
                      <p
                        id="email-error"
                        className="mt-1.5 text-xs text-ui-danger"
                      >
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="ui-label" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ui-faint"
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="ui-input h-10 pl-9 pr-10"
                        placeholder="Min. 8 characters"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                          errors.password ? "password-error" : undefined
                        }
                        {...register("password")}
                      />
                      <button
                        type="button"
                        className="ui-icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p
                        id="password-error"
                        className="mt-1.5 text-xs text-ui-danger"
                      >
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="ui-label" htmlFor="totp">
                      Authenticator Code{" "}
                      <span className="font-normal text-ui-muted">
                        (if configured)
                      </span>
                    </label>
                    <div className="relative">
                      <Smartphone
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-faint"
                      />
                      <input
                        id="totp"
                        className="ui-input h-10 pl-9 font-mono tracking-wider"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="6-digit code"
                        aria-invalid={Boolean(errors.totpCode)}
                        aria-describedby={
                          errors.totpCode ? "totp-error" : undefined
                        }
                        {...register("totpCode", {
                          onChange: (event) => {
                            event.target.value = event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                          },
                        })}
                      />
                    </div>
                    {errors.totpCode && (
                      <p
                        id="totp-error"
                        className="mt-1.5 text-xs text-ui-danger"
                      >
                        {errors.totpCode.message}
                      </p>
                    )}
                  </div>
                  {failedAttempts >= 3 &&
                    failedAttempts < LOCKOUT_THRESHOLD && (
                      <div className="ui-alert ui-alert-warning text-[13px]">
                        <TriangleAlert size={16} />
                        {LOCKOUT_THRESHOLD - failedAttempts} attempt
                        {LOCKOUT_THRESHOLD - failedAttempts === 1 ? "" : "s"}{" "}
                        remaining before your account is temporarily locked.
                      </div>
                    )}
                  {locked && (
                    <div className="ui-alert ui-alert-danger text-[13px]">
                      <LockKeyhole size={16} />
                      Too many failed attempts. Please wait {minsLeft} minute
                      {minsLeft === 1 ? "" : "s"} before trying again.
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || locked || session.status === "loading"}
                    className="ui-btn ui-btn-primary h-10 w-full"
                  >
                    {loading
                      ? "Signing in…"
                      : locked
                        ? "Account Locked — Try Again Later"
                        : "Sign In"}
                  </button>
                </form>
              </>
            )}
          </div>
          <p className="mt-5 text-center text-xs text-ui-muted">
            Private console · staff only
          </p>
        </div>
      </div>
      <ToastOutlet />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ui-frame" />}>
      <LoginContent />
    </Suspense>
  );
}
