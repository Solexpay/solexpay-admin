# Solexpay Frontend — Gemini Context

This is an **Analog.js** (Angular 17 + Vite + Nitro) project. Before working on it, load the project skill below.

## Required reading before any task

Whenever the user asks you to work on this codebase — adding pages, routes, components, server handlers, fixing Angular/Vite build errors (especially "JIT compiler unavailable"), or anything Angular/Analog-related — read these files first:

1. `.gemini/skills/analog-js/SKILL.md` — main skill, project structure, mental model, common operations
2. `.gemini/skills/analog-js/references/pitfalls.md` — known build failures and their fixes (read this when debugging)
3. `.gemini/skills/analog-js/references/routing.md` — when adding/modifying routes
4. `.gemini/skills/analog-js/references/server-routes.md` — when touching `src/server/routes/api/`
5. `.gemini/skills/analog-js/references/angular-patterns.md` — Angular 17 idioms used here (signals, control flow, standalone components)

These files are mirrored from `.claude/skills/analog-js/` so both Claude Code and Gemini CLI agents share the same project knowledge. If you update one set, update the other.

## Project basics

- Package manager: **pnpm** (with `node-linker=isolated` — use `pnpm exec`, never `./node_modules/.bin`)
- Build: `pnpm exec ng build` (production) / `pnpm dev` (dev server)
- Routes are registered manually in `src/app/app.routes.ts` — admin pages go inside the existing `canActivate: [authGuard]` children block
- All components are **standalone** with `inject()` DI and **signals** — no NgModules, no constructor injection, no BehaviorSubjects
- Templates use Angular 17 control flow (`@if`, `@for`, `@switch`) — not `*ngIf`/`*ngFor`
- Server BFF routes live in `src/server/routes/api/` using h3 (`defineEventHandler`, `getQuery`, `readBody`, `createError`)
- Material Design 3 design tokens via Tailwind (`bg-surface`, `text-on-surface`, `bg-primary`, etc.)
