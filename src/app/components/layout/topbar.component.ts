import { Component, inject, output } from "@angular/core";
import { Router } from "@angular/router";
import {
  LucideDynamicIcon,
  LucideBell as Bell,
  LucideLogOut as LogOut,
  LucideMenu as Menu,
} from "@lucide/angular";
import { AuthService } from "../../services/auth.service";

/** Small-screen bar: opens the sidebar drawer. Hidden from lg up. */
@Component({
  selector: "app-topbar",
  imports: [LucideDynamicIcon],
  template: `
    <header
      class="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-ui-line bg-white/90 px-3 backdrop-blur-sm lg:hidden"
    >
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          data-testid="menu"
          class="ui-icon-btn h-9 w-9"
          aria-label="Open menu"
          (click)="toggleSidebar.emit()"
        >
          <svg [lucideIcon]="MenuIcon" [size]="18"></svg>
        </button>
        <img src="/logo-icon.png" alt="" class="h-6 w-7 object-contain" />
        <span class="truncate text-[15px] font-semibold text-ui-ink"
          >SolexPay</span
        >
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="ui-icon-btn h-9 w-9"
          aria-label="Notifications"
          (click)="showNotifications()"
        >
          <svg [lucideIcon]="BellIcon" [size]="18"></svg>
        </button>
        <button
          type="button"
          data-testid="logout"
          class="ui-icon-btn h-9 w-9"
          aria-label="Sign out"
          (click)="logout()"
        >
          <svg [lucideIcon]="LogOutIcon" [size]="18"></svg>
        </button>
      </div>
    </header>
  `,
})
export class TopBarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  toggleSidebar = output<void>();

  readonly MenuIcon = Menu;
  readonly BellIcon = Bell;
  readonly LogOutIcon = LogOut;

  showNotifications() {
    this.router.navigate(["/settings/notifications"]);
  }

  goToSettings() {
    this.router.navigate(["/settings/profile"]);
  }

  logout() {
    this.auth.logout();
  }
}
