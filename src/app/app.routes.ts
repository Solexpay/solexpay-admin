import { authGuard } from "./guards/auth.guard";
import { guestGuard, roleGuard } from "./guards/role.guard";
import { SECTION_ROLES } from "./core/access";
import { Routes } from "@angular/router";

/** A section of the console, opened only by the roles in SECTION_ROLES. */
function section(path: string, title: string) {
  return {
    path,
    title,
    canActivate: [roleGuard],
    data: { roles: SECTION_ROLES[path] },
  };
}

export const routes: Routes = [
  // The admin has no landing: the public site lives at solexpay.com.ng.
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    title: "Sign in",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./pages/login.page").then((m) => m.LoginPageComponent),
  },
  {
    path: "",
    loadComponent: () =>
      import("./components/layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: "dashboard",
        title: "Dashboard",
        loadComponent: () =>
          import("./pages/(admin)/dashboard.page").then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        ...section("users", "Users"),
        loadComponent: () =>
          import("./pages/(admin)/users.page").then(
            (m) => m.UsersPageComponent,
          ),
      },
      {
        ...section("kyc", "KYC queue"),
        loadComponent: () =>
          import("./pages/(admin)/kyc.page").then((m) => m.KycPageComponent),
      },
      {
        ...section("loans", "Loans"),
        loadComponent: () =>
          import("./pages/(admin)/loans.page").then(
            (m) => m.LoansPageComponent,
          ),
      },
      {
        ...section("transactions", "Transactions"),
        loadComponent: () =>
          import("./pages/(admin)/transactions.page").then(
            (m) => m.TransactionsPageComponent,
          ),
      },
      {
        ...section("schools", "Schools"),
        loadComponent: () =>
          import("./pages/(admin)/schools.page").then(
            (m) => m.SchoolsPageComponent,
          ),
      },
      {
        ...section("gift-cards", "Gift cards"),
        loadComponent: () =>
          import("./pages/(admin)/gift-cards.page").then(
            (m) => m.GiftCardsPageComponent,
          ),
      },
      {
        ...section("nip-transfers", "NIP transfers"),
        loadComponent: () =>
          import("./pages/(admin)/nip-transfers.page").then(
            (m) => m.NipTransfersPageComponent,
          ),
      },
      {
        ...section("ops", "Operations"),
        loadComponent: () =>
          import("./pages/(admin)/ops.page").then((m) => m.OpsPageComponent),
      },
      {
        ...section("audit", "Audit ledger"),
        loadComponent: () =>
          import("./pages/(admin)/audit.page").then(
            (m) => m.AuditPageComponent,
          ),
      },
      {
        ...section("admins", "Admins"),
        loadComponent: () =>
          import("./pages/(admin)/admins.page").then(
            (m) => m.AdminsPageComponent,
          ),
      },
      {
        path: "settings",
        children: [
          { path: "", redirectTo: "profile", pathMatch: "full" },
          {
            path: "profile",
            title: "Profile",
            loadComponent: () =>
              import("./pages/(admin)/settings/profile.page").then(
                (m) => m.ProfilePageComponent,
              ),
          },
          {
            path: "notifications",
            title: "Notifications",
            loadComponent: () =>
              import("./pages/(admin)/settings/notifications.page").then(
                (m) => m.NotificationsPageComponent,
              ),
          },
        ],
      },
      {
        path: "forbidden",
        title: "No access",
        data: { kind: "forbidden" },
        loadComponent: () =>
          import("./pages/status.page").then((m) => m.StatusPageComponent),
      },
      {
        path: "**",
        title: "Page not found",
        data: { kind: "not-found" },
        loadComponent: () =>
          import("./pages/status.page").then((m) => m.StatusPageComponent),
      },
    ],
  },
];
