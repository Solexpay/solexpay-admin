import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-how-it-works',
  standalone: true,
  styles: [`
    .step-divider { background: linear-gradient(90deg, transparent, #005bbf30, transparent); }
    .step-num { -webkit-text-stroke: 2px rgba(0,91,191,0.08); color: transparent; font-size: clamp(6rem, 15vw, 11rem); }
    .ill-phone { filter: drop-shadow(0 20px 40px rgba(0,91,191,0.2)); }
    .ill-shield { filter: drop-shadow(0 16px 32px rgba(0,91,191,0.18)); }
    .ill-wallet { filter: drop-shadow(0 16px 32px rgba(0,91,191,0.18)); }
    .store-badge { background: rgba(15,23,42,0.9); }
  `],
  template: `
    <section id="how-it-works" class="overflow-hidden">
      <!-- Header -->
      <div class="max-w-7xl mx-auto px-6 pt-24 pb-4 text-center" data-aos="fade-up">
        <p class="text-primary font-bold tracking-widest uppercase text-sm mb-4">The Process</p>
        <h2 class="text-4xl md:text-5xl font-extrabold tracking-tighter font-display">Get started in 3 minutes</h2>
        <p class="text-on-surface-variant mt-4 max-w-lg mx-auto">Three simple steps stand between you and full control of your campus finances.</p>
      </div>

      <!-- ──────────── Step 01 ──────────── -->
      <div class="relative py-20 md:py-28">
        <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <!-- Text -->
          <div data-aos="fade-right" data-aos-duration="800">
            <span class="step-num font-black block leading-none mb-2 select-none">01</span>
            <div class="-mt-6">
              <p class="text-xs font-bold text-primary uppercase tracking-widest mb-3">Step One</p>
              <h3 class="text-3xl md:text-4xl font-extrabold tracking-tighter font-display mb-5">Download the App</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg mb-8">
                Find us on the App Store or Google Play. Create your account with just your phone number — it takes under two minutes, no paperwork needed.
              </p>
              <!-- mini store badges -->
              <div class="flex flex-wrap gap-3">
                <a href="#download" class="store-badge text-white rounded-xl px-5 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                  <div>
                    <p class="text-[9px] opacity-60 leading-none">Download on the</p>
                    <p class="text-sm font-bold leading-none">App Store</p>
                  </div>
                </a>
                <a href="#download" class="store-badge text-white rounded-xl px-5 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 010 2.594zM1.337.924a1.49 1.49 0 00-.271.83v20.49a1.49 1.49 0 00.278.84l.027.023 11.293-11.29v-.045L1.31.902zM14.58 17.679l-3.765-3.765L1.337 23.16c.495.525 1.29.59 1.865.16l11.378-5.641M14.58 6.43L3.203.793c-.576-.43-1.371-.365-1.866.16l10.478 10.246z"/>
                  </svg>
                  <div>
                    <p class="text-[9px] opacity-60 leading-none">Get it on</p>
                    <p class="text-sm font-bold leading-none">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <!-- Phone illustration -->
          <div class="flex justify-center" data-aos="fade-left" data-aos-duration="800" data-aos-delay="100">
            <svg class="ill-phone w-full max-w-[320px]" viewBox="0 0 280 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hiw1Grad" x1="0" y1="0" x2="280" y2="500" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#005bbf"/><stop offset="1" stop-color="#1a73e8"/>
                </linearGradient>
                <linearGradient id="hiw1Card" x1="0" y1="0" x2="240" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#005bbf"/><stop offset="1" stop-color="#1a73e8"/>
                </linearGradient>
              </defs>
              <!-- Phone frame -->
              <rect x="20" y="10" width="240" height="480" rx="36" fill="#0f172a"/>
              <!-- Dynamic island -->
              <rect x="100" y="24" width="80" height="18" rx="9" fill="#1e293b"/>
              <!-- Screen -->
              <rect x="26" y="46" width="228" height="438" rx="28" fill="#f8fafc"/>
              <!-- App bar header -->
              <rect x="26" y="46" width="228" height="60" rx="28" fill="url(#hiw1Card)"/>
              <rect x="26" y="76" width="228" height="30" fill="url(#hiw1Card)"/>
              <text x="140" y="82" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui" opacity="0.8">Good morning</text>
              <text x="140" y="98" text-anchor="middle" fill="white" font-size="14" font-weight="900" font-family="system-ui">Chidi</text>
              <!-- Balance card -->
              <rect x="40" y="120" width="200" height="100" rx="18" fill="url(#hiw1Card)"/>
              <text x="56" y="144" fill="white" font-size="9" font-weight="500" opacity="0.75">Total Balance</text>
              <text x="56" y="172" fill="white" font-size="26" font-weight="900" font-family="system-ui">₦45,200</text>
              <text x="56" y="190" fill="white" font-size="8" opacity="0.6">**** 4521 · Verified</text>
              <!-- Action buttons -->
              <rect x="44" y="238" width="46" height="46" rx="14" fill="#eff6ff"/>
              <text x="67" y="266" text-anchor="middle" fill="#1d4ed8" font-size="18" font-family="system-ui">↑</text>
              <rect x="98" y="238" width="46" height="46" rx="14" fill="#eff6ff"/>
              <text x="121" y="266" text-anchor="middle" fill="#1d4ed8" font-size="18" font-family="system-ui">↓</text>
              <rect x="152" y="238" width="46" height="46" rx="14" fill="#eff6ff"/>
              <text x="175" y="266" text-anchor="middle" fill="#1d4ed8" font-size="16" font-family="system-ui">₦</text>
              <rect x="206" y="238" width="46" height="46" rx="14" fill="#eff6ff"/>
              <text x="229" y="266" text-anchor="middle" fill="#1d4ed8" font-size="16" font-family="system-ui">☰</text>
              <!-- Download progress -->
              <text x="40" y="310" fill="#64748b" font-size="9" font-weight="700" font-family="system-ui">DOWNLOADING SOLEXPAY...</text>
              <rect x="40" y="318" width="200" height="10" rx="5" fill="#e2e8f0"/>
              <rect x="40" y="318" width="160" height="10" rx="5" fill="url(#hiw1Grad)"/>
              <!-- App icon floating in -->
              <circle cx="140" cy="395" r="38" fill="url(#hiw1Card)"/>
              <text x="140" y="404" text-anchor="middle" fill="white" font-size="28" font-weight="900" font-family="system-ui">S</text>
              <text x="140" y="450" text-anchor="middle" fill="#64748b" font-size="9" font-weight="600" font-family="system-ui">Tap to Open</text>
            </svg>
          </div>
        </div>
      </div>

      <div class="step-divider h-px max-w-4xl mx-auto"></div>

      <!-- ──────────── Step 02 ──────────── -->
      <div class="relative py-20 md:py-28 bg-surface-container-low">
        <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <!-- Shield illustration (left on desktop) -->
          <div class="flex justify-center order-last md:order-first" data-aos="fade-right" data-aos-duration="800" data-aos-delay="100">
            <svg class="ill-shield w-full max-w-[320px]" viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hiw2Grad" x1="0" y1="0" x2="320" y2="380" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#005bbf"/><stop offset="1" stop-color="#1a73e8"/>
                </linearGradient>
                <filter id="hiw2Shadow"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#005bbf30"/></filter>
              </defs>
              <!-- ID Card back -->
              <rect x="30" y="20" width="260" height="160" rx="20" fill="#e2e8f0" transform="rotate(-4 30 20)"/>
              <!-- ID Card front -->
              <rect x="22" y="30" width="262" height="164" rx="20" fill="white" filter="url(#hiw2Shadow)"/>
              <!-- Card top stripe -->
              <rect x="22" y="30" width="262" height="50" rx="20" fill="url(#hiw2Grad)"/>
              <rect x="22" y="60" width="262" height="20" fill="url(#hiw2Grad)"/>
              <text x="42" y="60" fill="white" font-size="13" font-weight="800" font-family="system-ui">Nigerian ID Card</text>
              <!-- Avatar area -->
              <circle cx="72" cy="145" r="30" fill="#cbd5e1"/>
              <circle cx="72" cy="134" r="12" fill="#94a3b8"/>
              <ellipse cx="72" cy="165" rx="20" ry="12" fill="#94a3b8"/>
              <!-- Lines -->
              <rect x="120" y="112" width="140" height="10" rx="5" fill="#e2e8f0"/>
              <rect x="120" y="130" width="110" height="8" rx="4" fill="#e2e8f0"/>
              <rect x="120" y="146" width="120" height="8" rx="4" fill="#e2e8f0"/>
              <rect x="120" y="162" width="90" height="8" rx="4" fill="#e2e8f0"/>
              <!-- Scan overlay lines -->
              <line x1="22" y1="125" x2="284" y2="125" stroke="url(#hiw2Grad)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.4"/>
              <line x1="22" y1="145" x2="284" y2="145" stroke="url(#hiw2Grad)" stroke-width="1" stroke-dasharray="4 6" opacity="0.25"/>
              <!-- Big shield -->
              <path d="M160 215 L76 248 L76 298 C76 340 115 368 160 378 C205 368 244 340 244 298 L244 248 Z" fill="url(#hiw2Grad)" opacity="0.1"/>
              <path d="M160 220 L82 252 L82 299 C82 339 118 365 160 374 C202 365 238 339 238 299 L238 252 Z" fill="none" stroke="url(#hiw2Grad)" stroke-width="3"/>
              <!-- Check inside shield -->
              <circle cx="160" cy="310" r="28" fill="url(#hiw2Grad)"/>
              <path d="M148 310 L157 320 L173 298" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <!-- Text -->
          <div data-aos="fade-left" data-aos-duration="800">
            <span class="step-num font-black block leading-none mb-2 select-none">02</span>
            <div class="-mt-6">
              <p class="text-xs font-bold text-primary uppercase tracking-widest mb-3">Step Two</p>
              <h3 class="text-3xl md:text-4xl font-extrabold tracking-tighter font-display mb-5">Verify Your Identity</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg mb-6">
                Submit your BVN or NIN through our secure, CBN-compliant KYC process. Verification is typically instant — and unlocks every feature from loans to transfers.
              </p>
              <div class="flex flex-col gap-3">
                @for (item of verifyPoints; track item) {
                  <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <svg class="w-3.5 h-3.5 text-primary" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <span class="text-sm text-on-surface-variant">{{ item }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-divider h-px max-w-4xl mx-auto"></div>

      <!-- ──────────── Step 03 ──────────── -->
      <div class="relative py-20 md:py-28">
        <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <!-- Text -->
          <div data-aos="fade-right" data-aos-duration="800">
            <span class="step-num font-black block leading-none mb-2 select-none">03</span>
            <div class="-mt-6">
              <p class="text-xs font-bold text-primary uppercase tracking-widest mb-3">Step Three</p>
              <h3 class="text-3xl md:text-4xl font-extrabold tracking-tighter font-display mb-5">Go Live, Go Free</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg mb-6">
                Fund your wallet and take off. Send money to friends, pay bills, apply for a student loan, or start a savings goal — all from one beautifully simple app.
              </p>
              <a href="#download" class="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl text-on-primary font-bold text-sm hover:brightness-110 hover:-translate-y-0.5 transition-all"
                 style="background: linear-gradient(135deg,#005bbf,#1a73e8);">
                Open Your Account
                <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            </div>
          </div>
          <!-- Wallet illustration -->
          <div class="flex justify-center" data-aos="fade-left" data-aos-duration="800" data-aos-delay="100">
            <svg class="ill-wallet w-full max-w-[340px]" viewBox="0 0 340 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hiw3Grad" x1="0" y1="0" x2="340" y2="320" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#005bbf"/><stop offset="1" stop-color="#1a73e8"/>
                </linearGradient>
                <filter id="hiw3Shadow"><feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#005bbf40"/></filter>
              </defs>
              <!-- Wallet body -->
              <rect x="30" y="120" width="280" height="170" rx="24" fill="url(#hiw3Grad)" filter="url(#hiw3Shadow)"/>
              <!-- Wallet flap open -->
              <path d="M30 120 Q170 80 310 120 L310 150 Q170 110 30 150 Z" fill="url(#hiw3Grad)" opacity="0.6"/>
              <!-- Card inside wallet -->
              <rect x="46" y="158" width="150" height="90" rx="14" fill="rgba(255,255,255,0.15)"/>
              <rect x="56" y="170" width="80" height="10" rx="5" fill="rgba(255,255,255,0.5)"/>
              <rect x="56" y="188" width="60" height="7" rx="3" fill="rgba(255,255,255,0.3)"/>
              <rect x="56" y="210" width="110" height="7" rx="3" fill="rgba(255,255,255,0.3)"/>
              <rect x="56" y="226" width="90" height="7" rx="3" fill="rgba(255,255,255,0.3)"/>
              <!-- Coin pocket -->
              <circle cx="256" cy="198" r="38" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
              <text x="256" y="206" text-anchor="middle" fill="white" font-size="22" font-weight="900" font-family="system-ui">₦</text>
              <!-- Floating naira coins -->
              <circle cx="110" cy="66" r="26" fill="url(#hiw3Grad)" opacity="0.95"/>
              <text x="110" y="74" text-anchor="middle" fill="white" font-size="17" font-weight="900" font-family="system-ui">₦</text>
              <circle cx="218" cy="42" r="18" fill="url(#hiw3Grad)" opacity="0.7"/>
              <text x="218" y="49" text-anchor="middle" fill="white" font-size="12" font-weight="900" font-family="system-ui">₦</text>
              <circle cx="54" cy="88" r="13" fill="url(#hiw3Grad)" opacity="0.5"/>
              <text x="54" y="94" text-anchor="middle" fill="white" font-size="9" font-weight="900" font-family="system-ui">₦</text>
              <circle cx="286" cy="78" r="10" fill="url(#hiw3Grad)" opacity="0.4"/>
              <text x="286" y="84" text-anchor="middle" fill="white" font-size="7" font-weight="900" font-family="system-ui">₦</text>
              <!-- Sparkle dots -->
              <circle cx="310" cy="50" r="5" fill="#1a73e8" opacity="0.5"/>
              <circle cx="24" cy="60" r="4" fill="#005bbf" opacity="0.4"/>
              <circle cx="330" cy="110" r="3" fill="#1a73e8" opacity="0.3"/>
              <circle cx="165" cy="22" r="3" fill="#005bbf" opacity="0.35"/>
              <!-- Transfer arrow -->
              <path d="M260 62 L290 62" stroke="url(#hiw3Grad)" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
              <path d="M282 54 L290 62 L282 70" stroke="url(#hiw3Grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingHowItWorksComponent {
  readonly verifyPoints = [
    'BVN or NIN accepted — instant result',
    'Bank-grade 256-bit encryption',
    'CBN-compliant KYC process',
    'No manual uploads or office visits',
  ];
}
