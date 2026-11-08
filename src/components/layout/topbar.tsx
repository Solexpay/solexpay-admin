"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/auth/session";

export interface TopBarProps {
  onToggleSidebar?: () => void;
  className?: string;
}

/** Small-screen bar: opens the sidebar drawer. Hidden from lg up. */
export function TopBar({ onToggleSidebar, className = "" }: TopBarProps) {
  const router = useRouter();
  const { logout } = useAdminSession();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  const showNotifications = () => {
    router.push("/settings/notifications");
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-ui-line bg-white/90 px-3 backdrop-blur-sm lg:hidden ${className}`.trim()}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          data-testid="menu"
          className="ui-icon-btn h-10 w-10 min-h-[40px] min-w-[40px]"
          aria-label="Open menu"
          onClick={onToggleSidebar}
        >
          <Menu size={18} />
        </button>
        <img src="/logo-icon.png" alt="" className="h-6 w-7 object-contain" />
        <span className="truncate text-[15px] font-semibold text-ui-ink">
          SolexPay
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="ui-icon-btn h-10 w-10 min-h-[40px] min-w-[40px]"
          aria-label="Notifications"
          onClick={showNotifications}
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          data-testid="logout"
          className="ui-icon-btn h-10 w-10 min-h-[40px] min-w-[40px]"
          aria-label="Sign out"
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
