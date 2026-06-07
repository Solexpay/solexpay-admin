import { Component, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { SiteNavComponent } from "../components/landing/site-nav.component";
import { SiteFooterComponent } from "../components/landing/site-footer.component";
import {
  LucideAngularModule,
  Mail,
  MessageSquare,
  MapPin,
  Phone,
} from "lucide-angular";

@Component({
  selector: "app-contact",
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
        <div class="max-w-4xl mx-auto px-6 text-center">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/30 rounded-full text-sm font-medium text-primary mb-6"
          >
            <lucide-icon
              [img]="MessageSquareIcon"
              class="w-4 h-4"
            ></lucide-icon>
            Get in Touch
          </div>
          <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface font-display tracking-tight mb-4"
          >
            How can we help you?
          </h1>
          <p
            class="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
          >
            Have questions about Solexpay? We're here to help you every step of
            the way. Reach out to our team today.
          </p>
        </div>
      </section>

      <!-- Contact Info -->
      <section class="py-12 pb-24">
        <div class="max-w-5xl mx-auto px-6">
          <div class="grid md:grid-cols-3 gap-6">
            <!-- Support -->
            <div
              class="bg-surface-container rounded-2xl p-8 border border-outline-variant/30 text-center space-y-4 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div
                class="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center mx-auto"
              >
                <lucide-icon
                  [img]="MailIcon"
                  class="w-6 h-6 text-primary"
                ></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-on-surface font-display text-lg">
                  Support
                </h3>
                <p class="text-sm text-on-surface-variant mt-1">
                  For help with your account
                </p>
              </div>
              <a
                href="mailto:support@solexpay.ng"
                class="text-primary font-semibold hover:underline block"
                >support&#64;solexpay.ng</a
              >
            </div>

            <!-- Business -->
            <div
              class="bg-surface-container rounded-2xl p-8 border border-outline-variant/30 text-center space-y-4 hover:shadow-xl hover:shadow-secondary/5 transition-all"
            >
              <div
                class="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center mx-auto"
              >
                <lucide-icon
                  [img]="MessageSquareIcon"
                  class="w-6 h-6 text-secondary"
                ></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-on-surface font-display text-lg">
                  Business
                </h3>
                <p class="text-sm text-on-surface-variant mt-1">
                  For partnerships and inquiries
                </p>
              </div>
              <a
                href="mailto:hello@solexpay.ng"
                class="text-secondary font-semibold hover:underline block"
                >hello&#64;solexpay.ng</a
              >
            </div>

            <!-- Social -->
            <div
              class="bg-surface-container rounded-2xl p-8 border border-outline-variant/30 text-center space-y-4 hover:shadow-xl hover:shadow-tertiary/5 transition-all"
            >
              <div
                class="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center mx-auto"
              >
                <lucide-icon
                  [img]="GlobeIcon"
                  class="w-6 h-6 text-tertiary"
                ></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-on-surface font-display text-lg">
                  Connect
                </h3>
                <p class="text-sm text-on-surface-variant mt-1">
                  Follow us on social media
                </p>
              </div>
              <div class="flex justify-center gap-4">
                <span
                  class="text-tertiary font-semibold hover:underline cursor-pointer"
                  >Twitter</span
                >
                <span
                  class="text-tertiary font-semibold hover:underline cursor-pointer"
                  >Instagram</span
                >
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
export class ContactPageComponent implements OnInit {
  private titleSvc = inject(Title);

  readonly MailIcon = Mail;
  readonly MessageSquareIcon = MessageSquare;
  readonly MapPinIcon = MapPin;
  readonly PhoneIcon = Phone;
  readonly GlobeIcon = MessageSquare; // Using MessageSquare as fallback for now

  ngOnInit() {
    this.titleSvc.setTitle("Contact Us — Solexpay");
  }
}
