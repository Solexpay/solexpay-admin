# SolexPay Admin — agent notes

Read `AGENTS.md` and `README.md` first. Key rules:

- Next.js static export (`output: "export"`). No server components that need a
  runtime, no API routes, no middleware — server logic lives in `worker/`.
- Bun only. Never use npm, pnpm or yarn.
- Biome for lint and format (`bunx biome check .`), not ESLint or Prettier.
- All data access goes through `src/lib/api/*` → `/bff/api/*`. Never store
  tokens in JS, localStorage or sessionStorage.
- URL state uses nuqs: `useQueryState(key, parser.withDefault(x).withOptions(opts))`.
- Tables render a desktop table and mobile cards, so tests must use
  `*AllBy*` queries and wrap pages in `<NuqsTestingAdapter hasMemory>`.
- Validate every form and response with zod.
