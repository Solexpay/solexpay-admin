# SolexPay Admin

Internal operations console for SolexPay. Next.js static export served by a
Cloudflare Worker that acts as the backend-for-frontend (BFF). It is not meant
to be publicly discoverable.

## Stack

- Next.js (static export, `out/`), React, TypeScript, Tailwind CSS
- TanStack Query / Table / Virtual, nuqs (URL state), zod, react-hook-form,
  recharts, date-fns
- Biome for lint + format, Vitest + Testing Library + MSW for tests
- Bun is the only package manager (`bun install`, `bun run …`)

## Architecture

```
browser ──► Cloudflare Access ──► Worker (worker/) ──► SolexPay API
             (email OTP)          • serves out/          (HMAC-signed
                                  • /bff/auth/*           gateway headers)
                                  • /bff/api/*
                                  • CSP nonce, headers,
                                    CSRF, rate limits
```

- The browser only talks to same-origin `/bff/*`. Sessions live in an
  encrypted `__Host-` HttpOnly cookie; no tokens are ever exposed to JS.
- The Worker signs every backend call; the backend 404s admin routes for any
  request without a valid gateway signature.
- Token refresh happens in the browser under a Web Lock so concurrent tabs
  never trigger refresh-token reuse detection.

## Development

```bash
bun install
bun run dev            # Next dev server with MSW mocks
bun run worker:dev     # Worker + BFF locally (needs a built out/)
```

## Checks

```bash
bunx biome check .
bunx tsc --noEmit
bun run test
bun run worker:typecheck && bun run worker:test
bun run build          # static export to out/ (mock worker stripped)
```

## Deploy

Deployed with Wrangler to the SolexPay Cloudflare account (not Vercel).
Secrets (`SESSION_KEY`, `GATEWAY_SECRET`) are set with
`wrangler secret put --env <env>`.

```bash
bun run build
bun run deploy:staging      # or deploy:production
```

Production refuses all traffic until `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`
are configured for its Cloudflare Access application.
