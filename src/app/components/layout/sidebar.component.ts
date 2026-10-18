import { Component, computed, inject, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive, Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs/operators";
import { NavigationEnd } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { PulseAnimationDirective } from "../../directives/pulse-animation.directive";
import { HoverScaleDirective } from "../../directives/hover-scale.directive";

export interface NavItem {
  route: string;
  label: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TooltipDirective,
    PulseAnimationDirective,
    HoverScaleDirective,
  ],
  template: `
    <aside class="w-64 h-full bg-surface-container-low flex flex-col">
      <!-- Logo -->
      <div class="p-4 sm:p-6 border-b border-outline-variant/10">
        <div
          class="flex items-center gap-3 hover-scale cursor-pointer"
          hoverScale="sm"
        >
          <div
            class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
            pulseAnimation="ring"
          >
            <span class="material-symbols-outlined text-on-primary text-xl"
              >account_balance</span
            >
          </div>
          <div>
            <h1 class="text-lg font-bold text-on-surface">SolexPay</h1>
            <p class="text-xs text-on-surface-variant">Admin Portal</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 px-3 relative overflow-y-auto">
        <!-- Sliding indicator pill -->
        <div
          class="absolute left-0 w-1 bg-primary rounded-r-full transition-all duration-300 ease-out"
          [style.top.px]="activePillTop()"
          [style.height.px]="48"
          [style.opacity]="activeIndex() >= 0 ? 1 : 0"
        ></div>

        @for (item of navItems; track item.route; let i = $index) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary-fixed text-primary font-bold"
            class="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl mx-2 sm:mx-3 mb-1 transition-all duration-200 relative group"
            [class]="
              isActive(item.route)
                ? 'bg-primary-fixed text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-1'
            "
            (click)="onNavClick()"
            [tooltip]="item.label"
            tooltipPosition="right"
          >
            <span
              class="material-symbols-outlined transition-transform duration-200 group-hover:scale-110"
              >{{ item.icon }}</span
            >
            <span class="text-sm">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- User info at bottom -->
      <div class="p-3 sm:p-4 border-t border-outline-variant/10">
        <div
          class="flex items-center gap-3 px-2 sm:px-3 py-2 rounded-xl bg-surface-container hover-lift cursor-pointer transition-all duration-200"
        >
          <div
            class="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0"
          >
            <span
              class="material-symbols-outlined text-on-primary-container text-sm"
              >person</span
            >
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-on-surface truncate">
              {{
                currentAdmin()?.firstName
                  ? currentAdmin()!.firstName + " " + currentAdmin()!.lastName
                  : "Admin User"
              }}
            </p>
            <p class="text-xs text-on-surface-variant truncate">
              {{ currentAdmin()?.role || "ADMIN" }} ·
              {{ currentAdmin()?.email || "admin@solexpay.com" }}
            </p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  closeSidebar = output<void>();

  readonly allNavItems: NavItem[] = [
    { route: "/dashboard", label: "Dashboard", icon: "dashboard" },
    {
      route: "/users",
      label: "Users",
      icon: "people",
      roles: ["SUPPORT", "OPS", "COMPLIANCE"],
    },
    {
      route: "/transactions",
      label: "Transactions",
      icon: "receipt_long",
      roles: ["SUPPORT", "OPS", "COMPLIANCE"],
    },
    {
      route: "/loans",
      label: "Loans",
      icon: "credit_card",
      roles: ["SUPPORT", "OPS", "COMPLIANCE"],
    },
    {
      route: "/nip-transfers",
      label: "NIP Transfers",
      icon: "send_money",
      roles: ["SUPPORT", "OPS", "COMPLIANCE"],
    },
    {
      route: "/gift-cards",
      label: "Gift Cards",
      icon: "card_membership",
      roles: ["OPS"],
    },
    { route: "/schools", label: "Schools", icon: "school", roles: ["OPS"] },
    {
      route: "/ops",
      label: "Operations",
      icon: "manufacturing",
      roles: ["OPS", "COMPLIANCE"],
    },
    {
      route: "/kyc",
      label: "KYC Queue",
      icon: "verified_user",
      roles: ["COMPLIANCE"],
    },
    {
      route: "/audit",
      label: "Audit Ledger",
      icon: "history_edu",
      roles: ["COMPLIANCE"],
    },
    {
      route: "/admins",
      label: "Admins",
      icon: "admin_panel_settings",
      roles: ["SUPER_ADMIN"],
    },
  ];

  get navItems(): NavItem[] {
    const role =
      typeof this.auth?.getAdminRole === "function"
        ? this.auth.getAdminRole()
        : null;
    if (!role) {
      return this.allNavItems;
    }
    return this.allNavItems.filter(
      (item) =>
        !item.roles ||
        (typeof this.auth?.canAccess === "function"
          ? this.auth.canAccess(item.roles)
          : true),
    );
  }

  currentAdmin = computed(() => this.auth.getAdmin());

  activeRoute = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  activeIndex = computed(() => {
    const url = this.activeRoute();
    return this.navItems.findIndex((item) => url.startsWith(item.route));
  });

  activePillTop = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? 16 + index * 56 : 0;
  });

  isActive(route: string): boolean {
    return this.activeRoute()?.startsWith(route) ?? false;
  }

  onNavClick() {
    this.closeSidebar.emit();
  }
}
