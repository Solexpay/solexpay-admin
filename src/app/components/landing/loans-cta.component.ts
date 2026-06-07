import { Component } from "@angular/core";
import { LucideAngularModule, ShieldCheck } from "lucide-angular";

@Component({
  selector: "app-landing-loans-cta",
  standalone: true,
  imports: [LucideAngularModule],
  styles: [
    `
      .editorial-gradient {
        background: linear-gradient(135deg, #005bbf 0%, #1a73e8 100%);
      }
    `,
  ],
  template: `
    <section id="loans" class="max-w-7xl mx-auto px-6 mb-24">
      <div
        class="editorial-gradient rounded-[2.5rem] p-12 md:p-20 text-on-primary overflow-hidden relative"
        data-aos="fade-up"
      >
        <div
          class="absolute inset-0 opacity-5 pointer-events-none overflow-hidden rounded-[2.5rem]"
        >
          <div
            class="absolute -right-20 -top-20 w-96 h-96 bg-white rounded-full"
          ></div>
          <div
            class="absolute -left-10 -bottom-10 w-64 h-64 bg-white rounded-full"
          ></div>
        </div>
        <div class="relative z-10 max-w-2xl">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center"
            >
              <img
                src="/logo-icon.png"
                alt="Solexpay"
                class="w-9 h-auto object-contain brightness-0 invert"
              />
            </div>
            <div
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-xs font-bold tracking-wider uppercase"
            >
              <lucide-icon
                [img]="ShieldCheckIcon"
                class="w-3.5 h-3.5"
              ></lucide-icon>
              CBN Regulated · Instant Disbursement
            </div>
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight font-display"
          >
            School fees shouldn't<br />stop you.
          </h2>
          <p
            class="text-base sm:text-xl opacity-90 mb-8 sm:mb-10 leading-relaxed"
          >
            Focus on your exams, we'll handle the finances. Get academic loans
            deposited instantly to your wallet.
          </p>
          <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-10">
            @for (stat of loanStats; track stat.label; let i = $index) {
              <div
                class="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5"
                data-aos="fade-up"
                [attr.data-aos-delay]="i * 100"
              >
                <p class="text-xs font-medium opacity-70 mb-1">
                  {{ stat.label }}
                </p>
                <h4 class="text-xl sm:text-2xl font-black font-display">
                  {{ stat.value }}
                </h4>
              </div>
            }
          </div>
          <a
            href="#download"
            class="inline-block bg-white text-primary px-10 py-4 rounded-2xl font-black text-lg hover:bg-opacity-90 hover:-translate-y-0.5 transition shadow-xl"
          >
            Apply for a Loan
          </a>
        </div>
      </div>
    </section>
  `,
})
export class LandingLoansCtaComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly loanStats = [
    { label: "Up to", value: "₦500k" },
    { label: "Approval", value: "24 hrs" },
    { label: "Setup fee", value: "0%" },
  ];
}
