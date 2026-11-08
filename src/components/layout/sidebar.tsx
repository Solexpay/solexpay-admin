"use client";

import { LogOut, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAdminSession } from "@/lib/auth/session";
import { NAV_ITEMS, type NavItem } from "@/lib/ui/nav";
import { BubbleAvatar } from "../ui/bubble-avatar";

export interface SidebarProps {
  onClose?: () => void;
  className?: string;
  currentPath?: string;
}

export function Sidebar({
  onClose,
  className = "",
  currentPath,
}: SidebarProps) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = currentPath ?? rawPathname ?? "/dashboard";
  const { admin, logout, canAccess } = useAdminSession();

  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const shortcutLabel =
    typeof navigator !== "undefined" &&
    /Mac|iP(hone|ad)/.test(navigator.platform)
      ? "⌘K"
      : "Ctrl K";

  // Filter accessible items
  const accessibleItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.section) return true;
      if (typeof canAccess === "function") {
        return canAccess(item.section);
      }
      return true;
    });
  }, [canAccess]);

  // Grouped and filtered navigation items
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: { name: string; items: NavItem[] }[] = [];

    for (const item of accessibleItems) {
      if (q && !item.label.toLowerCase().includes(q)) {
        continue;
      }
      let group = result.find((g) => g.name === item.group);
      if (!group) {
        group = { name: item.group, items: [] };
        result.push(group);
      }
      group.items.push(item);
    }
    return result;
  }, [accessibleItems, query]);

  const isActive = (route: string) => {
    if (route === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname.startsWith(route);
  };

  // ⌘K / Ctrl K global listener
  useEffect(() => {
    const onKeydown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, []);

  const clearSearch = () => {
    setQuery("");
    searchInputRef.current?.blur();
  };

  const jumpToFirst = () => {
    const first = groups[0]?.items[0];
    if (!first) return;
    router.push(first.route);
    clearSearch();
    onClose?.();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      jumpToFirst();
    } else if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  const displayName = admin?.firstName
    ? `${admin.firstName} ${admin.lastName ?? ""}`.trim()
    : "Admin";

  const roleLabel = (admin?.role ?? "ADMIN").replace(/_/g, " ").toLowerCase();

  return (
    <aside
      className={`flex h-full w-[256px] flex-col border-r border-ui-line bg-ui-rail lg:rounded-2xl lg:border ${className}`.trim()}
    >
      {/* Brand */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <img
            src="/logo-icon.png"
            alt=""
            width="32"
            height="28"
            className="h-7 w-8 object-contain"
          />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-5 text-ui-ink">
              SolexPay
            </p>
            <p className="truncate text-xs text-ui-muted">Operations console</p>
          </div>
        </div>
      </div>

      {/* Jump to a page */}
      <div className="px-3 pb-1">
        <div className="ui-search">
          <Search size={15} />
          <input
            ref={searchInputRef}
            className="ui-input h-8 pr-11 text-[13px]"
            placeholder="Jump to…"
            aria-label="Jump to a page"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-ui-line bg-ui-rail px-1 text-[10px] font-medium text-ui-faint">
            {shortcutLabel}
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Main">
        {groups.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[13px] text-ui-muted">
            No page called “{query}”
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.name || "default"}>
              {group.name ? (
                <p className="px-2.5 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-ui-faint">
                  {group.name}
                </p>
              ) : (
                <div className="pt-2" />
              )}
              {group.items.map((item) => {
                const active = isActive(item.route);
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.route}
                    href={item.route}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onClose?.()}
                    className={`mb-0.5 flex h-9 items-center gap-2.5 rounded-lg border px-2.5 text-[13.5px] transition-colors ${
                      active
                        ? "border-ui-line bg-white font-medium text-ui-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                        : "border-transparent text-ui-body hover:bg-white/70 hover:text-ui-ink"
                    }`}
                  >
                    <ItemIcon
                      size={17}
                      className={active ? "text-ui-ink" : "text-ui-muted"}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </nav>

      {/* Signed-in admin */}
      <div className="border-t border-ui-line p-3">
        <div className="flex items-center gap-2.5 px-1">
          <BubbleAvatar seed={admin?.firstName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ui-ink">
              {displayName}
            </p>
            <p className="truncate text-xs text-ui-muted">
              {admin?.email || roleLabel}
            </p>
          </div>
          <button
            type="button"
            className="ui-icon-btn min-h-[36px] min-w-[36px]"
            title="Sign out"
            aria-label="Sign out"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
