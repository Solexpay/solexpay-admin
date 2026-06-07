import { Component } from "@angular/core";
import { LucideAngularModule, ExternalLink, QrCode } from "lucide-angular";

@Component({
  selector: "app-landing-download",
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section id="download" class="bg-surface-container-low py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div
          class="bg-surface-container-lowest rounded-[2.5rem] p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-sm"
          data-aos="fade-up"
        >
          <div class="max-w-lg">
            <p
              class="text-primary font-bold tracking-widest uppercase text-sm mb-4"
            >
              Get the App
            </p>
            <h2
              class="text-4xl font-extrabold tracking-tighter mb-4 font-display"
            >
              Your student wallet,<br />in your pocket.
            </h2>
            <p class="text-on-surface-variant leading-relaxed mb-8">
              Download SolexPay and manage your campus finances on the go.
              Available on iOS and Android.
            </p>
            <div class="flex flex-wrap gap-4">
              <!-- App Store -->
              <a
                href="#"
                class="flex items-center gap-3 bg-on-surface text-surface px-6 py-3.5 rounded-xl hover:bg-on-surface/90 hover:-translate-y-0.5 transition"
              >
                <svg
                  class="w-8 h-8 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  />
                </svg>
                <div>
                  <p class="text-[10px] opacity-60 leading-none mb-0.5">
                    Download on the
                  </p>
                  <p class="font-bold leading-none">App Store</p>
                </div>
              </a>
              <!-- Google Play -->
              <a
                href="#"
                class="flex items-center gap-3 bg-on-surface text-surface px-6 py-3.5 rounded-xl hover:bg-on-surface/90 hover:-translate-y-0.5 transition"
              >
                <svg
                  class="w-8 h-8 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 010 2.594zM1.337.924a1.49 1.49 0 00-.271.83v20.49a1.49 1.49 0 00.278.84l.027.023 11.293-11.29v-.045L1.31.902zM14.58 17.679l-3.765-3.765L1.337 23.16c.495.525 1.29.59 1.865.16l11.378-5.641M14.58 6.43L3.203.793c-.576-.43-1.371-.365-1.866.16l10.478 10.246z"
                  />
                </svg>
                <div>
                  <p class="text-[10px] opacity-60 leading-none mb-0.5">
                    Get it on
                  </p>
                  <p class="font-bold leading-none">Google Play</p>
                </div>
              </a>
              <a
                href="#"
                class="flex items-center gap-3 bg-surface-container-high text-on-surface px-6 py-3.5 rounded-xl hover:bg-surface-container-highest transition border border-outline-variant"
              >
                <lucide-icon
                  [img]="ExternalLinkIcon"
                  class="w-8 h-8"
                ></lucide-icon>
                <div>
                  <p
                    class="text-[10px] text-on-surface-variant leading-none mb-0.5"
                  >
                    Use in browser
                  </p>
                  <p class="font-bold leading-none">Web App</p>
                </div>
              </a>
            </div>
          </div>
          <div
            class="flex flex-col items-center gap-4 shrink-0"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            <div
              class="w-44 h-44 bg-surface-container-high rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline-variant"
            >
              <lucide-icon
                [img]="QrCodeIcon"
                class="w-10 h-10 text-outline"
              ></lucide-icon>
              <p class="text-xs text-on-surface-variant font-medium">
                Scan to download
              </p>
            </div>
            <p class="text-xs text-on-surface-variant">
              Works on iOS &amp; Android
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LandingDownloadComponent {
  readonly ExternalLinkIcon = ExternalLink;
  readonly QrCodeIcon = QrCode;
}
