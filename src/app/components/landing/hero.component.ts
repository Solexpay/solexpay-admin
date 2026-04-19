import { Component } from '@angular/core';
import { LucideAngularModule, GraduationCap, CheckCircle2, Zap, Bell, UtensilsCrossed, PiggyBank, Plus, Send, Receipt, Wallet } from 'lucide-angular';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [LucideAngularModule],
  styles: [`
    .editorial-gradient { background: linear-gradient(135deg, #005bbf 0%, #1a73e8 100%); }
    .glass-card { background: rgba(255,255,255,0.85); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
    .phone-glow { box-shadow: 0 50px 100px -20px rgba(0,91,191,0.35), 0 20px 40px -10px rgba(0,91,191,0.20); }
    .phone-back { box-shadow: 0 40px 80px -20px rgba(0,109,44,0.25), 0 12px 28px rgba(0,0,0,0.14); }
    .phone-frame { background: linear-gradient(145deg, #1e293b 0%, #0f172a 60%, #020617 100%); aspect-ratio: 9 / 19.5; }
    .phone-frame-green { background: linear-gradient(145deg, #1f2937 0%, #111827 100%); aspect-ratio: 9 / 19.5; }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(3deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
    @keyframes float-delayed { 0%,100%{transform:translateY(-6px) rotate(-6deg)} 50%{transform:translateY(6px) rotate(-6deg)} }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite; }
  `],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 md:pb-28 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
      <!-- Left copy -->
      <div class="space-y-6 sm:space-y-8" data-aos="fade-right" data-aos-duration="700">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold tracking-widest uppercase">
          <lucide-icon [img]="GraduationCapIcon" class="w-3.5 h-3.5"></lucide-icon>
          Built for Nigerian Students
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-[4.25rem] font-extrabold tracking-tighter leading-[1.05] text-on-surface font-display">
          The smarter<br/>wallet for<br/><span class="text-primary">campus life.</span>
        </h1>

        <p class="text-base sm:text-lg text-on-surface-variant max-w-md leading-relaxed">
          Manage allowances, pay school fees, and access instant student loans — all in one beautifully simple app.
        </p>

        <div class="flex flex-wrap gap-3 sm:gap-4">
          <a href="#download" class="px-6 sm:px-8 py-3 sm:py-4 editorial-gradient text-on-primary font-bold rounded-xl shadow-xl shadow-primary/25 hover:brightness-110 hover:-translate-y-0.5 transition-all">
            Open Your Account
          </a>
          <a href="#features" class="px-8 py-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors">
            See Features
          </a>
        </div>

        <div class="pt-2">
          <p class="text-xs text-on-surface-variant mb-3 font-medium uppercase tracking-wider">Available on</p>
          <div class="flex flex-wrap gap-3">
            <!-- App Store badge -->
            <a href="#download" class="flex items-center gap-3 bg-on-surface text-surface px-5 py-3 rounded-xl hover:bg-on-surface/90 transition-all">
              <svg class="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              <div class="text-left">
                <p class="text-[10px] opacity-70 leading-none mb-0.5">Download on the</p>
                <p class="text-sm font-bold leading-none">App Store</p>
              </div>
            </a>
            <!-- Google Play badge -->
            <a href="#download" class="flex items-center gap-3 bg-on-surface text-surface px-5 py-3 rounded-xl hover:bg-on-surface/90 transition-all">
              <svg class="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 010 2.594zM1.337.924a1.49 1.49 0 00-.271.83v20.49a1.49 1.49 0 00.278.84l.027.023 11.293-11.29v-.045L1.31.902zM14.58 17.679l-3.765-3.765L1.337 23.16c.495.525 1.29.59 1.865.16l11.378-5.641M14.58 6.43L3.203.793c-.576-.43-1.371-.365-1.866.16l10.478 10.246z"/>
              </svg>
              <div class="text-left">
                <p class="text-[10px] opacity-70 leading-none mb-0.5">Get it on</p>
                <p class="text-sm font-bold leading-none">Google Play</p>
              </div>
            </a>
          </div>
        </div>

        <div class="pt-4">
          <p class="text-[11px] text-on-surface-variant mb-3 font-bold uppercase tracking-[0.18em]">Built on trusted Nigerian rails</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div class="bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/20 flex flex-col items-center gap-1.5">
              <img src="/trust/cbn.png" alt="Central Bank of Nigeria" class="h-8 w-auto object-contain" loading="lazy" />
              <span class="text-[10px] font-bold text-on-surface-variant tracking-wide">CBN Standards</span>
            </div>
            <div class="bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/20 flex flex-col items-center gap-1.5">
              <img src="/trust/nibss.png" alt="NIBSS" class="h-8 w-auto object-contain" loading="lazy" />
              <span class="text-[10px] font-bold text-on-surface-variant tracking-wide">NIBSS Connected</span>
            </div>
            <div class="bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/20 flex flex-col items-center gap-1.5">
              <img src="/trust/crc.png" alt="Credit Registry" class="h-8 w-auto object-contain" loading="lazy" />
              <span class="text-[10px] font-bold text-on-surface-variant tracking-wide">CRC Integrated</span>
            </div>
            <div class="bg-surface-container-low rounded-xl px-3 py-2.5 border border-outline-variant/20 flex flex-col items-center gap-1.5">
              <img src="/trust/nigeria.png" alt="Federal Republic of Nigeria" class="h-8 w-auto object-contain" loading="lazy" />
              <span class="text-[10px] font-bold text-on-surface-variant tracking-wide">Nigeria First</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right phone mockups -->
      <div class="relative flex justify-center items-center min-h-[420px] sm:min-h-[520px] md:min-h-[620px]" data-aos="fade-left" data-aos-duration="800" data-aos-delay="150">
        <div class="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Back phone — hidden on mobile -->
        <div class="absolute left-0 top-10 z-10 hidden sm:block w-[210px] phone-frame-green rounded-[2.75rem] p-[6px] phone-back animate-float-delayed">
          <div class="bg-slate-950 rounded-[2.55rem] p-1 h-full">
            <div class="bg-surface rounded-[2.3rem] overflow-hidden h-full">
              <div class="h-6 bg-slate-950 flex items-center justify-center rounded-t-[2.3rem]">
                <div class="w-16 h-4 bg-black rounded-full"></div>
              </div>
              <div class="p-4 flex flex-col gap-3 h-[calc(100%-1.5rem)]">
                <div class="bg-tertiary-container p-4 rounded-2xl text-on-tertiary-container">
                  <p class="text-[10px] font-bold opacity-80 mb-1">Loan Approved</p>
                  <p class="text-2xl font-black font-display">₦250,000</p>
                  <p class="text-[9px] opacity-70 mt-1">Disbursed to your wallet</p>
                </div>
                <div class="flex-1 flex flex-col gap-2 min-h-0">
                  <div class="flex-1 bg-surface-container-low px-3 rounded-xl flex justify-between items-center">
                    <span class="text-[10px] font-medium text-on-surface-variant">Next Payment</span>
                    <span class="text-[10px] font-bold text-on-surface">May 15</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low px-3 rounded-xl flex justify-between items-center">
                    <span class="text-[10px] font-medium text-on-surface-variant">Monthly</span>
                    <span class="text-[10px] font-bold text-tertiary">₦23,333</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low px-3 rounded-xl flex justify-between items-center">
                    <span class="text-[10px] font-medium text-on-surface-variant">Interest Rate</span>
                    <span class="text-[10px] font-bold text-on-surface">12% APR</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low px-3 rounded-xl flex justify-between items-center">
                    <span class="text-[10px] font-medium text-on-surface-variant">Tenor</span>
                    <span class="text-[10px] font-bold text-on-surface">12 months</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low px-3 rounded-xl flex justify-between items-center">
                    <span class="text-[10px] font-medium text-on-surface-variant">Remaining</span>
                    <span class="text-[10px] font-bold text-on-surface">₦210,000</span>
                  </div>
                </div>
                <div class="w-full py-2.5 bg-tertiary text-on-tertiary text-[11px] font-bold rounded-xl text-center">
                  View Schedule
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Front phone -->
        <div class="relative z-20 sm:ml-20 w-[210px] sm:w-[260px] phone-frame rounded-[3.25rem] p-[6px] sm:p-[7px] phone-glow animate-float">
          <div class="absolute left-[-3px] top-24 w-[3px] h-12 bg-slate-700 rounded-l-sm"></div>
          <div class="absolute left-[-3px] top-40 w-[3px] h-20 bg-slate-700 rounded-l-sm"></div>
          <div class="absolute right-[-3px] top-36 w-[3px] h-16 bg-slate-700 rounded-r-sm"></div>

          <div class="bg-slate-950 rounded-[2.9rem] p-1 h-full">
            <div class="bg-surface rounded-[2.65rem] overflow-hidden relative h-full">
              <div class="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-950 rounded-full z-30"></div>
              <div class="px-4 pt-10 pb-4 flex flex-col gap-3 h-full">
                <!-- Header -->
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full editorial-gradient flex items-center justify-center shadow-sm">
                      <img src="/logo-icon.png" alt="" class="w-5 h-5 object-contain brightness-0 invert"/>
                    </div>
                    <div>
                      <p class="text-[9px] text-on-surface-variant leading-none mb-0.5">Good morning</p>
                      <p class="text-xs font-bold text-on-surface leading-none">Chidi</p>
                    </div>
                  </div>
                  <div class="relative">
                    <lucide-icon [img]="BellIcon" class="w-4.5 h-4.5 text-outline"></lucide-icon>
                    <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full"></span>
                  </div>
                </div>

                <!-- Balance card — no quick actions inside, just the balance -->
                <div class="editorial-gradient px-4 py-4 rounded-2xl text-on-primary shadow-lg">
                  <p class="text-[9px] opacity-80 mb-1">Total Balance</p>
                  <div class="flex items-baseline gap-0.5">
                    <span class="text-xs font-medium">₦</span>
                    <h2 class="text-2xl font-black font-display">45,200</h2>
                    <span class="text-xs font-medium opacity-70">.00</span>
                  </div>
                  <p class="text-[8px] opacity-65 mt-0.5">**** 4521 · Verified</p>
                </div>

                <!-- Quick actions — own row, more space -->
                <div class="grid grid-cols-4 gap-2">
                  @for (action of quickActions; track action.label) {
                    <div class="bg-surface-container rounded-xl py-2.5 flex flex-col items-center gap-1">
                      <div class="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <lucide-icon [img]="action.icon" class="w-3.5 h-3.5 text-primary"></lucide-icon>
                      </div>
                      <p class="text-[8px] font-bold text-on-surface-variant leading-none">{{ action.label }}</p>
                    </div>
                  }
                </div>

                <div>
                  <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Recent Activity</p>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center bg-surface-container-low p-2.5 rounded-xl">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center">
                          <lucide-icon [img]="UtensilsIcon" class="w-3.5 h-3.5 text-primary"></lucide-icon>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold">Cafeteria</p>
                          <p class="text-[9px] text-outline">Food &amp; Drinks</p>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold text-error">-₦1,200</span>
                    </div>
                    <div class="flex justify-between items-center bg-surface-container-low p-2.5 rounded-xl">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-tertiary/10 rounded-lg flex items-center justify-center">
                          <lucide-icon [img]="PiggyBankIcon" class="w-3.5 h-3.5 text-tertiary"></lucide-icon>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold">Savings Goal</p>
                          <p class="text-[9px] text-outline">Hostel Fund</p>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold text-tertiary">+₦5,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating notifications -->
        <div class="absolute top-4 right-4 z-30 glass-card rounded-2xl px-4 py-3 shadow-lg border border-white/60 flex items-center gap-3 animate-float-delayed">
          <div class="w-8 h-8 bg-tertiary rounded-full flex items-center justify-center">
            <lucide-icon [img]="CheckIcon" class="w-4 h-4 text-on-tertiary"></lucide-icon>
          </div>
          <div>
            <p class="text-[11px] font-bold text-on-surface">Loan Approved!</p>
            <p class="text-[9px] text-on-surface-variant">₦250,000 disbursed</p>
          </div>
        </div>

        <div class="absolute bottom-6 right-2 z-30 glass-card rounded-2xl px-4 py-3 shadow-lg border border-white/60 flex items-center gap-3 animate-float">
          <div class="w-8 h-8 editorial-gradient rounded-full flex items-center justify-center">
            <lucide-icon [img]="ZapIcon" class="w-4 h-4 text-on-primary"></lucide-icon>
          </div>
          <div>
            <p class="text-[11px] font-bold text-on-surface">Transfer sent</p>
            <p class="text-[9px] text-on-surface-variant">₦8,000 · Instant</p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingHeroComponent {
  readonly GraduationCapIcon = GraduationCap;
  readonly CheckIcon = CheckCircle2;
  readonly ZapIcon = Zap;
  readonly BellIcon = Bell;
  readonly UtensilsIcon = UtensilsCrossed;
  readonly PiggyBankIcon = PiggyBank;

  readonly quickActions = [
    { icon: Plus, label: 'Fund' },
    { icon: Send, label: 'Send' },
    { icon: Receipt, label: 'Bills' },
    { icon: Wallet, label: 'Save' },
  ];
}
