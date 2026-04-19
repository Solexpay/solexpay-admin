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
          <div class="flex items-center gap-1">
            <img src="/logo-icon.png" alt="Solexpay" class="h-10 w-auto shrink-0 object-contain"/>
            <span class="text-xl font-black tracking-tighter text-primary font-display">Solexpay</span>
          </div>
          <div class="hidden md:flex gap-6 items-center text-sm font-medium">
            <a href="#features" class="text-on-surface-variant hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" class="text-on-surface-variant hover:text-primary transition-colors">How it Works</a>
            <a href="#loans" class="text-on-surface-variant hover:text-primary transition-colors">Loans</a>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="hidden sm:flex px-5 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors items-center gap-2">
            <lucide-icon [img]="LogInIcon" class="w-4 h-4"></lucide-icon>
            Admin Login
          </a>
          <a href="#download" class="px-4 sm:px-6 py-2 sm:py-2.5 editorial-gradient text-on-primary font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <lucide-icon [img]="DownloadIcon" class="w-4 h-4"></lucide-icon>
            <span class="hidden xs:inline sm:inline">Get the App</span>
            <span class="sm:hidden">Download</span>
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
