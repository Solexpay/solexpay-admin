# Analog.js — Known Pitfalls & Fixes

## P1 — "JIT compiler unavailable" at runtime

**Symptom:** Browser console shows `ERROR Error: JIT compiler unavailable` when navigating to a route.

**Root cause:** Angular's AOT compiler in Vite fails to compile the component's `@Component` metadata. The compiled `ɵcmp` static property is never attached to the class. When Angular's router tries to instantiate the component, it falls back to JIT, which is not bundled in production builds.

**The #1 trigger: an inline template that is too large.** The Angular Vite plugin has a practical limit of roughly 300–400 lines for inline `template: \`...\`` strings. Past that threshold, the plugin silently skips AOT compilation for the component.

**Fix — move to `templateUrl`:**

```typescript
// BEFORE (causes JIT error when template is large)
@Component({
  template: `
    ... 400+ lines of HTML ...
  `
})

// AFTER (works reliably at any size)
@Component({
  templateUrl: './my-page.page.html'
})
```

Extract the template content to a sibling `.html` file. The `.html` file must be next to the `.ts` file and the path must be relative.

**Automated extraction:**
```javascript
// Run with: node extract-template.js
const fs = require('fs');
const src = fs.readFileSync('src/app/pages/my-page.page.ts', 'utf8');
const start = src.indexOf('template: `') + 'template: `'.length;
const end = src.indexOf('`,\n  styles');  // adjust if no styles block
// or: const end = src.lastIndexOf('`\n})') + 1;
fs.writeFileSync('src/app/pages/my-page.page.html', src.slice(start, end));
```

**Other triggers for the same error:**

| Trigger | Fix |
|---|---|
| Template has a TypeScript type error (with `strictTemplates: true`) | Fix the type error — the build error message will appear in `vite build` output |
| Component class not exported (missing `export`) | Add `export` keyword |
| Route `loadComponent` points to wrong export name | Match `m.ExactExportName` exactly |
| Missing `standalone: true` | Add to `@Component` decorator |
| Missing required import in `imports: []` | Add the missing module/component/directive |
| `CommonModule` not imported but `*ngIf` / `*ngFor` used | Switch to `@if`/`@for` (Angular 17 built-in) or add `CommonModule` |

---

## P2 — Large templates: use `templateUrl`, not inline

**Rule:** If a component template exceeds ~300 lines, always use `templateUrl`.

The Angular AOT compiler in Vite processes inline templates as part of TypeScript transformation. Very large template strings create compilation units that exceed the plugin's in-memory budget and time out silently.

**Symptom:** Component works in dev mode (`vite dev`), crashes in production build with the JIT error, OR works in early dev sessions and starts failing after a hot reload.

**File naming convention:**
```
my-page.page.ts     ← component
my-page.page.html   ← template (same directory, same base name)
```

**Curly braces in `templateUrl` HTML files:**
Unlike inline templates where you need `{{ '{' }}` to escape braces in code blocks, external HTML files only escape when inside Angular binding expressions. Static `{` characters in `<pre>` or `<code>` blocks are fine as-is:
```html
<!-- In .page.html — NO escaping needed for static content -->
<pre>{ "key": "value" }</pre>

<!-- Still need Angular interpolation for dynamic values -->
<span>{{ user.name }}</span>
```

---

## P3 — File-based routing vs manual routing conflict

**Background:** Analog discovers `.page.ts` files in `src/app/pages/` automatically. This project also manually defines all routes in `app.routes.ts`. Both systems can coexist, but the manual routes take precedence when explicitly defined.

**Rule for this project:** Always add routes manually to `app.routes.ts`. Do not rely on Analog's file-based routing auto-discovery. Reason: the existing route structure (auth guard block, nested children) requires manual control.

**If you get a duplicate route error:**
Check that the same path is not defined both as a file-based route (by Analog) and as a manual route. The safest fix is to check `vite.config.ts` — if `analog({ pagesDir: ... })` is not set or is pointing to `src/app/pages`, all `.page.ts` files are auto-discovered.

To disable auto-discovery entirely (not needed for this project since it seems to work in parallel):
```typescript
// vite.config.ts
analog({
  ssr: false,
  // No pagesDir means Analog uses src/app/pages by default
  // To disable file-based routing:
  // entryServer: './src/main.server.ts',  ← SSR only
})
```

---

## P4 — `NODE_ENV` in server routes

Server route files (`src/server/routes/api/**`) run in Node.js (Nitro), not the browser. The `IS_DEV` flag from `src/server/utils/dev-mock.ts` checks `process.env['NODE_ENV'] !== 'production'`.

**Always use bracket notation** for env vars in Nitro routes due to Angular's strict property access rule:
```typescript
process.env['API_URL']     // ✓ correct
process.env.API_URL        // ✗ TypeScript error with noPropertyAccessFromIndexSignature
```

**Environment variables that must exist in `.env`:**
```
API_URL=http://api.solexpay.com.ng
NODE_ENV=development
```

For production, set these in Vercel/platform environment settings.

---

## P5 — `h3` imports must come from `h3`, not `@analogjs/router`

```typescript
// ✓ Correct
import { defineEventHandler, getHeaders, readBody, createError } from 'h3';

// ✗ Wrong — these are not re-exported by Analog
import { defineEventHandler } from '@analogjs/router';
```

---

## P6 — Default vs named exports

**Angular components** (pages, components, services): always use **named exports**.
```typescript
export class MyPageComponent {}         // ✓
export default class MyPageComponent {} // ✗ — breaks loadComponent
```

**Nitro server routes**: always use **default export** for the handler.
```typescript
export default defineEventHandler(...)  // ✓
export const handler = defineEventHandler(...)  // ✗ — Nitro won't pick it up
```

---

## P7 — `@tanstack/angular-query-experimental` gotchas

`injectQuery` must be called in the constructor context (not inside lifecycle hooks):

```typescript
// ✓ Correct — called at class field level
query = injectQuery(() => ({ queryKey: ['data'], queryFn: ... }));

// ✗ Wrong — called inside ngOnInit
ngOnInit() {
  this.query = injectQuery(...);  // injection context not active
}
```

The query function receives a signal-based reactive context. If the query key depends on a signal, use it inside the factory function:
```typescript
userId = signal('usr-001');

query = injectQuery(() => ({
  queryKey: ['user', this.userId()],
  queryFn: () => lastValueFrom(this.svc.getUser(this.userId())),
}));
```

---

## P8 — Tailwind content paths

If you add a new directory for components and styles aren't applying, check `tailwind.config.js` includes the path:
```javascript
content: [
  './src/**/*.{html,ts}',   // ← must cover all .ts and .html files
]
```

After changing `tailwind.config.js`, restart the Vite dev server.

---

## P9 — pnpm + isolated node-linker

This project uses `node-linker=isolated` in `.npmrc`. Node modules are NOT in the project root. When writing scripts that reference `node_modules/.bin/`, use pnpm's `pnpm exec` instead:

```bash
pnpm exec tsc --noEmit    # ✓
./node_modules/.bin/tsc   # ✗ — path doesn't exist
npx tsc                   # ✓ — npx searches global pnpm store
```

---

## P10 — Template interpolation for curly braces in inline templates

When you need a literal `{` or `}` in an inline template (e.g., JSON code examples), Angular would normally interpret `{{` as binding syntax. Escape with:
```html
{{ '{' }}   →  renders as: {
{{ '}' }}   →  renders as: }
```

If there are many of these (e.g., a docs page with many JSON blocks), that's a sign the template is too large for inline use. Move to `templateUrl` instead.

---

## P11 — Build fails: "Cannot find module './pages/foo.page'"

The `loadComponent` import path must exactly match the file system path (case-sensitive on Linux/Mac, case-insensitive on Windows but CI usually runs Linux):

```typescript
// File is at: src/app/pages/(admin)/Users.page.ts
// Wrong (case mismatch fails on Linux):
import('./pages/(admin)/users.page').then(m => m.UsersPageComponent)
// Correct:
import('./pages/(admin)/Users.page').then(m => m.UsersPageComponent)
```

Use lowercase file names consistently to avoid this entirely.

---

## P12 — `strictTemplates` type errors surface as JIT errors

With `"strictTemplates": true` in `tsconfig.json`, template type errors prevent AOT compilation. The error shows up as "JIT compiler unavailable" at runtime rather than a clear build error. To surface the actual error:

```bash
pnpm exec ng build --configuration development 2>&1 | head -50
# or
vite build 2>&1 | grep -A5 "error TS"
```

Common template type errors:
```html
<!-- Error: Object is possibly undefined -->
{{ user?.name }}       ← use optional chaining

<!-- Error: Property 'foo' does not exist on type 'never' -->
@if (items().length) {
  {{ items()[0].foo }}  ← TypeScript can't infer type here; use a typed variable
}
```

---

## P13 — Reserved characters in static template text (`{`, `}`, `@`)

**Symptom:** Build (or runtime fallback) fails with one of:
- `NG5002: Invalid ICU message. Missing '}'.`
- `NG5002: Unexpected character "EOF" (Do you have an unescaped "{" in your template? ...)`
- `NG5002: Incomplete block "example"` (or any unknown block name)
- "JIT compiler unavailable" in the browser when running the production bundle (each NG5002 above causes AOT to skip the component, so Angular falls back to JIT, which isn't shipped).

**Root cause:** Angular's template parser treats three characters specially in *text* (not just bindings):

| Character | Parsed as | Trigger |
|---|---|---|
| `{` ... `}` | ICU message expression (`{ count, plural, ... }`) | Any literal `{...}` in template text |
| `@name {` | Control-flow block (`@if`, `@for`, `@switch`, ...) | A `@` followed by an identifier |

This bites hardest on documentation-style pages (`docs.page.html`, READMEs rendered as HTML) where it's natural to write JSON, regex patterns, email addresses, or URL templates.

**Common triggers in this codebase:**

```html
<!-- Wrong: literal { } in JSON examples — parsed as ICU -->
<pre>
{
  "phoneNumber": "08012345678"
}
</pre>

<!-- Wrong: @example.com — parsed as `@example` block -->
<p>"email": "chidi@example.com"</p>

<!-- Wrong: regex quantifier — {11} parsed as ICU -->
<p>Pattern: ^[0-9]{11}$</p>

<!-- Wrong: URL path template — { } parsed as ICU -->
<span>/transactions/{transactionId}</span>
```

**Fix — use HTML entities for the three reserved characters:**

| Char | Entity |
|---|---|
| `{` | `&#123;` |
| `}` | `&#125;` |
| `@` | `&#64;` |

```html
<!-- ✓ Correct -->
<pre>
&#123;
  "phoneNumber": "08012345678"
&#125;
</pre>

<p>"email": "chidi&#64;example.com"</p>
<p>Pattern: ^[0-9]&#123;11&#125;$</p>
<span>/transactions/&#123;transactionId&#125;</span>
```

Entities decode to the literal character at render time, so the rendered HTML is unchanged.

**Alternative for large `<pre>` blocks — `ngNonBindable`:**

```html
<pre ngNonBindable>
{
  "phoneNumber": "08012345678",
  "email": "chidi@example.com"
}
</pre>
```

`ngNonBindable` tells Angular to skip parsing the element's contents entirely. Good for big JSON dumps; bad if you also want interpolation `{{ value }}` inside.

**What NOT to do:**
- ❌ `{{ '{' }}` / `{{ '}' }}` — interpolation that *outputs* a brace. Works in isolation but fragile when surrounded by other text the parser also examines (e.g., `{{ '{' }}id{{ '}' }}` can still trigger ICU detection on the bare `id` between two real brace characters in source).
- ❌ Backslash escaping (`\{`, `\}`) — Angular templates are HTML, not regex; backslashes are literal.

**Detection:** `grep -nE '\{[a-zA-Z0-9_]+\}|@[a-zA-Z]' src/app/pages/your-page.page.html` finds most cases. False positives on Angular control flow (`@if`, `@for`) — filter those out.

**Why this is P1's evil twin:** A single unescaped `{` in any template prevents AOT for that component, browser falls back to JIT, JIT isn't bundled, page crashes. Same symptom as P1, different root cause — always check the build output for `NG5002` errors before assuming it's a template-size issue.
