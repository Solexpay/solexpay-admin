import { Component, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { SiteNavComponent } from "../components/landing/site-nav.component";
import { SiteFooterComponent } from "../components/landing/site-footer.component";
import {
  LucideAngularModule,
  ArrowLeft,
  Cookie,
  Eye,
  Shield,
  Settings,
  Info,
  Bell,
  RefreshCw,
  Mail,
} from "lucide-angular";

@Component({
  selector: "app-cookie-policy",
  standalone: true,
  imports: [
    RouterLink,
    SiteNavComponent,
    SiteFooterComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="min-h-screen bg-surface">
      <!-- Navigation -->
      <app-site-nav />

      <!-- Hero Section -->
      <section
        class="pt-32 pb-12 bg-gradient-to-b from-primary-container/20 to-surface"
      >
        <div class="max-w-4xl mx-auto px-6">
          <!-- Back Link -->
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors mb-8"
          >
            <lucide-icon [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-icon>
            Back to Home
          </a>

          <!-- Header -->
          <div class="space-y-4">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/30 rounded-full text-sm font-medium text-primary"
            >
              <lucide-icon [img]="CookieIcon" class="w-4 h-4"></lucide-icon>
              Privacy & Experience
            </div>
            <h1
              class="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface font-display tracking-tight"
            >
              Cookie Policy
            </h1>
            <p
              class="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed"
            >
              This policy explains how Solexpay uses cookies and similar
              technologies to provide, customize, and improve our services.
            </p>
            <p class="text-sm text-on-surface-variant/70">
              Last updated: April 2026
            </p>
          </div>
        </div>
      </section>

      <!-- Introduction Banner -->
      <section class="py-8">
        <div class="max-w-4xl mx-auto px-6">
          <div
            class="bg-surface-container rounded-2xl p-8 border border-outline-variant/30"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0"
              >
                <lucide-icon
                  [img]="CookieIcon"
                  class="w-6 h-6 text-primary"
                ></lucide-icon>
              </div>
              <div class="space-y-3">
                <h2 class="text-xl font-bold text-on-surface font-display">
                  What are Cookies?
                </h2>
                <p class="text-on-surface-variant leading-relaxed">
                  Cookies are small text files that are stored on your device
                  when you visit a website or use a mobile application. They are
                  widely used to make platforms work more efficiently and to
                  provide information to the owners of the platform.
                </p>
                <div
                  class="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/20 rounded-lg text-sm text-secondary"
                >
                  <lucide-icon [img]="InfoIcon" class="w-4 h-4"></lucide-icon>
                  Cookies help us remember your preferences
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12">
        <div class="max-w-4xl mx-auto px-6">
          <div class="space-y-12">
            <!-- Section 1: Why We Use Cookies -->
            <div class="space-y-6">
              <div
                class="flex items-center gap-3 pb-4 border-b border-outline-variant/30"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="EyeIcon"
                    class="w-5 h-5 text-primary"
                  ></lucide-icon>
                </div>
                <h2
                  class="text-xl sm:text-2xl font-bold text-on-surface font-display"
                >
                  Why We Use Cookies
                </h2>
              </div>

              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>
                  We use cookies and similar technologies for several reasons,
                  including:
                </p>

                <!-- Essential Cookies Card -->
                <div
                  class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-error-container/20 flex items-center justify-center"
                    >
                      <lucide-icon
                        [img]="ShieldIcon"
                        class="w-4 h-4 text-error"
                      ></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">
                      Essential Cookies
                    </h3>
                  </div>
                  <p class="text-sm">
                    These are strictly necessary to provide you with services
                    available through our platform and to use some of its
                    features, such as access to secure areas. Because these
                    cookies are strictly necessary to deliver the platform, you
                    cannot refuse them without impacting how our platform
                    functions.
                  </p>
                </div>

                <!-- Performance and Functionality Card -->
                <div
                  class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center"
                    >
                      <lucide-icon
                        [img]="SettingsIcon"
                        class="w-4 h-4 text-secondary"
                      ></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">
                      Performance and Functionality
                    </h3>
                  </div>
                  <p class="text-sm">
                    These cookies are used to enhance the performance and
                    functionality of our platform but are non‑essential to its
                    use. However, without these cookies, certain functionality
                    may become unavailable.
                  </p>
                </div>

                <!-- Analytics Card -->
                <div
                  class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center"
                    >
                      <lucide-icon
                        [img]="InfoIcon"
                        class="w-4 h-4 text-tertiary"
                      ></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">
                      Analytics and Customization
                    </h3>
                  </div>
                  <p class="text-sm">
                    These cookies collect information that is used in aggregate
                    form to help us understand how our platform is being used or
                    how effective our marketing campaigns are, or to help us
                    customize our platform for you.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 2: Specific Technologies -->
            <div class="space-y-6">
              <div
                class="flex items-center gap-3 pb-4 border-b border-outline-variant/30"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="SettingsIcon"
                    class="w-5 h-5 text-secondary"
                  ></lucide-icon>
                </div>
                <h2
                  class="text-xl sm:text-2xl font-bold text-on-surface font-display"
                >
                  Technologies We Use
                </h2>
              </div>

              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>
                  In addition to cookies, we may use other similar technologies
                  like web beacons (sometimes called "tracking pixels" or "clear
                  gifs"). These are tiny graphics files that contain a unique
                  identifier that enable us to recognize when someone has
                  visited our platform or opened an e‑mail that we have sent
                  them.
                </p>

                <div
                  class="bg-primary-container/10 rounded-lg p-6 border border-primary-container/20 space-y-4"
                >
                  <h4 class="font-bold text-on-surface">Local Storage</h4>
                  <p class="text-sm">
                    We use local storage (like localStorage and sessionStorage)
                    to store your preferences and session state locally on your
                    device, providing a faster and more consistent experience.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 3: How to Control Cookies -->
            <div class="space-y-6">
              <div
                class="flex items-center gap-3 pb-4 border-b border-outline-variant/30"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="RefreshCwIcon"
                    class="w-5 h-5 text-tertiary"
                  ></lucide-icon>
                </div>
                <h2
                  class="text-xl sm:text-2xl font-bold text-on-surface font-display"
                >
                  How to Control Cookies
                </h2>
              </div>

              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>
                  You have the right to decide whether to accept or reject
                  cookies. You can exercise your cookie preferences by:
                </p>

                <ul class="space-y-4">
                  <li
                    class="flex items-start gap-3 p-4 bg-surface-container rounded-lg"
                  >
                    <div
                      class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <lucide-icon
                        [img]="SettingsIcon"
                        class="w-3 h-3 text-primary"
                      ></lucide-icon>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">
                        Browser Settings
                      </p>
                      <p class="text-xs text-on-surface-variant mt-1">
                        Adjusting your web browser controls to accept or refuse
                        cookies. If you choose to reject cookies, you may still
                        use our platform though your access to some
                        functionality and areas may be restricted.
                      </p>
                    </div>
                  </li>
                  <li
                    class="flex items-start gap-3 p-4 bg-surface-container rounded-lg"
                  >
                    <div
                      class="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <lucide-icon
                        [img]="BellIcon"
                        class="w-3 h-3 text-secondary"
                      ></lucide-icon>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">
                        In-App Preferences
                      </p>
                      <p class="text-xs text-on-surface-variant mt-1">
                        Managing your data and privacy preferences directly
                        within the Solexpay mobile application settings.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Section 4: Policy Updates -->
            <div class="space-y-6">
              <div
                class="flex items-center gap-3 pb-4 border-b border-outline-variant/30"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-error-container/20 flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="RefreshCwIcon"
                    class="w-5 h-5 text-error"
                  ></lucide-icon>
                </div>
                <h2
                  class="text-xl sm:text-2xl font-bold text-on-surface font-display"
                >
                  Updates to This Policy
                </h2>
              </div>

              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>
                  We may update this Cookie Policy from time to time in order to
                  reflect, for example, changes to the cookies we use or for
                  other operational, legal or regulatory reasons. Please
                  therefore re‑visit this Cookie Policy regularly to stay
                  informed about our use of cookies and related technologies.
                </p>
              </div>
            </div>

            <!-- Section 5: Contact -->
            <div class="space-y-6">
              <div
                class="flex items-center gap-3 pb-4 border-b border-outline-variant/30"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="MailIcon"
                    class="w-5 h-5 text-secondary"
                  ></lucide-icon>
                </div>
                <h2
                  class="text-xl sm:text-2xl font-bold text-on-surface font-display"
                >
                  Contact Us
                </h2>
              </div>

              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>
                  If you have any questions about our use of cookies or other
                  technologies, please email us at:
                </p>
                <div
                  class="bg-surface-container rounded-xl p-6 border border-outline-variant/30"
                >
                  <a
                    href="mailto:legal@solexpay.com.ng"
                    class="inline-flex items-center gap-3 text-primary hover:text-primary-container font-semibold transition-colors"
                  >
                    <lucide-icon [img]="MailIcon" class="w-5 h-5"></lucide-icon>
                    legal&#64;solexpay.com.ng
                  </a>
                </div>
              </div>
            </div>

            <!-- Related Documents -->
            <div
              class="bg-primary-container/10 rounded-2xl p-8 border border-primary-container/20"
            >
              <div class="text-center space-y-4">
                <h3 class="font-bold text-on-surface font-display text-lg">
                  Your Privacy Matters
                </h3>
                <p class="text-on-surface-variant leading-relaxed">
                  Cookies are just one part of how we protect your data. For
                  more information, please read our full Privacy Policy.
                </p>
                <div
                  class="flex flex-col sm:flex-row gap-3 justify-center pt-4"
                >
                  <a
                    routerLink="/privacy"
                    class="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container transition-colors"
                  >
                    Read Privacy Policy
                  </a>
                  <a
                    routerLink="/"
                    class="px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container transition-colors"
                  >
                    Return to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <app-site-footer />
    </div>
  `,
})
export class CookiePolicyPageComponent implements OnInit {
  private titleSvc = inject(Title);

  readonly ArrowLeftIcon = ArrowLeft;
  readonly CookieIcon = Cookie;
  readonly EyeIcon = Eye;
  readonly ShieldIcon = Shield;
  readonly SettingsIcon = Settings;
  readonly InfoIcon = Info;
  readonly BellIcon = Bell;
  readonly RefreshCwIcon = RefreshCw;
  readonly MailIcon = Mail;

  ngOnInit() {
    this.titleSvc.setTitle("Cookie Policy — Solexpay");
  }
}
