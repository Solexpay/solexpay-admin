import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SiteNavComponent } from '../components/landing/site-nav.component';
import { SiteFooterComponent } from '../components/landing/site-footer.component';
import { LucideAngularModule, ArrowLeft, Shield, User, Database, Share2, Lock, Clock, Eye, Globe, Baby, RefreshCw, Mail } from 'lucide-angular';

@Component({
  selector: 'app-privacy-policy',
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
      <section class="pt-32 pb-12 bg-gradient-to-b from-secondary-fixed/30 to-surface">
        <div class="max-w-4xl mx-auto px-6">
          <!-- Back Link -->
          <a 
            routerLink="/" 
            class="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors mb-8"
          >
            <lucide-icon [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-icon>
            Back to Home
          </a>
          
          <!-- Header -->
          <div class="space-y-4">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/20 rounded-full text-sm font-medium text-secondary">
              <lucide-icon [img]="ShieldIcon" class="w-4 h-4"></lucide-icon>
              Data Protection
            </div>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface font-display tracking-tight">
              Privacy Policy
            </h1>
            <p class="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Solexpay respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and disclose your information.
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
          <div class="bg-surface-container rounded-2xl p-8 border border-outline-variant/30">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center shrink-0">
                <lucide-icon [img]="ShieldIcon" class="w-6 h-6 text-secondary"></lucide-icon>
              </div>
              <div class="space-y-3">
                <h2 class="text-xl font-bold text-on-surface font-display">Introduction</h2>
                <p class="text-on-surface-variant leading-relaxed">
                  Solexpay respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and disclose your information when you use the Solexpay platform, including our mobile application, website, and related services.
                </p>
                <p class="text-on-surface-variant leading-relaxed">
                  By using Solexpay, you agree to the collection and use of information in accordance with this Policy.
                </p>
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-container/20 rounded-lg text-sm text-tertiary">
                  <lucide-icon [img]="ShieldIcon" class="w-4 h-4"></lucide-icon>
                  Solexpay is a financial technology platform and not a bank
                </div>
                <p class="text-sm text-on-surface-variant">
                  Some services may be provided through licensed partner financial institutions.
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
            
            <!-- Section 1: Information We Collect -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="DatabaseIcon" class="w-5 h-5 text-primary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Information We Collect</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>We collect information to provide secure wallet services, transfers, and virtual card functionality. The types of information we collect fall into four categories.</p>
                
                <!-- Personal Information Card -->
                <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="UserIcon" class="w-4 h-4 text-primary"></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">Personal Information</h3>
                  </div>
                  <p class="text-sm">Includes your full name, phone number, email address, date of birth, residential address, profile photo, government‑issued ID, and selfie verification.</p>
                </div>
                
                <!-- Financial Information Card -->
                <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="DatabaseIcon" class="w-4 h-4 text-tertiary"></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">Financial Information</h3>
                  </div>
                  <p class="text-sm">Includes your wallet balances, transaction history, payment activity, transfer details, card usage data, and merchant transactions.</p>
                </div>
                
                <!-- Device Information Card -->
                <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="EyeIcon" class="w-4 h-4 text-secondary"></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">Device and Technical Information</h3>
                  </div>
                  <p class="text-sm">Includes your IP address, device type, operating system, app version, browser type, device ID, and login activity.</p>
                </div>
                
                <!-- Usage Information Card -->
                <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/20 space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                      <lucide-icon [img]="ClockIcon" class="w-4 h-4 text-on-surface-variant"></lucide-icon>
                    </div>
                    <h3 class="font-semibold text-on-surface">Usage Information</h3>
                  </div>
                  <p class="text-sm">Includes app interaction data, features you use, session activity, time spent on the platform, and navigation patterns.</p>
                </div>
              </div>
            </div>

            <!-- Section 2: How We Use Information -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="DatabaseIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">How We Use Your Information</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>We use your information for the following purposes:</p>
                
                <div class="grid sm:grid-cols-2 gap-4">
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Create and manage your account</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Verify your identity</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Process transactions</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Enable wallet services</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Issue virtual cards</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Prevent fraud and abuse</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Comply with legal obligations</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Improve Solexpay services</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Provide customer support</span>
                  </div>
                  <div class="flex items-start gap-3 p-4 bg-surface-container rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <span class="text-sm">Send service notifications</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: KYC -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="UserIcon" class="w-5 h-5 text-secondary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Identity Verification (KYC)</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>To comply with regulatory requirements, Solexpay may request:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>Your government ID</li>
                  <li>A selfie verification</li>
                  <li>Phone verification</li>
                  <li>Email verification</li>
                  <li>Additional documents where required</li>
                </ul>
                <div class="bg-secondary-fixed/50 rounded-lg p-4 border-l-4 border-secondary">
                  <p class="text-sm">We may restrict account functionality until verification is completed.</p>
                </div>
              </div>
            </div>

            <!-- Section 4: Sharing Information -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-error-container/50 flex items-center justify-center">
                  <lucide-icon [img]="Share2Icon" class="w-5 h-5 text-error"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Sharing of Information</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>We may share your information with:</p>
                
                <!-- Financial Partners -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-primary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="DatabaseIcon" class="w-3 h-3 text-primary"></lucide-icon>
                    </div>
                    Financial Partners
                  </h3>
                  <p class="text-sm pl-8">Licensed banks and card issuers that provide wallet infrastructure, card issuance, and payment processing. When we share data with a financial partner, their own privacy policy also applies to that part of the service.</p>
                </div>
                
                <!-- Verification Providers -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-secondary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="ShieldIcon" class="w-3 h-3 text-secondary"></lucide-icon>
                    </div>
                    Verification Providers
                  </h3>
                  <p class="text-sm pl-8">Third‑party services used for identity verification, fraud prevention, and compliance screening.</p>
                </div>
                
                <!-- Service Providers -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-tertiary-container/20 flex items-center justify-center">
                      <lucide-icon [img]="EyeIcon" class="w-3 h-3 text-tertiary"></lucide-icon>
                    </div>
                    Service Providers
                  </h3>
                  <p class="text-sm pl-8">Cloud hosting providers, analytics providers, customer support tools, and security monitoring services that help us operate the platform.</p>
                </div>
                
                <!-- Legal Authorities -->
                <div class="space-y-3">
                  <h3 class="font-semibold text-on-surface flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-error-container/50 flex items-center justify-center">
                      <lucide-icon [img]="LockIcon" class="w-3 h-3 text-error"></lucide-icon>
                    </div>
                    Legal Authorities
                  </h3>
                  <p class="text-sm pl-8">We may disclose information when required by law, by court order, upon regulatory request, or during a fraud investigation.</p>
                </div>
              </div>
            </div>

            <!-- Section 5: Security -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="LockIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Data Security</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>Solexpay implements comprehensive security measures including:</p>
                
                <div class="grid sm:grid-cols-2 gap-4">
                  <div class="flex items-center gap-3 p-4 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
                    <lucide-icon [img]="LockIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                    <span class="text-sm font-medium text-on-surface">Data encryption</span>
                  </div>
                  <div class="flex items-center gap-3 p-4 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
                    <lucide-icon [img]="DatabaseIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                    <span class="text-sm font-medium text-on-surface">Secure servers</span>
                  </div>
                  <div class="flex items-center gap-3 p-4 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
                    <lucide-icon [img]="UserIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                    <span class="text-sm font-medium text-on-surface">Access controls</span>
                  </div>
                  <div class="flex items-center gap-3 p-4 bg-tertiary-container/10 rounded-lg border border-tertiary-container/20">
                    <lucide-icon [img]="EyeIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                    <span class="text-sm font-medium text-on-surface">Monitoring systems</span>
                  </div>
                </div>
                
                <div class="bg-error-container/30 rounded-lg p-4 border-l-4 border-error">
                  <p class="text-sm text-on-error-container">
                    <span class="font-semibold">Important:</span> Despite these safeguards, no system is completely secure. We continuously work to improve our security measures.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 6: Data Retention -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <lucide-icon [img]="ClockIcon" class="w-5 h-5 text-on-surface-variant"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Data Retention</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>We retain your information:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>While your account is active</li>
                  <li>As required by law</li>
                  <li>For fraud prevention</li>
                  <li>For dispute resolution</li>
                </ul>
                <div class="bg-surface-container rounded-lg p-4">
                  <p class="text-sm">We may retain certain data even after account closure where required by legal obligations.</p>
                </div>
              </div>
            </div>

            <!-- Section 7: Your Rights -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="UserIcon" class="w-5 h-5 text-primary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Your Privacy Rights</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>You have the right to:</p>
                
                <div class="grid sm:grid-cols-2 gap-4">
                  <div class="bg-surface-container rounded-lg p-4 space-y-2">
                    <div class="flex items-center gap-2">
                      <lucide-icon [img]="EyeIcon" class="w-4 h-4 text-primary"></lucide-icon>
                      <span class="font-medium text-on-surface text-sm">Access</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Access your personal data</p>
                  </div>
                  <div class="bg-surface-container rounded-lg p-4 space-y-2">
                    <div class="flex items-center gap-2">
                      <lucide-icon [img]="RefreshCwIcon" class="w-4 h-4 text-secondary"></lucide-icon>
                      <span class="font-medium text-on-surface text-sm">Update</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Update your information</p>
                  </div>
                  <div class="bg-surface-container rounded-lg p-4 space-y-2">
                    <div class="flex items-center gap-2">
                      <lucide-icon [img]="LockIcon" class="w-4 h-4 text-tertiary"></lucide-icon>
                      <span class="font-medium text-on-surface text-sm">Closure</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Request account closure</p>
                  </div>
                  <div class="bg-surface-container rounded-lg p-4 space-y-2">
                    <div class="flex items-center gap-2">
                      <lucide-icon [img]="DatabaseIcon" class="w-4 h-4 text-error"></lucide-icon>
                      <span class="font-medium text-on-surface text-sm">Deletion</span>
                    </div>
                    <p class="text-xs text-on-surface-variant">Request data deletion where applicable</p>
                  </div>
                </div>
                
                <div class="bg-primary-container/10 rounded-lg p-4 border border-primary-container/20">
                  <h4 class="font-semibold text-on-surface mb-2 flex items-center gap-2">
                    <lucide-icon [img]="DatabaseIcon" class="w-4 h-4 text-primary"></lucide-icon>
                    Data Portability
                  </h4>
                  <p class="text-sm">You may request a copy of your data in a structured, commonly used format.</p>
                </div>
                
                <div class="bg-secondary-fixed/50 rounded-lg p-4 border-l-4 border-secondary">
                  <p class="text-sm text-on-surface-variant">
                    <span class="font-semibold text-on-surface">Note:</span> Some requests may be limited by legal obligations (for example, we cannot delete transaction data that we are required to keep for 5 years).
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 8: Cookies -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="EyeIcon" class="w-5 h-5 text-secondary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Cookies and Tracking Technologies</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>Solexpay may use cookies and similar technologies to:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>Improve user experience</li>
                  <li>Analyse usage</li>
                  <li>Maintain sessions</li>
                  <li>Enhance security</li>
                </ul>
                <div class="bg-surface-container rounded-lg p-4">
                  <p class="text-sm">You may disable cookies or similar tracking through your device settings or app permissions, but some features of the platform may not function properly as a result.</p>
                </div>
              </div>
            </div>

            <!-- Section 9: Third Party Services -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <lucide-icon [img]="GlobeIcon" class="w-5 h-5 text-on-surface-variant"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Third Party Services</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>Solexpay may contain links or integrations with third‑party services. We are not responsible for the privacy practices of those third parties.</p>
              </div>
            </div>

            <!-- Section 10: Children's Privacy -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-error-container/50 flex items-center justify-center">
                  <lucide-icon [img]="BabyIcon" class="w-5 h-5 text-error"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Children's Privacy</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <div class="bg-error-container/30 rounded-lg p-4 border border-error-container/50">
                  <p class="text-sm text-on-error-container">
                    <span class="font-semibold">Important:</span> Solexpay services are not intended for individuals under 18 years of age. We do not knowingly collect data from minors.
                  </p>
                </div>
              </div>
            </div>

            <!-- Section 11: Changes to Policy -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="RefreshCwIcon" class="w-5 h-5 text-tertiary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Changes to This Privacy Policy</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>We may update this Privacy Policy from time to time. We will notify users through:</p>
                <ul class="space-y-2 list-disc list-inside">
                  <li>App notifications</li>
                  <li>Email</li>
                  <li>Website updates</li>
                </ul>
                <p>Continued use of the platform after notice of material changes means you accept the updated Policy.</p>
              </div>
            </div>

            <!-- Section 12: International Transfers -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="GlobeIcon" class="w-5 h-5 text-primary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">International Data Transfers</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>Your information may be processed on servers located outside your country where required for service delivery.</p>
                <div class="bg-surface-container rounded-lg p-4">
                  <p class="text-sm">We ensure appropriate safeguards are in place to protect your data during international transfers.</p>
                </div>
              </div>
            </div>

            <!-- Section 13: Contact -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center">
                  <lucide-icon [img]="MailIcon" class="w-5 h-5 text-secondary"></lucide-icon>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-on-surface font-display">Contact Us</h2>
              </div>
              
              <div class="space-y-6 text-on-surface-variant leading-relaxed">
                <p>If you have questions about this Privacy Policy, contact:</p>
                <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/30">
                  <a 
                    href="mailto:support@solexpay.com.ng" 
                    class="inline-flex items-center gap-3 text-primary hover:text-primary-container font-semibold transition-colors"
                  >
                    <lucide-icon [img]="MailIcon" class="w-5 h-5"></lucide-icon>
                    support&#64;solexpay.com.ng
                  </a>
                </div>
              </div>
            </div>

            <!-- Related Documents -->
            <div class="bg-secondary-container/10 rounded-2xl p-8 border border-secondary-container/20">
              <div class="text-center space-y-4">
                <h3 class="font-bold text-on-surface font-display text-lg">Related Documents</h3>
                <p class="text-on-surface-variant leading-relaxed">
                  Make sure to also review our Terms of Service for complete understanding of your rights and obligations when using Solexpay.
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <a 
                    routerLink="/terms" 
                    class="px-6 py-3 bg-secondary text-on-secondary font-semibold rounded-xl hover:bg-secondary-container transition-colors"
                  >
                    Read Terms of Service
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
export class PrivacyPolicyPageComponent implements OnInit {
  private titleSvc = inject(Title);
  
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ShieldIcon = Shield;
  readonly UserIcon = User;
  readonly DatabaseIcon = Database;
  readonly Share2Icon = Share2;
  readonly LockIcon = Lock;
  readonly ClockIcon = Clock;
  readonly EyeIcon = Eye;
  readonly GlobeIcon = Globe;
  readonly BabyIcon = Baby;
  readonly RefreshCwIcon = RefreshCw;
  readonly MailIcon = Mail;

  ngOnInit() {
    this.titleSvc.setTitle('Privacy Policy — Solexpay');
  }
}
