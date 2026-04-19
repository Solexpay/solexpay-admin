import { Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: `
    <footer class="bg-inverse-surface text-surface py-20">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">

          <!-- Brand -->
          <div class="col-span-2 space-y-5">
            <div class="flex items-center gap-3">
              <img src="/logo-icon.png" alt="Solexpay" class="h-8 w-8 shrink-0 object-contain brightness-0 invert"/>
              <span class="text-2xl font-black tracking-tighter text-white font-display">Solexpay</span>
            </div>
            <p class="text-outline-variant text-sm leading-relaxed max-w-xs">Financial empowerment for the next generation of African leaders. Built for Nigerian students.</p>

            <!-- Contact emails -->
            <div class="space-y-1.5 text-sm">
              <a href="mailto:hello@solexpay.ng" class="flex items-center gap-2 text-outline-variant hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l7 5 7-5" stroke="currentColor" stroke-width="1.2"/></svg>
                hello&#64;solexpay.ng
              </a>
              <a href="mailto:support@solexpay.ng" class="flex items-center gap-2 text-outline-variant hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l7 5 7-5" stroke="currentColor" stroke-width="1.2"/></svg>
                support&#64;solexpay.ng
              </a>
              <a href="mailto:legal@solexpay.ng" class="flex items-center gap-2 text-outline-variant hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l7 5 7-5" stroke="currentColor" stroke-width="1.2"/></svg>
                legal&#64;solexpay.ng
              </a>
              <a href="mailto:admin@solexpay.ng" class="flex items-center gap-2 text-outline-variant hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l7 5 7-5" stroke="currentColor" stroke-width="1.2"/></svg>
                admin&#64;solexpay.ng
              </a>
              <a href="mailto:press@solexpay.ng" class="flex items-center gap-2 text-outline-variant hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M1 4l7 5 7-5" stroke="currentColor" stroke-width="1.2"/></svg>
                press&#64;solexpay.ng
              </a>
            </div>
          </div>

          <!-- Product -->
          <div>
            <h5 class="text-white font-bold mb-5 font-display">Product</h5>
            <ul class="space-y-3 text-outline-variant text-sm">
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Smart Wallet</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Academic Loans</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Goal Savings</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Bill Payments</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">P2P Transfers</li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h5 class="text-white font-bold mb-5 font-display">Company</h5>
            <ul class="space-y-3 text-outline-variant text-sm">
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">About Us</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Careers</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Contact</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Privacy Policy</li>
              <li class="hover:text-primary-fixed transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>

          <!-- Download -->
          <div>
            <h5 class="text-white font-bold mb-5 font-display">Download</h5>
            <div class="space-y-3">
              <!-- App Store -->
              <a href="#" class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer transition-colors">
                <svg class="w-6 h-6 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                <div>
                  <p class="text-[10px] text-outline-variant">Download on the</p>
                  <p class="text-sm font-bold text-white">App Store</p>
                </div>
              </a>
              <!-- Google Play -->
              <a href="#" class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer transition-colors">
                <svg class="w-6 h-6 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 010 2.594zM1.337.924a1.49 1.49 0 00-.271.83v20.49a1.49 1.49 0 00.278.84l.027.023 11.293-11.29v-.045L1.31.902zM14.58 17.679l-3.765-3.765L1.337 23.16c.495.525 1.29.59 1.865.16l11.378-5.641M14.58 6.43L3.203.793c-.576-.43-1.371-.365-1.866.16l10.478 10.246z"/>
                </svg>
                <div>
                  <p class="text-[10px] text-outline-variant">Get it on</p>
                  <p class="text-sm font-bold text-white">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div class="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-outline-variant text-xs">
          <p>© 2025 SolexPay Technologies Ltd. All rights reserved.</p>
          <div class="flex gap-6">
            <span class="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span class="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span class="hover:text-white cursor-pointer transition-colors">Help Center</span>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class SiteFooterComponent {}
