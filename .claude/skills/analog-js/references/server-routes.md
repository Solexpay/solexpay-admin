# Analog.js — Server Routes (Nitro BFF) Reference

## Overview

Server routes live in `src/server/routes/api/` and are handled by **Nitro** (the server engine Analog bundles). They act as a Backend-For-Frontend (BFF): they receive requests from the Angular SPA, optionally validate/transform them, and proxy them to the real backend at `process.env['API_URL']`.

The real backend is a Spring Boot API at `http://api.solexpay.com.ng`.

---

## File Naming → URL Mapping

Nitro uses file-based routing for server routes. The file path IS the URL:

| File path | URL | HTTP method |
|---|---|---|
| `api/auth/login.post.ts` | `POST /api/auth/login` | POST only |
| `api/auth/login.ts` | `/api/auth/login` | Any method |
| `api/admin/users.ts` | `GET /api/admin/users` | Any method |
| `api/admin/users/[id].ts` | `/api/admin/users/:id` | Any method |
| `api/admin/users/[id].suspend.ts` | `/api/admin/users/:id/suspend` | Any method |
| `api/admin/users.post.ts` | `POST /api/admin/users` | POST only |

**Rules:**
- `.post.ts`, `.get.ts`, `.put.ts`, `.patch.ts`, `.delete.ts` suffix restricts the handler to that method
- `[id]` in the filename becomes a dynamic path segment
- Filenames map to URL segments — keep them lowercase

---

## Standard Handler Template

```typescript
import { defineEventHandler, getHeaders, readBody, createError } from 'h3';
import { IS_DEV, MOCK } from '../../utils/dev-mock';

export default defineEventHandler(async (event) => {
  // 1. Auth check
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  // 2. Dev mode short-circuit (returns mock data, skips real network call)
  if (IS_DEV) return { data: MOCK.something };

  // 3. Forward to real backend
  const res = await fetch(`${process.env['API_URL']}/example-endpoint`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

**Always use `export default`** for Nitro handlers — named exports are not picked up.

---

## Reading Inputs

```typescript
import { defineEventHandler, getHeaders, getQuery, readBody, getRouterParam } from 'h3';

export default defineEventHandler(async (event) => {
  // Path param — for files named [id].ts
  const id = getRouterParam(event, 'id');         // string | undefined

  // Query params (GET /api/users?page=2&status=ACTIVE)
  const q = getQuery(event);                       // Record<string, string>
  const page = Number(q['page'] ?? 1);
  const status = String(q['status'] ?? '');

  // Request body (POST/PUT/PATCH)
  const body = await readBody(event);             // unknown — always validate

  // Request headers
  const headers = getHeaders(event);
  const { authorization, 'content-type': ct } = headers;

  // HTTP method
  const method = event.method;                    // 'GET' | 'POST' | ...
});
```

---

## Writing Responses

Nitro serializes the returned value as JSON automatically:

```typescript
// Object → { "key": "value" }
return { success: true, data: result };

// Set status code explicitly
import { setResponseStatus } from 'h3';
setResponseStatus(event, 201);
return { success: true, message: 'Created' };

// Error (throws, stops execution)
throw createError({ statusCode: 400, message: 'Invalid email' });
throw createError({ statusCode: 401, message: 'Unauthorized' });
throw createError({ statusCode: 403, message: 'Forbidden' });
throw createError({ statusCode: 404, message: 'Not found' });
throw createError({ statusCode: 500, message: 'Internal server error' });
```

---

## Forwarding to the Real Backend

The backend base URL is `process.env['API_URL']` (bracket notation required — see Pitfall P4).

```typescript
// GET request, forward auth header
const res = await fetch(`${process.env['API_URL']}/v1/admin/users`, {
  headers: { Authorization: authorization! },
});

// POST request with body
const res = await fetch(`${process.env['API_URL']}/v1/auth/login`, {
  method: 'POST',
  headers: {
    'Authorization': authorization!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

// Always check response
if (!res.ok) {
  const text = await res.text();
  throw createError({ statusCode: res.status, message: text });
}
return res.json();
```

---

## Dev Mode Mock Pattern

`src/server/utils/dev-mock.ts` exports:
- `IS_DEV: boolean` — `true` when `process.env['NODE_ENV'] !== 'production'`
- `MOCK: Record<string, unknown>` — static mock data objects for every endpoint

```typescript
import { IS_DEV, MOCK } from '../../utils/dev-mock';

if (IS_DEV) return MOCK.dashboard;
if (IS_DEV) return MOCK.users;
if (IS_DEV) return MOCK.transactionList;
```

When adding a new server route, add a corresponding key to `MOCK` in `dev-mock.ts` so the route works during local development without hitting the real backend.

**Mock data shape must match the real backend response shape.** The Angular service that calls the endpoint expects the same structure in both dev and prod.

---

## Validation Utilities

Path: `src/server/utils/validate.ts`

These throw `createError({ statusCode: 400, ... })` automatically if validation fails:

```typescript
import {
  assertEmail,
  assertPassword,
  assertUuid,
  assertNonEmptyString,
  allowQueryParams
} from '../../utils/validate';

// Email format check
assertEmail(body?.email);

// Password minimum length (8 chars)
assertPassword(body?.password);

// UUID v4 format
assertUuid(getRouterParam(event, 'id'));

// Non-empty string, with optional max length
assertNonEmptyString(body?.reason, 'reason', 512);

// Strip unknown query params (throws 400 if unknown keys present)
allowQueryParams(getQuery(event), ['page', 'size', 'status', 'search']);
```

---

## Complete Examples

### POST endpoint — Login

```typescript
// src/server/routes/api/auth/login.post.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { IS_DEV, MOCK } from '../../../utils/dev-mock';
import { assertEmail, assertPassword } from '../../../utils/validate';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  assertEmail(body?.email);
  assertPassword(body?.password);

  if (IS_DEV) return MOCK.loginResponse;

  const res = await fetch(`${process.env['API_URL']}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

### GET with path param — User by ID

```typescript
// src/server/routes/api/admin/users/[id].ts
import { defineEventHandler, getHeaders, getRouterParam, createError } from 'h3';
import { IS_DEV, MOCK } from '../../../../utils/dev-mock';
import { assertUuid } from '../../../../utils/validate';

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const id = getRouterParam(event, 'id');
  assertUuid(id);

  if (IS_DEV) return MOCK.userDetail;

  const res = await fetch(`${process.env['API_URL']}/v1/admin/users/${id}`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

### GET with query params — Paginated list

```typescript
// src/server/routes/api/admin/users.ts
import { defineEventHandler, getHeaders, getQuery, createError } from 'h3';
import { IS_DEV, MOCK } from '../../../utils/dev-mock';
import { allowQueryParams } from '../../../utils/validate';

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const q = getQuery(event);
  allowQueryParams(q, ['page', 'size', 'status', 'search']);

  if (IS_DEV) return MOCK.userList;

  const params = new URLSearchParams(q as Record<string, string>).toString();
  const res = await fetch(`${process.env['API_URL']}/v1/admin/users?${params}`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

### POST action on a resource

```typescript
// src/server/routes/api/admin/users/[id].suspend.ts
import { defineEventHandler, getHeaders, getRouterParam, readBody, createError } from 'h3';
import { IS_DEV, MOCK } from '../../../../utils/dev-mock';
import { assertUuid, assertNonEmptyString } from '../../../../utils/validate';

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const id = getRouterParam(event, 'id');
  assertUuid(id);

  const body = await readBody(event);
  assertNonEmptyString(body?.reason, 'reason', 255);

  if (IS_DEV) return { success: true, message: 'User suspended (mock)' };

  const res = await fetch(`${process.env['API_URL']}/v1/admin/users/${id}/suspend`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: body.reason }),
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
```

---

## h3 Full API Reference

All imports come from `'h3'` — never from `'@analogjs/router'` (Pitfall P5).

### Event handlers
| Function | Purpose |
|---|---|
| `defineEventHandler(fn)` | Wrap async handler function |
| `defineEventHandler({ onRequest, handler })` | Handler with middleware |

### Reading the request
| Function | Returns |
|---|---|
| `getHeaders(event)` | `Record<string, string>` — all headers, lowercase |
| `getHeader(event, name)` | `string \| undefined` — single header |
| `getQuery(event)` | `Record<string, string>` — parsed query string |
| `readBody(event)` | `Promise<unknown>` — parsed JSON body |
| `getRouterParam(event, name)` | `string \| undefined` — path param |
| `getRouterParams(event)` | `Record<string, string>` — all path params |
| `getCookie(event, name)` | `string \| undefined` |

### Writing the response
| Function | Purpose |
|---|---|
| `setResponseStatus(event, code)` | Set HTTP status code |
| `setHeader(event, name, value)` | Set response header |
| `setCookie(event, name, value, opts)` | Set cookie |
| `sendRedirect(event, url, code?)` | Redirect response |
| `createError({ statusCode, message })` | Create and throw HTTP error |

---

## Environment Variables

Variables are read from `.env` (local) or platform environment (production/Vercel).

Required variables:
```
API_URL=http://api.solexpay.com.ng
NODE_ENV=development
```

**Always use bracket notation** — TypeScript `noPropertyAccessFromIndexSignature` requires it:
```typescript
process.env['API_URL']      // ✓
process.env['NODE_ENV']     // ✓
process.env.API_URL         // ✗ TypeScript error
```

For Vercel production deployment, set `API_URL` and `NODE_ENV=production` in the Vercel dashboard under Project → Settings → Environment Variables.

---

## Nitro Config (vite.config.ts)

The Nitro server config is nested under `analog()` plugin options in `vite.config.ts`:

```typescript
analog({
  ssr: false,
  nitro: {
    routeRules: {
      '/api/**': { cors: true }
    },
    // Add custom Nitro config here if needed:
    // runtimeConfig: { ... }
    // plugins: ['./src/server/plugins/my-plugin.ts']
  }
})
```

**Never restart Vite manually for server route changes** — Nitro watches `src/server/routes/**` and hot-reloads automatically.

---

## Angular Service → Server Route Connection

Angular services in `src/app/services/` call server routes via `HttpClient`. The base URL is `/api` (same origin). Services call `/api/...` and Nitro handles them.

```typescript
// src/app/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers(params?: Record<string, string>): Observable<UserListResponse> {
    return this.http.get<UserListResponse>('/api/admin/users', { params });
  }

  suspendUser(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`/api/admin/users/${id}/suspend`, { reason });
  }
}
```

The auth token is attached via an Angular HTTP interceptor — services do NOT need to pass the Authorization header manually.

---

## Auth Interceptor

The `AuthInterceptor` (`src/app/interceptors/auth.interceptor.ts`) reads the token from `AuthService` and adds `Authorization: Bearer <token>` to every outgoing request automatically.

Server routes receive the full `Authorization: Bearer <token>` header in `getHeaders(event).authorization`.

---

## Standard Backend Response Envelope

All Spring Boot backend responses follow this pattern:

```json
{
  "success": true,
  "message": "Request successful",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

Server routes typically `return res.json()` directly — the Angular service receives the full envelope. Components access `.data` to get the actual payload.

---

## Error Handling Conventions

| Scenario | Status code | Message source |
|---|---|---|
| Missing auth header | 401 | Hardcoded in BFF |
| Invalid input (bad UUID, empty field) | 400 | `validate.ts` assertion message |
| Backend returned non-OK | Same as backend | `await res.text()` from backend body |
| Unexpected server error | 500 | Let Nitro default handler catch it |

Do NOT swallow errors with empty catch blocks. Let them propagate so the Angular HTTP interceptor can handle them (show toast, redirect to login on 401, etc.).

---

## Adding to `dev-mock.ts`

When creating a new server route, add mock data for it:

```typescript
// src/server/utils/dev-mock.ts
export const MOCK = {
  // ... existing mocks ...

  // Add your new mock:
  myNewEndpoint: {
    success: true,
    message: 'OK',
    data: {
      id: 'mock-id-001',
      name: 'Mock Name',
      status: 'ACTIVE',
    },
    timestamp: '2024-01-01T12:00:00Z'
  }
};
```

Then in your route:
```typescript
if (IS_DEV) return MOCK.myNewEndpoint;
```
