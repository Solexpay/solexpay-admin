"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { ToastOutlet } from "./toast-outlet";
import { TopBar } from "./topbar";

export interface AdminShellProps {
  children: ReactNode;
}

/**
 * The console frame: a grey page holding the sidebar panel and the white
 * page panel side by side. Below lg the sidebar becomes an off-canvas drawer.
 */
export function AdminShell({ children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Reset main scroll to top on page navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a value read inside.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const openDrawer = () => {
    setDrawerOpen(true);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-100 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-ui-ink focus:shadow"
      >
        Skip to content
      </a>

      <div className="flex h-dvh gap-3 overflow-hidden bg-ui-frame lg:p-3">
        {/* Desktop Sidebar (lg+) */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer (< lg) */}
        <MobileNav open={drawerOpen} onClose={closeDrawer} />

        {/* Content panel */}
        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-ui-line"
          inert={drawerOpen ? true : undefined}
        >
          <TopBar onToggleSidebar={openDrawer} />
          <main
            ref={mainRef}
            id="main"
            tabIndex={-1}
            className="flex-1 overflow-y-auto outline-hidden"
          >
            <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Console-wide Outlets */}
        <ToastOutlet />
        <ConfirmDialog />
      </div>
    </>
  );
}
