import { Component } from "@angular/core";

@Component({
  selector: "app-landing-stats",
  standalone: true,
  template: `
    <section class="bg-primary">
      <div
        class="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
      >
        @for (stat of stats; track stat.label; let i = $index) {
          <div data-aos="fade-up" [attr.data-aos-delay]="i * 100">
            <p
              class="text-3xl md:text-4xl font-black text-on-primary font-display"
            >
              {{ stat.value }}
            </p>
            <p class="text-sm text-on-primary/70 mt-1">{{ stat.label }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class StatsStripComponent {
  readonly stats = [
    { value: "50K+", label: "Active Students" },
    { value: "₦2B+", label: "Transactions Processed" },
    { value: "200+", label: "Partner Schools" },
    { value: "4.9★", label: "App Store Rating" },
  ];
}
