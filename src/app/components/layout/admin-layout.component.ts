import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs/operators";
import { SidebarComponent } from "./sidebar.component";
import { TopBarComponent } from "./topbar.component";
import { ToastOutletComponent } from "./toast-outlet.component";
import { ConfirmDialogComponent } from "../ui/confirm-dialog.component";

/**
 * The console frame: a grey page holding the sidebar panel and the white
 * page panel side by side. Below lg the sidebar becomes a drawer.
 */
@Component({
  selector: "app-admin-layout",
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopBarComponent,
    ToastOutletComponent,
    ConfirmDialogComponent,
  ],
  host: { "(document:keydown.escape)": "closeDrawer()" },
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-100 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-ui-ink focus:shadow"
      (click)="$event.preventDefault(); focusMain()"
      >Skip to content</a
    >
    <div class="flex h-dvh gap-3 overflow-hidden bg-ui-frame lg:p-3">
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-40 bg-ui-ink/30 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
          (click)="closeDrawer()"
        ></div>
      }

      <app-sidebar
        (closeSidebar)="closeDrawer()"
        [class]="sidebarOpen() ? 'translate-x-0' : '-translate-x-full'"
        [attr.inert]="drawerHidden() ? '' : null"
        class="fixed inset-y-0 left-0 z-50 transition-transform duration-250 ease-(--ease-drawer) lg:static lg:translate-x-0"
      />

      <div
        class="flex min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:border lg:border-ui-line"
        [attr.inert]="sidebarOpen() ? '' : null"
      >
        <app-topbar (toggleSidebar)="openDrawer()" />
        <main
          #main
          id="main"
          tabindex="-1"
          class="flex-1 overflow-y-auto outline-none"
        >
          <div class="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
            <router-outlet />
          </div>
        </main>
      </div>

      <app-toast-outlet />
      <app-confirm-dialog />
    </div>
  `,
})
export class AdminLayoutComponent {
  sidebarOpen = signal(false);

  private main = viewChild<ElementRef<HTMLElement>>("main");
  private small = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Each page starts at the top: the router's own scroll reset only
    // knows about the window, and the console scrolls inside <main>.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        const main = this.main()?.nativeElement;
        if (main) main.scrollTop = 0;
      });

    if (typeof matchMedia === "function") {
      const query = matchMedia("(max-width: 1023.98px)");
      const update = () => this.small.set(query.matches);
      update();
      query.addEventListener?.("change", update);
      destroyRef.onDestroy(() => query.removeEventListener?.("change", update));
    }
  }

  /** On small screens the closed drawer is off-canvas: keep Tab out of it. */
  drawerHidden() {
    return !this.sidebarOpen() && this.small();
  }

  openDrawer() {
    this.sidebarOpen.set(true);
  }

  closeDrawer() {
    if (!this.sidebarOpen()) return;
    this.sidebarOpen.set(false);
    document.querySelector<HTMLElement>('[data-testid="menu"]')?.focus();
  }

  focusMain() {
    this.main()?.nativeElement.focus();
  }
}
