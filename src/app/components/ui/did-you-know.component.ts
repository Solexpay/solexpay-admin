import { Component, DestroyRef, computed, inject, signal } from "@angular/core";

interface Tip {
  text: string;
  art: string;
  /** Tints the card and the halo behind the art. */
  accent: string;
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);

/** The console's own tips, in the voice of the app's "Did you know?" panel. */
const TIPS: Tip[] = [
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

/**
 * A calm rotating tip strip for the dashboard, after the app's
 * DidYouKnowPanel. Holds still while hovered or focused, when the tab is
 * hidden, and when the viewer prefers reduced motion.
 */
@Component({
  selector: "app-did-you-know",
  host: {
    class: "block",
    "(mouseenter)": "hold.set(true)",
    "(mouseleave)": "hold.set(false)",
    "(focusin)": "hold.set(true)",
    "(focusout)": "hold.set(false)",
  },
  template: `
    <section
      class="dyk-card relative h-24 overflow-hidden rounded-[14px]"
      [style.--accent]="tip().accent"
      aria-roledescription="carousel"
      aria-label="Did you know"
    >
      <div
        class="dyk-halo absolute -right-8 -top-5 size-[140px] rounded-full"
      ></div>
      @for (t of [tip()]; track t.art) {
        <div class="dyk-float absolute -bottom-4 -right-3 size-[108px]">
          <img
            [src]="t.art"
            alt=""
            width="108"
            height="108"
            class="dyk-art size-full object-contain"
          />
        </div>
      }
      <div class="relative flex h-full flex-col py-3.5 pl-4 pr-28">
        <p class="text-[15px] font-bold tracking-tight text-ui-ink">
          Did you know?
        </p>
        <p
          class="mt-[3px] flex-1 text-[12.5px] leading-[1.35] text-ui-muted"
          aria-live="polite"
        >
          @for (t of [tip()]; track t.text) {
            <span class="dyk-swap line-clamp-2 block">{{ t.text }}</span>
          }
        </p>
        <div class="flex items-center gap-1">
          @for (t of tips; track t.text; let i = $index) {
            <button
              type="button"
              class="dyk-dot h-1 rounded-sm"
              [style.width.px]="i === index() ? 18 : 8"
              [style.opacity]="i === index() ? 1 : 0.25"
              [attr.aria-label]="'Tip ' + (i + 1) + ' of ' + tips.length"
              [attr.aria-current]="i === index() ? 'true' : null"
              (click)="go(i)"
            ></button>
          }
        </div>
      </div>
    </section>
  `,
})
export class DidYouKnowComponent {
  readonly tips = TIPS;
  index = signal(Math.floor(Math.random() * TIPS.length));
  hold = signal(false);
  tip = computed(() => this.tips[this.index()]!);

  constructor() {
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = setInterval(() => {
      if (this.hold() || document.hidden) return;
      this.index.update((i) => (i + 1) % this.tips.length);
    }, INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  go(i: number) {
    this.index.set(i);
  }
}
