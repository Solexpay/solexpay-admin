import { Component } from '@angular/core';
import { LucideAngularModule, Star } from 'lucide-angular';

interface UniLogo { name: string; fullName: string; color: string; logoUrl: string; }
interface Testimonial { name: string; school: string; quote: string; avatar: string; }

@Component({
  selector: 'app-landing-testimonials',
  standalone: true,
  imports: [LucideAngularModule],
  styles: [`.editorial-gradient { background: linear-gradient(135deg, #005bbf 0%, #1a73e8 100%); }`],
  template: `
    <section class="py-24 bg-surface-container">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16" data-aos="fade-up">
          <p class="text-on-surface-variant font-bold text-sm tracking-widest uppercase mb-8">Trusted Across Nigeria</p>
          <div class="flex flex-wrap justify-center items-center gap-4 md:gap-5 mb-16">
            @for (uni of universities; track uni.name; let i = $index) {
              <div class="flex items-center gap-3 px-5 py-3 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                   [title]="uni.fullName"
                   data-aos="fade-up" [attr.data-aos-delay]="i * 60">
                <!-- University logo -->
                <img [src]="uni.logoUrl" 
                     [alt]="uni.name + ' logo'"
                     class="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shrink-0 shadow-sm"
                     onerror="this.src='https://ui-avatars.com/api/?name=' + this.alt + '&background=random&color=fff&size=120'">
                <span class="text-sm font-bold text-on-surface tracking-wide">{{ uni.name }}</span>
              </div>
            }
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          @for (review of testimonials; track review.name; let i = $index) {
            <div class="bg-surface-container-lowest p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                 data-aos="fade-up" [attr.data-aos-delay]="i * 120">
              <div class="flex gap-0.5 text-primary mb-4">
                @for (s of [1,2,3,4,5]; track s) {
                  <lucide-icon [img]="StarIcon" class="w-[18px] h-[18px] fill-primary"></lucide-icon>
                }
              </div>
              <p class="text-on-surface mb-6 leading-relaxed italic">"{{ review.quote }}"</p>
              <div class="flex items-center gap-3">
                <img [src]="review.avatar" [alt]="review.name"
                     class="w-12 h-12 rounded-full object-cover border-2 border-surface-container-lowest shadow-md"
                     loading="lazy" />
                <div>
                  <p class="font-bold text-sm text-on-surface font-display">{{ review.name }}</p>
                  <p class="text-[10px] text-outline uppercase font-bold tracking-wider">{{ review.school }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingTestimonialsComponent {
  readonly StarIcon = Star;

  readonly universities: UniLogo[] = [
    { name: 'UNILAG', fullName: 'University of Lagos',               color: 'linear-gradient(135deg,#1d4ed8,#2563eb)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/University_of_Lagos_logo.png/120px-University_of_Lagos_logo.png' },
    { name: 'UI',     fullName: 'University of Ibadan',               color: 'linear-gradient(135deg,#059669,#10b981)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/University_of_Ibadan_logo.png/120px-University_of_Ibadan_logo.png' },
    { name: 'OAU',    fullName: 'Obafemi Awolowo University',         color: 'linear-gradient(135deg,#b91c1c,#dc2626)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Obafemi_Awolowo_University_logo.png/120px-Obafemi_Awolowo_University_logo.png' },
    { name: 'UNN',    fullName: 'University of Nigeria, Nsukka',      color: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Nigeria_logo.png/120px-University_of_Nigeria_logo.png' },
    { name: 'ABU',    fullName: 'Ahmadu Bello University',            color: 'linear-gradient(135deg,#c2410c,#ea580c)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Ahmadu_Bello_University_logo.png/120px-Ahmadu_Bello_University_logo.png' },
    { name: 'FUTA',   fullName: 'Federal Univ. of Technology, Akure', color: 'linear-gradient(135deg,#0e7490,#06b6d4)', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Federal_University_of_Technology_Akure_logo.png/120px-Federal_University_of_Technology_Akure_logo.png' },
  ];

  readonly testimonials: Testimonial[] = [
    {
      name: 'Amaka O.', school: 'UNILAG Student',
      quote: 'SolexPay saved me when my hostel rent was due and my allowance was delayed. The student loan was fast and very easy to pay back.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
    },
    {
      name: 'Tunde J.', school: 'OAU Student',
      quote: 'Finally an app that understands student life. I use target savings to keep money aside for my final year project. Very reliable!',
      avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
    },
    {
      name: 'Fatima S.', school: 'ABU Student',
      quote: 'Instant transfers to classmates and the student data deals are unbeatable. Every Nigerian student needs SolexPay.',
      avatar: 'https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
    },
  ];
}
