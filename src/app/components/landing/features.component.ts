import { Component } from '@angular/core';
import { LucideAngularModule, Send, Landmark, PiggyBank, Receipt } from 'lucide-angular';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [LucideAngularModule],
  styles: [`
    .editorial-gradient { background: linear-gradient(135deg, #005bbf 0%, #1a73e8 100%); }
    .feat-card { position: relative; overflow: hidden; border-radius: 1.5rem; cursor: default; }
    .feat-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
    .feat-card:hover img { transform: scale(1.06); }
    .feat-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,10,24,0.90) 0%, rgba(5,10,24,0.45) 55%, rgba(5,10,24,0.15) 100%); }
    .feat-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding: 2rem; }
    .feat-tag { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; border-radius: 999px; background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); color: white; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.15); }
  `],
  template: `
    <section id="features" class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12" data-aos="fade-up">
          <div>
            <p class="text-primary font-bold tracking-widest uppercase text-sm mb-3">Everything You Need</p>
            <h2 class="text-4xl md:text-5xl font-extrabold tracking-tighter font-display">Financial tools built for<br/>campus life.</h2>
          </div>
          <p class="text-on-surface-variant max-w-xs leading-relaxed">Every feature designed around the reality of being a Nigerian student.</p>
        </div>

        <!-- Bento grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Instant Transfers — large (2 cols) -->
          <div class="feat-card md:col-span-2 min-h-[380px]" data-aos="fade-up" data-aos-delay="0">
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop&q=80"
                 alt="Instant Transfers" loading="lazy"/>
            <div class="feat-overlay"></div>
            <div class="feat-content">
              <span class="feat-tag">
                <lucide-icon [img]="SendIcon" class="w-3 h-3"></lucide-icon>
                Instant Transfers
              </span>
              <h3 class="text-2xl md:text-3xl font-extrabold text-white font-display leading-tight mb-2">Send to any bank<br/>in seconds.</h3>
              <p class="text-white/70 text-sm leading-relaxed max-w-sm">No hidden fees, no pending anxiety. Just smooth transactions between friends and family — 24/7.</p>
            </div>
          </div>

          <!-- Student Loans — small (1 col) -->
          <div class="feat-card md:col-span-1 min-h-[380px]" data-aos="fade-up" data-aos-delay="80">
            <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80"
                 alt="Student Loans" loading="lazy"/>
            <div class="feat-overlay"></div>
            <div class="feat-content">
              <span class="feat-tag">
                <lucide-icon [img]="LandmarkIcon" class="w-3 h-3"></lucide-icon>
                Student Loans
              </span>
              <h3 class="text-xl font-extrabold text-white font-display leading-tight mb-2">Micro-loans, student terms.</h3>
              <p class="text-white/70 text-sm leading-relaxed">Flexible repayment plans built around your allowance schedule.</p>
            </div>
          </div>

          <!-- Smart Savings — small (1 col) -->
          <div class="feat-card md:col-span-1 min-h-[360px]" data-aos="fade-up" data-aos-delay="120">
            <img src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&auto=format&fit=crop&q=80"
                 alt="Smart Savings" loading="lazy"/>
            <div class="feat-overlay"></div>
            <div class="feat-content">
              <span class="feat-tag">
                <lucide-icon [img]="PiggyBankIcon" class="w-3 h-3"></lucide-icon>
                Smart Savings
              </span>
              <h3 class="text-xl font-extrabold text-white font-display leading-tight mb-2">Goals for rent, grad & beyond.</h3>
              <p class="text-white/70 text-sm leading-relaxed">Earn competitive interest while you hit your targets faster.</p>
            </div>
          </div>

          <!-- Bill Payments — large (2 cols) -->
          <div class="feat-card md:col-span-2 min-h-[360px]" data-aos="fade-up" data-aos-delay="160">
            <img src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&auto=format&fit=crop&q=80"
                 alt="Bill Payments" loading="lazy"/>
            <div class="feat-overlay"></div>
            <div class="feat-content">
              <span class="feat-tag">
                <lucide-icon [img]="ReceiptIcon" class="w-3 h-3"></lucide-icon>
                Bill Payments
              </span>
              <h3 class="text-2xl md:text-3xl font-extrabold text-white font-display leading-tight mb-2">JAMB, WAEC, school fees —<br/>all in one tap.</h3>
              <p class="text-white/70 text-sm leading-relaxed max-w-sm">Airtime and data at discounted student rates, available 24/7, zero stress.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  `
})
export class LandingFeaturesComponent {
  readonly SendIcon = Send;
  readonly LandmarkIcon = Landmark;
  readonly PiggyBankIcon = PiggyBank;
  readonly ReceiptIcon = Receipt;
}
