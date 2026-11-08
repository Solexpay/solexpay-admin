"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openModalCount = 0;
const modalStack: (() => void)[] = [];

function lockScroll(locked: boolean) {
  if (typeof document === "undefined") return;
  const value = locked ? "hidden" : "";
  document.body.style.overflow = value;
  const main = document.querySelector("main");
  if (main) main.style.overflow = value;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  overlayClassName = "",
  role = "dialog",
  ariaLabel,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    openModalCount += 1;
    if (openModalCount === 1) {
      lockScroll(true);
    }

    const handleClose = () => {
      onClose();
    };
    modalStack.push(handleClose);

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== handleClose) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusables = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.closest("[hidden]"));

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (!modalRef.current.contains(document.activeElement)) {
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

    // Initial autofocus
    const raf = requestAnimationFrame(() => {
      if (!modalRef.current) return;
      const target =
        modalRef.current.querySelector<HTMLElement>("[data-autofocus]") ??
        Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).find((el) => !el.closest(".ui-modal-head")) ??
        modalRef.current;
      target?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);

      const index = modalStack.indexOf(handleClose);
      if (index >= 0) {
        modalStack.splice(index, 1);
      }

      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        lockScroll(false);
      }

      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`ui-overlay ${overlayClassName}`.trim()}
      role="presentation"
    >
      <div className="ui-backdrop" aria-hidden="true" onClick={onClose} />
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is always dialog or alertdialog (typed prop); Biome cannot see a dynamic role. */}
      <div
        ref={modalRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`ui-modal pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-0 ${className}`.trim()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
