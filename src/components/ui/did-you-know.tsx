"use client";

import { type CSSProperties, useEffect, useState } from "react";

export interface Tip {
  text: string;
  art: string;
  /** Tints the card and the halo behind the art. */
  accent: string;
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);

export const TIPS: Tip[] = [
  {
    text: `Press ${isMac ? "⌘K" : "Ctrl K"} to jump to any page without leaving the keyboard.`,
    art: "/art/tip-p2p.webp",
    accent: "#10b981",
  },
  {
    text: "Transaction filters live in the link. Share it and a teammate sees the same view.",
    art: "/art/tip-savings.webp",
    accent: "#f97316",
  },
  {
    text: "Click any ID, email or reference to copy it exactly, even when it's shown masked.",
    art: "/art/tip-receive.webp",
    accent: "#7c3aed",
  },
  {
    text: "Approving a KYC check moves that user up a tier, which raises their daily transfer limit.",
    art: "/art/tip-verify.webp",
    accent: "#f59e0b",
  },
];

const INTERVAL_MS = 8000;

export interface DidYouKnowProps {
  className?: string;
  tips?: Tip[];
}

/**
 * A calm rotating tip strip for the dashboard, after the app's
 * DidYouKnowPanel. Holds still while hovered or focused, when the tab is
 * hidden, and when the viewer prefers reduced motion.
 */
export function DidYouKnow({ className = "", tips = TIPS }: DidYouKnowProps) {
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);

  useEffect(() => {
    // Pick an initial random tip once mounted
    setIndex(Math.floor(Math.random() * tips.length));
  }, [tips.length]);

  useEffect(() => {
    const reduceMotion =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = setInterval(() => {
      if (hold || (typeof document !== "undefined" && document.hidden)) return;
      setIndex((i) => (i + 1) % tips.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [hold, tips.length]);

  const tip = tips[index] ?? tips[0]!;

  return (
    <section
      className={`dyk-card relative h-24 overflow-hidden rounded-[14px] ${className}`.trim()}
      style={{ "--accent": tip.accent } as CSSProperties}
      aria-roledescription="carousel"
      aria-label="Did you know"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="dyk-halo absolute -right-8 -top-5 size-[140px] rounded-full" />
      <div
        key={tip.art}
        className="dyk-float absolute -bottom-4 -right-3 size-[108px]"
      >
        <img
          src={tip.art}
          alt=""
          width={108}
          height={108}
          className="dyk-art size-full object-contain"
        />
      </div>
      <div className="relative flex h-full flex-col py-3.5 pl-4 pr-28">
        <p className="text-[15px] font-bold tracking-tight text-ui-ink">
          Did you know?
        </p>
        <div
          className="mt-[3px] flex-1 text-[12.5px] leading-[1.35] text-ui-muted"
          aria-live="polite"
        >
          <span key={tip.text} className="dyk-swap line-clamp-2 block">
            {tip.text}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {tips.map((t, i) => (
            <button
              key={t.text}
              type="button"
              className="dyk-dot h-1 rounded-sm"
              style={{
                width: i === index ? 18 : 8,
                opacity: i === index ? 1 : 0.25,
              }}
              aria-label={`Tip ${i + 1} of ${tips.length}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
