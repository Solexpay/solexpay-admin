# Solexpay Admin

The back-office console for Solexpay staff and partner schools: users, KYC,
loans, transactions, gift-card orders, NIP transfers, ops queues, the audit log
and admin accounts. The public site lives separately in `../site` (Astro) at
solexpay.com.ng; nothing on it links here.

## How it talks to the backend

The admin is a static single-page app. The browser calls the Go backend
(`../backend`) directly; there is no server of its own.

- `src/app/core/api.ts`: `API_BASE`, from `VITE_API_URL` (default
  `https://api.solexpay.com.ng/api/v1`).
- `src/app/core/api.interceptor.ts` unwraps the backend's
  `{ success, data }` envelope and sends credentials on `/auth/admin/*` calls.
- The access token stays in memory. The backend keeps the refresh token in an
  httpOnly cookie (`__Host-sx_admin_rt`, `SameSite=Strict`) on the API host, so
  page JavaScript never sees it.
- The backend only accepts browser calls from the origins in its
  `ADMIN_ALLOWED_ORIGINS`. Because the cookie is `SameSite=Strict`, the admin
  must be served from a solexpay.com.ng subdomain for sessions to survive a
  reload.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173, API calls answered by MSW mocks (src/mocks)
pnpm test       # vitest
pnpm build      # static files in dist/analog/public
```

To run against a real backend instead of the mocks, set `VITE_API_URL` (for
example `http://localhost:8080/api/v1`) and add the dev origin to the
backend's `ADMIN_ALLOWED_ORIGINS`.

## Deployment

Static files on Cloudflare Workers (assets only). Search engines are kept out
with `noindex` headers and a `Disallow: /` robots.txt.
