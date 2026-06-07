import { Component, OnInit, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Title } from "@angular/platform-browser";
import { SiteNavComponent } from "../components/landing/site-nav.component";
import { LandingHeroComponent } from "../components/landing/hero.component";
import { StatsStripComponent } from "../components/landing/stats-strip.component";
import { LandingFeaturesComponent } from "../components/landing/features.component";
import { LandingHowItWorksComponent } from "../components/landing/how-it-works.component";
import { LandingLoansCtaComponent } from "../components/landing/loans-cta.component";
import { LandingDownloadComponent } from "../components/landing/download.component";
import { LandingTestimonialsComponent } from "../components/landing/testimonials.component";
import { SiteFooterComponent } from "../components/landing/site-footer.component";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    SiteNavComponent,
    LandingHeroComponent,
    StatsStripComponent,
    LandingFeaturesComponent,
    LandingHowItWorksComponent,
    LandingLoansCtaComponent,
    LandingDownloadComponent,
    LandingTestimonialsComponent,
    SiteFooterComponent,
  ],
  template: `
    <app-site-nav />
    <main class="bg-surface">
      <app-landing-hero />
      <app-landing-stats />
      <app-landing-features />
      <app-landing-how-it-works />
      <app-landing-loans-cta />
      <app-landing-download />
      <app-landing-testimonials />
    </main>
    <app-site-footer />
  `,
})
export class LandingPageComponent implements OnInit {
  private titleSvc = inject(Title);
  private platformId = inject(PLATFORM_ID);

  async ngOnInit() {
    this.titleSvc.setTitle(
      "Solexpay — The Smarter Wallet for Nigerian Students",
    );
    if (isPlatformBrowser(this.platformId)) {
      const AOS = (await import("aos")) as unknown as {
        default?: { init: (config: Record<string, unknown>) => void };
        init: (config: Record<string, unknown>) => void;
      };
      (AOS.default ?? AOS).init({
        duration: 700,
        once: true,
        easing: "ease-out-cubic",
        offset: 60,
      });
    }
  }
}
