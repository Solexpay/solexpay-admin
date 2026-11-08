"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Sidebar } from "./sidebar";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Off-canvas mobile navigation drawer (< lg / 1024px).
 * Opens with the --ease-drawer curve, traps focus while open, returns focus
 * to the menu button on close, locks body/main scroll, and closes on route change,
 * Escape, or backdrop tap.
 */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const prevPathnameRef = useRef(pathname);

  // Close drawer on route change
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (open) {
        onClose();
      }
    }
  }, [pathname, open, onClose]);

  // Handle escape key, focus trapping, scroll locking, and return focus
  useEffect(() => {
    if (!open) return;

    // Lock body and main scroll
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const mainEl = document.querySelector("main");
    const originalMainOverflow = mainEl?.style.overflow ?? "";
    if (mainEl) mainEl.style.overflow = "hidden";

    // Escape listener
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.closest("[hidden]"));

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (!drawerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Initial focus on search input or first focusable
    const raf = requestAnimationFrame(() => {
      if (!drawerRef.current) return;
      const searchInput = drawerRef.current.querySelector<HTMLInputElement>(
        'input[aria-label="Jump to a page"]',
      );
      if (searchInput) {
        searchInput.focus();
      } else {
        const first = drawerRef.current.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalBodyOverflow;
      if (mainEl) mainEl.style.overflow = originalMainOverflow;

      // Return focus to menu trigger
      const menuTrigger = document.querySelector<HTMLElement>(
        '[data-testid="menu"]',
      );
      menuTrigger?.focus();
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ui-ink/30 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Off-canvas drawer */}
      <div
        ref={drawerRef}
        aria-label="Mobile navigation"
        aria-modal="true"
        role="dialog"
        inert={!open ? true : undefined}
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-250 ease-(--ease-drawer) lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <Sidebar onClose={onClose} className="h-full shadow-2xl" />
      </div>
    </>
  );
}
