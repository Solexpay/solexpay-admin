"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { toast, useToasts } from "@/lib/ui/toast";

export function ToastOutlet() {
  const toasts = useToasts();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      className="pointer-events-none fixed right-4 top-4 z-100 flex flex-col gap-2 sm:bottom-6 sm:right-6 sm:top-auto"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: hover/focus only pauses the auto-dismiss timer.
        <div
          key={item.id}
          data-testid="toast"
          role={item.type === "error" ? "alert" : "status"}
          className={`ui-toast pointer-events-auto flex w-[min(360px,calc(100vw-2rem))] items-start gap-2.5 rounded-xl border border-ui-line bg-white px-3.5 py-3 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] toast-${item.type}`}
          onMouseEnter={() => toast.pause(item.id)}
          onMouseLeave={() => toast.resume(item.id)}
          onFocus={() => toast.pause(item.id)}
          onBlur={() => toast.resume(item.id)}
        >
          {item.type === "success" && (
            <CircleCheck size={18} className="mt-px shrink-0 text-ui-success" />
          )}
          {item.type === "error" && (
            <CircleAlert size={18} className="mt-px shrink-0 text-ui-danger" />
          )}
          {item.type === "info" && (
            <Info size={18} className="mt-px shrink-0 text-ui-accent" />
          )}

          <p className="flex-1 text-[13px] font-medium leading-5 text-ui-ink">
            {item.message}
          </p>

          {item.action && (
            <button
              type="button"
              className="-my-1 shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-ui-accent hover:bg-ui-accent-soft"
              onClick={() => toast.runAction(item)}
            >
              {item.action.label}
            </button>
          )}

          <button
            type="button"
            className="ui-icon-btn -mr-1 -mt-1 h-7 w-7"
            aria-label="Dismiss"
            onClick={() => toast.dismiss(item.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </section>
  );
}
