import { authGuard } from "./guards/auth.guard";

import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./pages/landing.page").then((m) => m.LandingPageComponent),
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login.page").then((m) => m.LoginPageComponent),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./pages/reset-password.page").then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: "terms",
    loadComponent: () =>
      import("./pages/terms-of-service.page").then(
        (m) => m.TermsOfServicePageComponent,
      ),
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("./pages/privacy-policy.page").then(
        (m) => m.PrivacyPolicyPageComponent,
      ),
  },
  {
    path: "cookies",
    loadComponent: () =>
      import("./pages/cookie-policy.page").then(
        (m) => m.CookiePolicyPageComponent,
      ),
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./pages/contact.page").then((m) => m.ContactPageComponent),
  },
  {
    path: "docs",
    loadComponent: () =>
      import("./pages/docs.page").then((m) => m.DocsPageComponent),
    title: "Developer API Reference — Solexpay",
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
        loadComponent: () =>
          import("./pages/(admin)/dashboard.page").then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./pages/(admin)/users.page").then(
            (m) => m.UsersPageComponent,
          ),
      },
      {
        path: "kyc",
        loadComponent: () =>
          import("./pages/(admin)/kyc.page").then((m) => m.KycPageComponent),
      },
      {
        path: "loans",
        loadComponent: () =>
          import("./pages/(admin)/loans.page").then(
            (m) => m.LoansPageComponent,
          ),
      },
      {
        path: "transactions",
        loadComponent: () =>
          import("./pages/(admin)/transactions.page").then(
            (m) => m.TransactionsPageComponent,
          ),
      },
      {
        path: "schools",
        loadComponent: () =>
          import("./pages/(admin)/schools.page").then(
            (m) => m.SchoolsPageComponent,
          ),
      },
      {
        path: "settings",
        children: [
          {
            path: "profile",
            loadComponent: () =>
              import("./pages/(admin)/settings/profile.page").then(
                (m) => m.ProfilePageComponent,
              ),
          },
          {
            path: "notifications",
            loadComponent: () =>
              import("./pages/(admin)/settings/notifications.page").then(
                (m) => m.NotificationsPageComponent,
              ),
          },
        ],
      },
    ],
  },
];
