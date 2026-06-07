import { Component, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { LucideAngularModule, Cookie, X } from "lucide-angular";

@Component({
  selector: "app-cookie-consent",
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    @if (isVisible()) {
      <div
        class="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-8 duration-500"
      >
        <div
          class="bg-surface-container-high border border-outline-variant shadow-2xl rounded-2xl p-6 md:p-8 backdrop-blur-xl"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0"
            >
              <lucide-icon
                [img]="CookieIcon"
                class="w-6 h-6 text-primary"
              ></lucide-icon>
            </div>
            <div class="flex-1 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-on-surface font-display">
                  Cookie Policy
                </h3>
                <button
                  (click)="close()"
                  class="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                >
                  <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                We use cookies to enhance your experience, analyze site traffic,
                and serve better content. By clicking "Accept", you agree to our
                use of cookies as described in our
                <a
                  routerLink="/cookies"
                  class="text-primary hover:underline font-medium"
                  >Cookie Policy</a
                >.
              </p>
              <div class="flex items-center gap-3 pt-2">
                <button
                  (click)="accept()"
                  class="flex-1 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Accept All
                </button>
                <button
                  (click)="close()"
                  class="px-6 py-2.5 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container transition-all active:scale-95"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CookieConsentComponent implements OnInit {
  isVisible = signal(false);
  readonly CookieIcon = Cookie;
  readonly XIcon = X;

  ngOnInit() {
    const consent = localStorage.getItem("solexpay_cookie_consent");
    if (!consent) {
      // Delay slightly for better UX
      setTimeout(() => this.isVisible.set(true), 2000);
    }
  }

  accept() {
    localStorage.setItem("solexpay_cookie_consent", "accepted");
    this.isVisible.set(false);
  }

  close() {
    this.isVisible.set(false);
  }
}
