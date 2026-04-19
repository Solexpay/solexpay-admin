import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RippleDirective } from '../../directives/ripple.directive';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RippleDirective],
  template: `
    <header class="h-16 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <!-- Left side: Menu toggle + Search -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Mobile menu toggle -->
        <button 
          class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container-high transition-colors"
          (click)="toggleSidebar.emit()">
          <span class="material-symbols-outlined text-on-surface">menu</span>
        </button>

        <!-- Search -->
        <div class="relative transition-all duration-300 ease-out max-w-md"
             [class]="searchFocused() ? 'w-full sm:w-80 md:w-96' : 'w-full sm:w-48 md:w-64'">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                [class]="searchFocused() ? 'text-primary' : 'text-outline'">search</span>
          <input class="w-full bg-surface-container-low rounded-xl py-2.5 pl-10 pr-4
                        transition-all duration-200 text-sm font-medium outline-none
                        focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                 (focus)="searchFocused.set(true)"
                 (blur)="searchFocused.set(false)"
                 placeholder="Search..."
                 type="text"/>
        </div>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <!-- Notifications -->
        <button class="relative p-2 rounded-full hover:bg-surface-container-high transition-colors duration-200"
                (click)="showNotifications()">
          <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
          @if (unreadCount() > 0) {
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-notification-dot ring-2 ring-surface-container-lowest"></span>
          }
        </button>

        <!-- Settings (hidden on smallest screens) -->
        <button class="hidden sm:flex p-2 rounded-full hover:bg-surface-container-high transition-colors duration-200"
                (click)="goToSettings()">
          <span class="material-symbols-outlined text-on-surface-variant">settings</span>
        </button>

        <!-- Logout -->
        <button solexRipple 
                class="ml-1 sm:ml-2 px-3 sm:px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
                (click)="logout()">
          <span class="sm:hidden material-symbols-outlined text-sm">logout</span>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  `
})
export class TopBarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  toggleSidebar = output<void>();
  searchFocused = signal(false);
  unreadCount = signal(3); // Mock data - would come from notifications service

  showNotifications() {
    // Would open notification drawer
    this.router.navigate(['/settings/notifications']);
  }

  goToSettings() {
    this.router.navigate(['/settings/profile']);
  }

  logout() {
    this.auth.logout();
  }
}
