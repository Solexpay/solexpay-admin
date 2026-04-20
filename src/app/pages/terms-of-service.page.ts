import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SiteNavComponent } from '../components/landing/site-nav.component';
import { SiteFooterComponent } from '../components/landing/site-footer.component';
import { LucideAngularModule, ArrowLeft, FileText, Shield, CreditCard, Lock, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [
    RouterLink,
    SiteNavComponent,
    SiteFooterComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-surface">
      <!-- Navigation -->
      <app-site-nav />
      
      <!-- Hero Section -->
      <section class="pt-32 pb-12 bg-gradient-to-b from-primary-fixed/30 to-surface">
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
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/20 rounded-full text-sm font-medium text-primary">
              <lucide-icon [img]="FileTextIcon" class="w-4 h-4"></lucide-icon>
              Legal Documents
            </div>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface font-display tracking-tight">
              Terms of Service
            </h1>
            <p class="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              These Terms of Service govern your use of the Solexpay platform, including our mobile application, website, and related services.
            </p>
            <p class="text-sm text-on-surface-variant/70">
              Last updated: April 2026
            </p>
          </div>
        </div>
      </section>

      <!-- Notice Banner -->
      <section class="py-8">
        <div class="max-w-4xl mx-auto px-6">
          <div class="bg-secondary-fixed/50 border-l-4 border-secondary rounded-r-xl p-6">
            <div class="flex items-start gap-4">
              <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5 text-secondary shrink-0 mt-0.5"></lucide-icon>
              <div class="space-y-2">
                <h3 class="font-semibold text-on-surface font-display">Notice</h3>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  These Terms of Service govern your use of the Solexpay platform, including our mobile application, website, and related services.
                </p>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  By accessing or using Solexpay, you agree to be bound by these Terms. If you do not agree, you may not use the Services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12">
        <div class="max-w-4xl mx-auto px-6">
          <div class="space-y-12">
            
            <!-- Section 1: About -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="ShieldIcon" class="w-5 h-5 text-primary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">1. About Solexpay</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.1 What We Do</h3>
                  <p>Solexpay provides financial technology services that enable users to hold wallet balances, send and receive money, create virtual payment cards, and make payments.</p>
                  <p>Solexpay is not a bank. Banking and card services are provided through licensed partner financial institutions where applicable.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.2 Definitions</h3>
                  <ul class="space-y-2 list-disc list-inside">
                    <li><span class="font-medium text-on-surface">"Solexpay", "we", "us", or "our"</span> refers to Solexpay.</li>
                    <li><span class="font-medium text-on-surface">"User"</span> refers to any individual accessing the Solexpay platform.</li>
                    <li><span class="font-medium text-on-surface">"Account"</span> refers to your Solexpay wallet and related services.</li>
                    <li><span class="font-medium text-on-surface">"Services"</span> refer to all features provided by Solexpay including wallets, transfers, and virtual cards.</li>
                    <li><span class="font-medium text-on-surface">"Wallet Balance"</span> refers to the electronic value held in your Solexpay account, which is not a bank deposit.</li>
                  </ul>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.3 Services Provided</h3>
                  <p>Solexpay provides the following services:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Digital wallet services</li>
                    <li>Peer to peer transfers</li>
                    <li>Wallet balance holding</li>
                    <li>Virtual card issuance</li>
                    <li>Online payment processing</li>
                    <li>Merchant payments</li>
                    <li>Campus payments</li>
                    <li>Association and event collections</li>
                    <li>Currency conversion where applicable</li>
                    <li>Transaction history and account tools</li>
                  </ul>
                  <p class="text-sm bg-surface-container rounded-lg p-4">Services may be modified or updated at any time.</p>
                </div>
              </div>
            </div>

            <!-- Section 2: Account -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="LockIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">2. Account Requirements</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.4 Account Registration</h3>
                  <p>To use Solexpay, you must create an Account.</p>
                  <p>During registration, you agree to:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Provide accurate information</li>
                    <li>Use your real identity</li>
                    <li>Provide valid contact details</li>
                    <li>Complete verification when requested</li>
                  </ul>
                  <p class="mt-3">Solexpay may request:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Full name</li>
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Date of birth</li>
                    <li>Government ID</li>
                    <li>Selfie verification</li>
                    <li>Additional KYC information</li>
                  </ul>
                  <p class="text-sm bg-error-container/50 rounded-lg p-4 mt-3">
                    <span class="font-medium text-on-error-container">Important:</span> Failure to provide accurate information may result in account suspension.
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.5 Eligibility</h3>
                  <p>To use Solexpay, you must:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Be at least 18 years old</li>
                    <li>Use valid identification</li>
                    <li>Not be restricted by law</li>
                    <li>Not be on sanctions list</li>
                    <li>Not use services for illegal activity</li>
                  </ul>
                  <p>Solexpay reserves the right to refuse access.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.6 Wallet Usage</h3>
                  <p>Your wallet allows you to:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Hold funds</li>
                    <li>Send money</li>
                    <li>Receive money</li>
                    <li>Pay merchants</li>
                    <li>Fund virtual cards</li>
                    <li>Make payments</li>
                  </ul>
                  <p class="text-sm bg-surface-container rounded-lg p-4 mt-3">
                    <span class="font-medium text-on-surface">Note:</span> Wallet balances are not bank deposits. Funds may be held with licensed partner institutions.
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.7 Virtual Cards</h3>
                  <p>Solexpay allows users to create virtual payment cards for online transactions.</p>
                  <p>Virtual cards may be used for:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Online payments</li>
                    <li>Subscriptions</li>
                    <li>International payments</li>
                    <li>Merchant purchases</li>
                  </ul>
                  <p class="mt-3">Solexpay may:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Charge card issuance fees</li>
                    <li>Limit card usage</li>
                    <li>Freeze cards</li>
                    <li>Close cards</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Section 3: Usage Rules -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-error-container/50 flex items-center justify-center">
                  <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5 text-error"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">3. Usage Rules & Restrictions</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.8 Prohibited Transactions</h3>
                  <p>You may not use Solexpay for:</p>
                  <div class="grid sm:grid-cols-2 gap-3 mt-3">
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Gambling or betting</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Adult content services</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Escort services</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Illegal goods</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Fraudulent transactions</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Money laundering</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Sanctioned merchants</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Dark web services</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Unauthorized reselling</span>
                    </div>
                    <div class="bg-error-container/30 rounded-lg p-3 text-sm">
                      <span class="font-medium text-on-error-container">Terrorism financing</span>
                    </div>
                  </div>
                  <p class="text-sm mt-3">Solexpay may decline such transactions automatically.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.9 Fees and Charges</h3>
                  <p>Solexpay may charge:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Card creation fees</li>
                    <li>Transaction fees</li>
                    <li>Currency conversion fees</li>
                    <li>Withdrawal fees</li>
                    <li>Processing fees</li>
                    <li>Inactivity fees</li>
                    <li>Merchant fees</li>
                  </ul>
                  <p class="text-sm bg-surface-container rounded-lg p-4 mt-3">
                    All fees are displayed within the platform. Fees may change at any time.
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.10 Funding Your Account</h3>
                  <p>You may fund your account using supported methods.</p>
                  <p>Solexpay may:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Apply funding limits</li>
                    <li>Delay transactions</li>
                    <li>Reject transactions</li>
                    <li>Conduct compliance checks</li>
                  </ul>
                  <p class="text-sm mt-3">All funding is subject to verification.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.11 Transfers</h3>
                  <p>You may send money using:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Solexpay ID</li>
                    <li>Email</li>
                    <li>Username</li>
                    <li>Wallet transfers</li>
                  </ul>
                  <p class="mt-3">Transfers may be:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Instant</li>
                    <li>Delayed for review</li>
                    <li>Reversed if fraudulent</li>
                  </ul>
                  <p class="text-sm bg-error-container/50 rounded-lg p-4 mt-3">
                    <span class="font-medium text-on-error-container">Important:</span> Solexpay is not responsible for wrong transfers made by users.
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.12 Security</h3>
                  <p>You are responsible for:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Your password</li>
                    <li>OTP codes</li>
                    <li>Device access</li>
                    <li>Account activity</li>
                  </ul>
                  <p class="mt-3">You must notify Solexpay immediately if:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Your account is compromised</li>
                    <li>You notice unauthorized transactions</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Section 4: Account Management -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <lucide-icon [img]="CreditCardIcon" class="w-5 h-5 text-on-surface-variant"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">4. Account Management</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.13 Suspension and Termination</h3>
                  <p>Solexpay may suspend or terminate your account if:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>You violate these Terms</li>
                    <li>Suspicious activity detected</li>
                    <li>Fraud risk identified</li>
                    <li>Regulatory request received</li>
                    <li>False information provided</li>
                  </ul>
                  <p class="text-sm mt-3">Funds may be held during investigation.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.14 Account Closure and Deletion</h3>
                  <p>You may close or delete your Solexpay account at any time if you no longer wish to use the Services.</p>
                  <p class="mt-3">Before closing your account, you must:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Withdraw any remaining wallet balance</li>
                    <li>Complete any pending transactions</li>
                    <li>Resolve any outstanding obligations</li>
                  </ul>
                  <p class="mt-3">To request account deletion, you may:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Use the account deletion option within the app, where available</li>
                    <li>Contact Solexpay support through the official support channels</li>
                  </ul>
                  <p class="mt-3">Upon receiving a valid deletion request, Solexpay will:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Disable access to your account</li>
                    <li>Close your wallets and virtual cards</li>
                    <li>Remove access to platform services</li>
                  </ul>
                  <p class="mt-3">Solexpay may retain certain information after account closure where required for:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Legal compliance</li>
                    <li>Regulatory obligations</li>
                    <li>Fraud prevention</li>
                    <li>Dispute resolution</li>
                    <li>Financial record keeping</li>
                  </ul>
                  <p class="text-sm bg-error-container/50 rounded-lg p-4 mt-3">
                    <span class="font-medium text-on-error-container">Note:</span> Account deletion is permanent and cannot be reversed once completed.
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.15 Refunds</h3>
                  <p>Refunds depend on:</p>
                  <ul class="space-y-2 list-disc list-inside">
                    <li>Merchant approval</li>
                    <li>Card network rules</li>
                    <li>Transaction type</li>
                  </ul>
                  <p class="mt-3">Refund timelines vary and may take several business days.</p>
                  <p class="text-sm">Solexpay does not guarantee refunds.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.16 Limitation of Liability</h3>
                  <p>Solexpay is not responsible for merchant failures, payment network downtime, card provider issues, exchange rate changes, user mistakes, or third‑party services.</p>
                  <p class="mt-3">Nothing in this section limits our liability for fraud, death, personal injury, or breach of applicable financial regulations.</p>
                  <p class="text-sm bg-surface-container rounded-lg p-4 mt-3">
                    Use of Solexpay is at your own risk, subject to applicable law.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 5: Legal -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="FileTextIcon" class="w-5 h-5 text-primary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">5. Legal Information</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.17 Privacy</h3>
                  <p>Your use of Solexpay is also governed by our Privacy Policy.</p>
                  <p>We collect and process data in accordance with applicable laws.</p>
                  <p class="text-sm mt-3">
                    <a routerLink="/privacy" class="text-primary hover:underline font-medium">View our Privacy Policy →</a>
                  </p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.18 Changes to Terms</h3>
                  <p>Solexpay may update these Terms at any time.</p>
                  <p>Continued use of the platform means you accept the updated Terms.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.19 Governing Law</h3>
                  <p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
                  <p class="mt-3">Before filing any legal claim, you must first submit a written complaint to <a href="mailto:support@solexpay.com.ng" class="text-primary hover:underline">support&#64;solexpay.com.ng</a>. We will respond within 14 days.</p>
                  <p class="mt-3">Any disputes not resolved shall be brought exclusively in the courts of Lagos State.</p>
                </div>
                
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface">1.20 Contact</h3>
                  <p>For questions, contact <a href="mailto:support@solexpay.com.ng" class="text-primary hover:underline">support&#64;solexpay.com.ng</a> or visit <a href="https://www.solexpay.com.ng" target="_blank" rel="noopener" class="text-primary hover:underline">www.solexpay.com.ng</a>.</p>
                </div>
              </div>
            </div>

            <!-- Acknowledgment -->
            <div class="bg-primary-container/10 rounded-2xl p-8 border border-primary-container/20">
              <div class="text-center space-y-4">
                <h3 class="font-bold text-on-surface font-display text-lg">Acknowledgment</h3>
                <p class="text-on-surface-variant leading-relaxed">
                  By using Solexpay, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
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
  `
})
export class TermsOfServicePageComponent implements OnInit {
  private titleSvc = inject(Title);
  
  readonly ArrowLeftIcon = ArrowLeft;
  readonly FileTextIcon = FileText;
  readonly ShieldIcon = Shield;
  readonly CreditCardIcon = CreditCard;
  readonly LockIcon = Lock;
  readonly AlertCircleIcon = AlertCircle;

  ngOnInit() {
    this.titleSvc.setTitle('Terms of Service — Solexpay');
  }
}
