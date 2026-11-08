"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTelemetry } from "@/components/telemetry/admin-telemetry";
import { SECTION_ROLES } from "@/lib/access";
import { useAdminSession } from "@/lib/auth/session";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, canAccess } = useAdminSession();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-ui-frame"
        role="status"
        aria-label="Loading"
      >
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ui-accent border-t-transparent" />
      </div>
    );
  }

  if (status === "anonymous") {
    return null;
  }

  // Check section-based role access
  const section = pathname.split("/").filter(Boolean)[0] ?? "";
  const isProtectedSection = Object.hasOwn(SECTION_ROLES, section);

  if (
    isProtectedSection &&
    typeof canAccess === "function" &&
    !canAccess(section)
  ) {
    return (
      <AdminShell>
        <AdminTelemetry />
        <section className="ui-panel">
          <div className="ui-panel-body px-4 py-14 text-center">
            <img
              src="/art/locked.webp"
              alt=""
              width={96}
              height={96}
              className="mx-auto mb-2 h-24 w-24 object-contain"
            />
            <h1 className="text-xl font-semibold text-ui-ink">
              You don&apos;t have access to this page
            </h1>
            <p className="mx-auto mt-1 max-w-md text-sm text-ui-muted">
              Your admin role can&apos;t open this section. Ask a super admin if
              you need it.
            </p>
            <Link href="/dashboard" className="ui-btn ui-btn-primary mt-5">
              Back to dashboard
            </Link>
          </div>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminTelemetry />
      {children}
    </AdminShell>
  );
}
