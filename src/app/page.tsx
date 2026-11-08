"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminSession } from "@/lib/auth/session";

export default function HomePage() {
  const router = useRouter();
  const { status } = useAdminSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

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
