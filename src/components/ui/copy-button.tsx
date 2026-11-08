"use client";

import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useState,
} from "react";
import { toast } from "@/lib/ui/toast";

export interface CopyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children?: ReactNode;
  showToast?: boolean;
  toastMessage?: string;
  className?: string;
}

/**
 * Copies `value` to the clipboard on click (native button: Enter/Space too).
 * Provides visual animation feedback and displays a toast message.
 */
export function CopyButton({
  value,
  children,
  showToast = true,
  toastMessage = "Copied to clipboard!",
  className = "",
  onClick,
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!value || copied) return;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for environments lacking clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      setCopied(true);
      if (showToast) {
        toast.success(toastMessage);
      }
      setTimeout(() => {
        setCopied(false);
      }, 300);
    } catch {
      if (showToast) {
        toast.error("Failed to copy");
      }
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      handleCopy(event);
    }
  };

  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center transition-colors ${
        copied ? "animate-copy-feedback" : ""
      } ${className}`.trim()}
      onClick={handleClick}
      {...rest}
    >
      {children ?? value}
    </button>
  );
}
