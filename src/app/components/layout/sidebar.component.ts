import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { RouterLink, Router, NavigationEnd } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs/operators";
import {
  LucideDynamicIcon,
  LucideIcon,
  LucideArrowLeftRight as ArrowLeftRight,
  LucideBell as Bell,
  LucideGift as Gift,
  LucideHandCoins as HandCoins,
  LucideLayoutDashboard as LayoutDashboard,
  LucideLogOut as LogOut,
  LucideSchool as School,
  LucideScrollText as ScrollText,
  LucideSearch as Search,
  LucideSend as Send,
  LucideShieldCheck as ShieldCheck,
  LucideUser as User,
  LucideUserCog as UserCog,
  LucideUsers as Users,
  LucideWorkflow as Workflow,
} from "@lucide/angular";
import { AuthService } from "../../services/auth.service";
import { SECTION_ROLES } from "../../core/access";

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
  group: string;
  roles?: string[];
}

@Component({
  selector: "app-sidebar",
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <aside
      class="flex h-full w-[256px] flex-col border-r border-ui-line bg-ui-rail lg:rounded-2xl lg:border"
    >
      <!-- Brand -->
      <div class="p-3 pb-2">
        <div class="flex items-center gap-2.5 px-1.5 py-1">
          <img
            src="/logo-icon.png"
            alt=""
            width="32"
            height="28"
            class="h-7 w-8 object-contain"
          />
          <div class="min-w-0">
            <p class="text-[15px] font-semibold leading-5 text-ui-ink">
              SolexPay
            </p>
            <p class="truncate text-xs text-ui-muted">Operations console</p>
          </div>
        </div>
      </div>

      <!-- Jump to a page -->
      <div class="px-3 pb-1">
        <div class="ui-search">
          <svg [lucideIcon]="SearchIcon" [size]="15"></svg>
          <input
            #search
            class="ui-input h-8 pr-11 text-[13px]"
            placeholder="Jump to…"
            aria-label="Jump to a page"
            [value]="query()"
            (input)="query.set(search.value)"
            (keydown.enter)="jumpToFirst()"
            (keydown.escape)="clearSearch()"
          />
          <kbd
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-ui-line bg-ui-rail px-1 text-[10px] font-medium text-ui-faint"
            >{{ shortcutLabel }}</kbd
          >
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 pb-3" aria-label="Main">
        @for (group of groups(); track group.name) {
          @if (group.name) {
            <p
              class="px-2.5 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-ui-faint"
            >
              {{ group.name }}
            </p>
          } @else {
            <div class="pt-2"></div>
          }
          @for (item of group.items; track item.route) {
            <a
              [routerLink]="item.route"
              class="mb-0.5 flex h-9 items-center gap-2.5 rounded-lg border px-2.5 text-[13.5px] transition-colors"
              [class]="
                isActive(item.route)
                  ? 'border-ui-line bg-white font-medium text-ui-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)]'
                  : 'border-transparent text-ui-body hover:bg-white/70 hover:text-ui-ink'
              "
              [attr.aria-current]="isActive(item.route) ? 'page' : null"
              (click)="onNavClick()"
            >
              <svg
                [lucideIcon]="item.icon"
                [size]="17"
                [class]="isActive(item.route) ? 'text-ui-ink' : 'text-ui-muted'"
              ></svg>
              <span class="truncate">{{ item.label }}</span>
            </a>
          }
        } @empty {
          <p class="px-2.5 py-6 text-center text-[13px] text-ui-muted">
            No page called “{{ query() }}”
          </p>
        }
      </nav>

      <!-- Signed-in admin -->
      <div class="border-t border-ui-line p-3">
        <div class="flex items-center gap-2.5 px-1">
          <span class="ui-avatar">{{ initials() }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-ui-ink">
              {{ displayName() }}
            </p>
            <p class="truncate text-xs text-ui-muted">
              {{ currentAdmin()?.email || roleLabel() }}
            </p>
          </div>
          <button
            type="button"
            class="ui-icon-btn"
            title="Sign out"
            aria-label="Sign out"
            (click)="logout()"
          >
            <svg [lucideIcon]="LogOutIcon" [size]="16"></svg>
          </button>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  closeSidebar = output<void>();

  private searchInput = viewChild<ElementRef<HTMLInputElement>>("search");

  readonly SearchIcon = Search;
  readonly shortcutLabel =
    typeof navigator !== "undefined" &&
    /Mac|iP(hone|ad)/.test(navigator.platform)
      ? "⌘K"
      : "Ctrl K";
  readonly LogOutIcon = LogOut;

  // In display order: groups render in the order their first item appears.
  readonly allNavItems: NavItem[] = [
    {
      route: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      group: "",
    },
    {
      route: "/users",
      label: "Users",
      icon: Users,
      group: "Customers",
      roles: SECTION_ROLES["users"],
    },
    {
      route: "/kyc",
      label: "KYC queue",
      icon: ShieldCheck,
      group: "Customers",
      roles: SECTION_ROLES["kyc"],
    },
    {
      route: "/schools",
      label: "Schools",
      icon: School,
      group: "Customers",
      roles: SECTION_ROLES["schools"],
    },
    {
      route: "/transactions",
      label: "Transactions",
      icon: ArrowLeftRight,
      group: "Money",
      roles: SECTION_ROLES["transactions"],
    },
    {
      route: "/loans",
      label: "Loans",
      icon: HandCoins,
      group: "Money",
      roles: SECTION_ROLES["loans"],
    },
    {
      route: "/nip-transfers",
      label: "NIP transfers",
      icon: Send,
      group: "Money",
      roles: SECTION_ROLES["nip-transfers"],
    },
    {
      route: "/gift-cards",
      label: "Gift cards",
      icon: Gift,
      group: "Money",
      roles: SECTION_ROLES["gift-cards"],
    },
    {
      route: "/ops",
      label: "Operations",
      icon: Workflow,
      group: "Control",
      roles: SECTION_ROLES["ops"],
    },
    {
      route: "/audit",
      label: "Audit ledger",
      icon: ScrollText,
      group: "Control",
      roles: SECTION_ROLES["audit"],
    },
    {
      route: "/admins",
      label: "Admins",
      icon: UserCog,
      group: "Control",
      roles: SECTION_ROLES["admins"],
    },
    {
      route: "/settings/profile",
      label: "Profile",
      icon: User,
      group: "Account",
    },
    {
      route: "/settings/notifications",
      label: "Notifications",
      icon: Bell,
      group: "Account",
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

  query = signal("");

  groups = computed(() => {
    const q = this.query().trim().toLowerCase();
    const groups: { name: string; items: NavItem[] }[] = [];
    for (const item of this.navItems) {
      if (q && !item.label.toLowerCase().includes(q)) continue;
      let group = groups.find((g) => g.name === item.group);
      if (!group) {
        group = { name: item.group, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  });

  currentAdmin = computed(() => this.auth.getAdmin());

  displayName = computed(() => {
    const a = this.currentAdmin();
    return a?.firstName ? `${a.firstName} ${a.lastName ?? ""}`.trim() : "Admin";
  });

  initials = computed(() => {
    const a = this.currentAdmin();
    const s = `${a?.firstName?.[0] ?? ""}${a?.lastName?.[0] ?? ""}`;
    return s || "A";
  });

  roleLabel = computed(() =>
    (this.currentAdmin()?.role ?? "ADMIN").replace(/_/g, " ").toLowerCase(),
  );

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

  isActive(route: string): boolean {
    return this.activeRoute()?.startsWith(route) ?? false;
  }

  @HostListener("document:keydown", ["$event"])
  onShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  jumpToFirst() {
    const first = this.groups()[0]?.items[0];
    if (!first) return;
    this.router.navigate([first.route]);
    this.clearSearch();
    this.onNavClick();
  }

  clearSearch() {
    this.query.set("");
    this.searchInput()?.nativeElement.blur();
  }

  logout() {
    this.auth.logout();
  }

  onNavClick() {
    this.closeSidebar.emit();
  }
}
