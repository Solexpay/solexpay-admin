# Analog.js — Routing Reference

## Overview

This project uses **manual routing** defined in `src/app/app.routes.ts`. Analog.js also auto-discovers `.page.ts` files in `src/app/pages/`, but manual routes take precedence. Always register routes manually — do not rely on auto-discovery alone (see Pitfall P3).

---

## Route Structure

```
src/app/app.routes.ts
│
├── ''           → LandingPageComponent       (public, exact match)
├── 'login'      → LoginPageComponent         (public)
├── 'reset-password' → ResetPasswordPageComponent (public)
├── 'terms'      → TermsOfServicePageComponent   (public)
├── 'privacy'    → PrivacyPolicyPageComponent    (public)
├── 'docs'       → DocsPageComponent             (public)
│
└── ''           → AdminLayoutComponent          (canActivate: [authGuard])
    ├── 'dashboard'     → DashboardPageComponent
    ├── 'users'         → UsersPageComponent
    ├── 'kyc'           → KycPageComponent
    ├── 'loans'         → LoansPageComponent
    ├── 'transactions'  → TransactionsPageComponent
    ├── 'schools'       → SchoolsPageComponent
    └── 'settings'
        ├── 'profile'        → ProfilePageComponent
        └── 'notifications'  → NotificationsPageComponent
```

---

## Route Registration Patterns

### Public route (no auth)

```typescript
// src/app/app.routes.ts
{
  path: 'my-page',
  loadComponent: () =>
    import('./pages/my-page.page').then(m => m.MyPageComponent),
  title: 'My Page — Solexpay'
}
```

### Admin/protected route

All admin pages must go **inside the existing `canActivate: [authGuard]` children array**. Never add a second guard block.

```typescript
// Inside the existing canActivate: [authGuard] children array:
{
  path: 'my-admin-page',
  loadComponent: () =>
    import('./pages/(admin)/my-admin-page.page').then(m => m.MyAdminPageComponent)
}
```

### Nested route group with shared layout

```typescript
{
  path: 'settings',
  children: [
    {
      path: 'profile',
      loadComponent: () => import('./pages/(admin)/settings/profile.page').then(m => m.ProfilePageComponent)
    },
    {
      path: 'security',
      loadComponent: () => import('./pages/(admin)/settings/security.page').then(m => m.SecurityPageComponent)
    }
  ]
}
```

### Route with path parameter

```typescript
{
  path: 'users/:id',
  loadComponent: () =>
    import('./pages/(admin)/user-detail.page').then(m => m.UserDetailPageComponent)
}
```

Read it in the component:
```typescript
import { ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export class UserDetailPageComponent {
  private route = inject(ActivatedRoute);
  userId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));
}
```

### Redirect

```typescript
{
  path: 'old-path',
  redirectTo: 'new-path',
  pathMatch: 'full'
}
```

### Wildcard / 404

```typescript
{
  path: '**',
  loadComponent: () => import('./pages/not-found.page').then(m => m.NotFoundPageComponent)
}
```

---

## Auth Guard

The auth guard is at `src/app/guards/auth.guard.ts`. It checks if the user is authenticated (reads from `AuthService`) and redirects to `/login` if not.

```typescript
// Typical guard implementation
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

**Rules:**
- Only ONE guard block exists in `app.routes.ts`. Do not add a second.
- All admin pages must be nested inside the existing `canActivate: [authGuard]` parent route.
- The parent route uses `AdminLayoutComponent` as a shell — this provides the sidebar and top nav that all admin pages share.

---

## `AdminLayoutComponent` — The Shell

Path: `src/app/components/layout/admin-layout.component.ts`

All routes inside the `canActivate: [authGuard]` parent are rendered into `<router-outlet>` inside `AdminLayoutComponent`. This gives them:
- Sidebar navigation
- Top app bar
- Consistent layout padding

The admin layout component DOES NOT add another `<router-outlet>`. The `path: ''` on the guard block means all child routes resolve directly (e.g., `dashboard`, not `admin/dashboard`).

---

## Programmatic Navigation

```typescript
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export class MyComponent {
  private router = inject(Router);

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToUser(id: string) {
    this.router.navigate(['/users', id]);
  }

  goBackWithState() {
    this.router.navigate(['/users'], { state: { fromDetail: true } });
  }
}
```

### Programmatic navigation in template

```html
<button (click)="router.navigate(['/dashboard'])">Home</button>

<!-- Or use routerLink directive -->
<a routerLink="/dashboard">Home</a>
<a [routerLink]="['/users', user.id]">View User</a>
```

To use `routerLink` in a component, add `RouterLink` to `imports`:
```typescript
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  ...
})
```

---

## Reading Route Data

### Query parameters

```typescript
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class SearchPageComponent {
  private route = inject(ActivatedRoute);

  // Reactive signal that updates when query params change
  q = toSignal(this.route.queryParamMap.pipe(map(p => p.get('q') ?? '')));
}
```

Navigate with query params:
```typescript
this.router.navigate(['/users'], { queryParams: { page: 2, status: 'ACTIVE' } });
```

### Route title

Set in the route definition:
```typescript
{ path: 'docs', ..., title: 'Developer API Reference — Solexpay' }
```

Or dynamically via `TitleStrategy` (advanced — not currently used).

---

## Analog File-Based Routing (Auto-Discovery)

Analog auto-discovers `.page.ts` files in `src/app/pages/` as routes. The folder name maps to the URL:

| File | Auto-discovered URL |
|---|---|
| `pages/foo.page.ts` | `/foo` |
| `pages/(admin)/bar.page.ts` | `/bar` (parentheses = route group, NOT a URL segment) |
| `pages/users/[id].page.ts` | `/users/:id` |

**This project uses manual routes for everything.** Auto-discovery runs in parallel but the manual `app.routes.ts` definitions take precedence because they are registered first in the Angular router.

**Never rely on auto-discovery for any page in this project.** Always add manual route entries. The reason: the guard block, layout component, and nested children structure requires explicit control.

---

## Lazy Loading

All routes already use `loadComponent` (lazy loading) by default. The chunk is split at build time and fetched only when the route is first visited. This is the correct pattern — do NOT use `component:` with a direct import:

```typescript
// ✓ Correct — lazy loaded
{ path: 'foo', loadComponent: () => import('./pages/foo.page').then(m => m.FooPageComponent) }

// ✗ Wrong — eager, bloats main bundle
import { FooPageComponent } from './pages/foo.page';
{ path: 'foo', component: FooPageComponent }
```

---

## Route Guards — Additional Guards

If you need a new guard (e.g., role-based access):

1. Create `src/app/guards/role.guard.ts`
2. Add it to a route's `canActivate` array alongside `authGuard`:
```typescript
{
  path: 'admin-only',
  canActivate: [authGuard, roleGuard('ADMIN')],
  loadComponent: () => ...
}
```

A guard factory (returns a `CanActivateFn`):
```typescript
export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    return auth.hasRole(requiredRole) ? true : inject(Router).createUrlTree(['/dashboard']);
  };
}
```

---

## Route Resolvers (rarely needed)

If a page needs data loaded before the component renders:

```typescript
{
  path: 'users/:id',
  resolve: { user: userResolver },
  loadComponent: () => ...
}

// resolver
export const userResolver: ResolveFn<User> = (route) => {
  const id = route.paramMap.get('id')!;
  return inject(UserService).getUser(id);
};
```

Access resolved data in component:
```typescript
user = toSignal(this.route.data.pipe(map(d => d['user'] as User)));
```

---

## Common Routing Mistakes

| Mistake | Fix |
|---|---|
| Added admin page outside `canActivate: [authGuard]` block | Move it inside the guard children array |
| Route path starts with `/` | Paths must NOT start with `/` in route definitions |
| Two route definitions for the same path | Remove the duplicate; manual route wins but both get loaded |
| `import('./pages/Foo.page')` — wrong case | Match file system exactly: `foo.page` for `foo.page.ts` |
| `loadComponent` uses `.then(m => m.default)` | Components use named exports: `.then(m => m.FooPageComponent)` |
| Added `routerLink` but no import | Add `RouterLink` to the component's `imports` array |
