"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

let lastHiddenAt = 0;
const WARM_MS = 400;
const EDGE_GAP = 8;

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  delay?: number;
  children: ReactElement;
  className?: string;
}

export function Tooltip({
  content,
  position = "top",
  delay = 300,
  children,
  className = "",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const tooltipId = `tooltip-${generatedId.replace(/:/g, "")}`;

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case "left":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }

    left = Math.min(
      Math.max(left, EDGE_GAP),
      window.innerWidth - tooltipRect.width - EDGE_GAP,
    );
    top = Math.min(
      Math.max(top, EDGE_GAP),
      window.innerHeight - tooltipRect.height - EDGE_GAP,
    );

    setCoords({ top, left });
  }, [position]);

  const showTooltip = useCallback(
    (isInstant = false) => {
      if (!content) return;
      setInstant(isInstant);
      setVisible(true);
    },
    [content],
  );

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
    lastHiddenAt = Date.now();
  }, []);

  const handleMouseEnter = () => {
    if (Date.now() - lastHiddenAt < WARM_MS) {
      showTooltip(true);
      return;
    }
    timerRef.current = setTimeout(() => {
      showTooltip(false);
    }, delay);
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = () => {
    showTooltip(true);
  };

  const handleBlur = () => {
    hideTooltip();
  };

  useEffect(() => {
    if (visible) {
      calculatePosition();
      const onScrollOrResize = () => calculatePosition();
      const handleKeyDown = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") hideTooltip();
      };
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true);
        window.removeEventListener("resize", onScrollOrResize);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [visible, calculatePosition, hideTooltip]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;

  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // React 19: ref is an ordinary prop on the element.
      const originalRef = childProps.ref;
      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && typeof originalRef === "object") {
        (originalRef as { current: HTMLElement | null }).current = node;
      }
    },
    "aria-describedby": visible ? tooltipId : childProps["aria-describedby"],
    onMouseEnter: (e: React.MouseEvent) => {
      (
        childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined
      )?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (
        childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined
      )?.(e);
      handleMouseLeave();
    },
    onFocus: (e: React.FocusEvent) => {
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
      handleFocus();
    },
    onBlur: (e: React.FocusEvent) => {
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
      handleBlur();
    },
  });

  return (
    <>
      {trigger}
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords ? `${coords.top}px` : "-9999px",
              left: coords ? `${coords.left}px` : "-9999px",
              background: "#191c1d",
              color: "#ffffff",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              zIndex: 1000,
              pointerEvents: "none",
              animationDuration: instant ? "0s" : undefined,
            }}
            className={`animate-tooltip-in ${className}`.trim()}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
