import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Download, LogIn } from 'lucide-angular';

@Component({
  selector: 'app-site-nav',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  styles: [`
    :host { display: block; }
    nav { background: rgba(248,249,250,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
    .editorial-gradient { background: linear-gradient(135deg, #005bbf 0%, #1a73e8 100%); }
  `],
  template: `
    <nav class="fixed top-0 w-full z-50 border-b border-outline-variant/20 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <!-- Inline SVG logo — no background box -->
          <svg class="h-8 w-8 shrink-0" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27 9.5C27 6.462 24.538 4 21.5 4H18C12.477 4 8 8.477 8 14s4.477 10 10 10h.5C23.851 24 28 28.149 28 33" stroke="#005bbf" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <span class="text-xl font-black tracking-tighter text-primary font-display">Solexpay</span>
          <div class="hidden md:flex gap-6 items-center text-sm font-medium">
            <a href="#features" class="text-on-surface-variant hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" class="text-on-surface-variant hover:text-primary transition-colors">How it Works</a>
            <a href="#loans" class="text-on-surface-variant hover:text-primary transition-colors">Loans</a>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="px-5 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
            <lucide-icon [img]="LogInIcon" class="w-4 h-4"></lucide-icon>
            Admin Login
          </a>
          <a href="#download" class="px-6 py-2.5 editorial-gradient text-on-primary font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <lucide-icon [img]="DownloadIcon" class="w-4 h-4"></lucide-icon>
            Get the App
          </a>
        </div>
      </div>
    </nav>
  `
})
export class SiteNavComponent {
  readonly LogInIcon = LogIn;
  readonly DownloadIcon = Download;
}
