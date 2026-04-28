---
name: analog-js
description: Build, debug, and extend Analog.js (Angular meta-framework) applications — pages, API routes, components, routing, services, Nitro server handlers, and Vite configuration. Use this skill whenever the user is working on an Analog.js project, adding pages or routes, wiring up server/API endpoints, debugging Angular/Analog build errors (especially "JIT compiler unavailable"), configuring Vite or Nitro, scaffolding components, or asking how something works in Analog. Also trigger for Angular 17+ standalone component questions when the codebase uses @analogjs/platform.
---

# Analog.js Expert Skill

Analog.js is a meta-framework built on Angular + Vite + Nitro. Think of it as "Next.js for Angular". This skill covers the complete development workflow for this project and the Analog.js ecosystem.

## Project Quick-Reference

```
src/
├── app/
│   ├── pages/              ← route components (.page.ts)
│   ├── components/         ← shared UI components
│   │   ├── layout/         ← AdminLayoutComponent, etc.
│   │   └── ui/             ← MetricCard, StatusChip, etc.
│   ├── services/           ← Angular services (HTTP, auth, etc.)
│   ├── guards/             ← Route guards (authGuard)
│   ├── directives/         ← Custom directives
│   ├── app.routes.ts       ← Manual route definitions
│   ├── app.component.ts    ← Root component
│   └── app.config.ts       ← App-level providers
├── server/
│   ├── routes/api/         ← Nitro API route handlers
│   └── utils/              ← Server-only utilities (dev-mock, validate)
└── main.ts                 ← Bootstrap entry point
```

**Stack:** Angular 17 · Analog 1.x · Vite · Nitro · Tailwind CSS · TanStack Query · pnpm

---

## Core Mental Model

Analog has two distinct layers:

| Layer | Files | Runtime | Purpose |
|---|---|---|---|
| **Client** | `src/app/**` | Browser | Angular SPA |
| **Server** | `src/server/**` | Node/Nitro | API proxy + BFF |

The client is a pure Angular SPA (`ssr: false`). Server routes in `src/server/routes/api/` are served by Nitro and act as a Backend-For-Frontend (BFF) — they proxy calls to the real backend at `API_URL`.

---

## 1. Adding a New Page

### Step 1: Create the component

Create `src/app/pages/<name>.page.ts`. Rules:
- Must be a **standalone component** (`standalone: true`)
- Must use a **named export**: `export class FooPageComponent`
- If the template is **longer than ~300 lines**, use `templateUrl` pointing to a `.page.html` sibling file — **never put large templates inline** (see Pitfalls)
- Import only what the template uses

```typescript
// src/app/pages/example.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-surface p-6">
      <h1 class="text-2xl font-bold text-on-surface">Example</h1>
    </div>
  `
})
export class ExamplePageComponent {}
```

For large templates (docs pages, complex dashboards):

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './example.page.html'   // ← external file
})
export class ExamplePageComponent {}
```

### Step 2: Register the route

Add to `src/app/app.routes.ts`:

```typescript
// Public route (no guard)
{
  path: 'example',
  loadComponent: () =>
    import('./pages/example.page').then(m => m.ExamplePageComponent),
  title: 'Example — Solexpay'
}

// Protected route (inside the existing canActivate: [authGuard] block)
{
  path: 'example',
  loadComponent: () =>
    import('./pages/(admin)/example.page').then(m => m.ExamplePageComponent)
}
```

**All admin pages go inside the existing `canActivate: [authGuard]` children array.** Never create a second guard block.

---

## 2. Adding a Server API Route (Nitro BFF)

Server routes live in `src/server/routes/api/` and map to `/api/**` URLs. The file path IS the URL path — Nitro uses file-based routing for server routes.

### File naming → URL mapping

| File | URL | Method |
|---|---|---|
| `api/auth/login.post.ts` | `POST /api/auth/login` | POST only |
| `api/admin/users.ts` | `GET /api/admin/users` | Any |
| `api/admin/users/[id].suspend.ts` | `POST /api/admin/users/:id/suspend` | Any |

### Standard handler template

```typescript
// src/server/routes/api/example.ts
import { defineEventHandler, getHeaders, getQuery, readBody, createError } from 'h3';
import { IS_DEV, MOCK } from '../../utils/dev-mock';

export default defineEventHandler(async (event) => {
  // 1. Auth check (all admin routes need this)
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  // 2. Dev mode short-circuit
  if (IS_DEV) return { data: MOCK.something };

  // 3. Forward to real backend
  const res = await fetch(`${process.env['API_URL']}/example`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

### Reading inputs

```typescript
// Path param: /api/admin/users/[id].ts
const id = getRouterParam(event, 'id');         // string | undefined

// Query params
const q = getQuery(event);                       // Record<string, string>

// Request body (POST/PUT)
const body = await readBody(event);              // unknown

// Headers
const { authorization } = getHeaders(event);
```

### Validation utilities (from `src/server/utils/validate.ts`)

```typescript
import { assertEmail, assertPassword, assertUuid, assertNonEmptyString, allowQueryParams } from '../../utils/validate';

assertEmail(body?.email)              // throws 400 if invalid
assertPassword(body?.password)        // throws 400 if < 8 chars
assertUuid(getRouterParam(event,'id'))// throws 400 if not UUID
assertNonEmptyString(body?.reason, 'reason', 512)  // throws 400 if empty/too long
allowQueryParams(getQuery(event), ['page','size','status'])  // strips unknown params
```

For detailed server-route patterns → read `references/server-routes.md`

---

## 3. Design System

This project uses **Material Design 3 tokens** mapped to Tailwind. Always use these token classes — never hardcode hex colors.

### Essential tokens

| Purpose | Class |
|---|---|
| Page background | `bg-surface` |
| Card | `bg-surface-container-lowest` |
| Elevated section | `bg-surface-container` |
| Subtle fill | `bg-surface-container-high` |
| Primary brand | `bg-primary` · `text-primary` |
| Primary tint | `bg-primary/10` |
| Body text | `text-on-surface` |
| Muted text | `text-on-surface-variant` |
| Divider | `border-outline-variant` |
| Success | `bg-tertiary/10 text-tertiary` |
| Error | `bg-error/10 text-error` |
| Warning | `bg-amber-100 text-amber-800` |

### Standard card shell

```html
<div class="bg-surface-container-lowest rounded-2xl border border-outline-variant
            shadow-[0_2px_12px_rgba(25,28,29,0.06)]
            hover:shadow-[0_4px_20px_rgba(25,28,29,0.1)] transition-shadow duration-200 p-6">
```

### Standard page header

```html
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-on-surface">Page Title</h1>
    <p class="text-sm text-on-surface-variant mt-1">Subtitle or description</p>
  </div>
</div>
```

Icons: use **Material Symbols Outlined** — `<span class="material-symbols-outlined">icon_name</span>`

---

## 4. Data Fetching (TanStack Query)

Use `injectQuery` from `@tanstack/angular-query-experimental` for all server state.

```typescript
import { Component, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AdminService } from '../../services/admin.service';

@Component({ ... })
export class MyPageComponent {
  private svc = inject(AdminService);

  query = injectQuery(() => ({
    queryKey: ['my-data'],
    queryFn: () => lastValueFrom(this.svc.getData()),
  }));

  // In template:
  // query.isPending() → show skeleton
  // query.isError()   → show error
  // query.data()      → show data
}
```

---

## 5. Component Signals Pattern

All state uses Angular 17 signals — no `BehaviorSubject`, no `ngModel` without `ReactiveFormsModule`.

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({ ... })
export class MyComponent {
  isLoading = signal(false);
  items     = signal<string[]>([]);
  count     = computed(() => this.items().length);

  addItem(item: string) {
    this.items.update(prev => [...prev, item]);
  }
}
```

---

## 6. Control Flow Syntax (Angular 17+)

Use new block syntax — NOT `*ngIf`, `*ngFor`, `*ngSwitch`.

```html
@if (isLoading()) {
  <app-shimmer-skeleton />
} @else if (items().length === 0) {
  <p class="text-on-surface-variant text-sm">No items</p>
} @else {
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  }
}

@switch (status()) {
  @case ('ACTIVE')    { <span class="text-tertiary">Active</span> }
  @case ('SUSPENDED') { <span class="text-error">Suspended</span> }
  @default            { <span class="text-on-surface-variant">Unknown</span> }
}
```

---

## 7. Common Operations Reference

### Navigate programmatically
```typescript
private router = inject(Router);
this.router.navigate(['/dashboard']);
this.router.navigate(['/users', userId]);
```

### Show a toast
```typescript
private toast = inject(ToastService);
this.toast.show('success', 'Saved!');
this.toast.show('error', 'Something went wrong');
```

### Reactive form with validation
```typescript
private fb = inject(FormBuilder);
form = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]],
  name:  ['', [Validators.required, Validators.maxLength(100)]],
});
```

### Auth token (from service)
```typescript
private auth = inject(AuthService);
const token = this.auth.token(); // signal-based
```

---

## 8. File Checklist for Common Tasks

| Task | Files to touch |
|---|---|
| New public page | `pages/<name>.page.ts` + `app.routes.ts` |
| New admin page | `pages/(admin)/<name>.page.ts` + `app.routes.ts` (inside guard block) |
| New API endpoint | `server/routes/api/<path>.ts` |
| New service | `app/services/<name>.service.ts` |
| New shared component | `app/components/ui/<name>.component.ts` |
| New route guard | `app/guards/<name>.guard.ts` |

---

## 9. When to Read Reference Files

| Situation | File |
|---|---|
| Complex routing (nested, lazy, guards, file-based vs manual) | `references/routing.md` |
| Server route patterns, h3 APIs, Nitro config, env vars | `references/server-routes.md` |
| Angular 17 decorators, DI, lifecycle, forms deep-dive | `references/angular-patterns.md` |
| Error: "JIT compiler unavailable" or any build/compile error | `references/pitfalls.md` |
| Template crashes, hydration issues, deployment problems | `references/pitfalls.md` |
