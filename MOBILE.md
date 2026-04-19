# Mobile Layout Strategy — Solexpay Landing Page

## Breakpoints
| Prefix | Width   | Target                          |
|--------|---------|---------------------------------|
| (none) | < 640px | Mobile phones                   |
| `sm`   | 640px+  | Large phones / small tablets    |
| `md`   | 768px+  | Tablets and desktop             |
| `lg`   | 1024px+ | Wide desktop                    |

---

## Component Rules

### Site Nav
- Logo + "Solexpay" text: always visible, `gap-1` between them so they read as one unit
- Nav links (Features / How it Works / Loans): `hidden md:flex`
- "Admin Login": `hidden sm:flex` — not shown on mobile
- "Get the App" CTA: always visible

### Hero
- Grid: single column mobile → `md:grid-cols-2`
- H1 size: `text-4xl` → `sm:text-5xl` → `md:text-[4.25rem]`
- Padding: `px-4 sm:px-6`
- Back phone (loan approval): `hidden sm:block` — only shown sm+
- Front phone width: `w-[210px] sm:w-[260px]`
- Phone container height: `min-h-[420px] sm:min-h-[520px] md:min-h-[620px]`
- Front phone `ml-20` margin: removed on mobile (`sm:ml-20`)

### Stats Strip
- `grid-cols-2 md:grid-cols-4` — stays 2 cols on mobile ✓

### Features (bento grid)
- `grid-cols-1 md:grid-cols-3` — full-width cards stacked on mobile
- `md:col-span-2` and `md:col-span-1` only apply on md+
- Images use `object-cover` — always fills the card regardless of size

### How It Works
- **Overflow rule**: every step wrapper must have `overflow-hidden`; the parent `<section>` must have `overflow-x-hidden`
- SVG illustration sizes: `w-[220px] sm:w-[260px] md:w-full md:max-w-[300px]` — never `w-full` alone (causes bleed from drop-shadow filter)
- Illustration containers: `overflow-hidden` to clip drop-shadow
- Step 2 illustration: `order-last md:order-first` — shows below text on mobile, left on desktop
- Step numbers: `clamp(5rem, 12vw, 11rem)` — scales down on narrow screens
- Heading sizes: `text-2xl sm:text-3xl md:text-4xl`
- Section padding: `py-12 sm:py-20 md:py-28`

### Loans CTA
- Card padding: `p-12 md:p-20` ✓
- H2: `text-3xl sm:text-4xl md:text-5xl`
- Stat grid: `grid-cols-3 gap-2 sm:gap-4` — stays 3 cols, tighter gap on mobile
- Stat values: `text-xl sm:text-2xl`

### Download Section
- `flex-col md:flex-row` ✓

### Testimonials
- University badges: `flex-wrap` — wraps naturally ✓
- Reviews: `grid md:grid-cols-3` — single col on mobile ✓

### Footer
- Grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-5`
- Brand column: `sm:col-span-2` (full width on sm)
- Product / Company / Download: 1 col each on sm
- Email list: shown in brand column, stacks vertically ✓

---

## Logo Rules
- PNG is tightly cropped — actual wallet icon fills the image (no whitespace padding)
- **Nav**: `h-10 w-auto object-contain`
- **Footer**: `h-10 w-auto object-contain brightness-0 invert`
- **Login page**: `h-20 w-auto object-contain`
- **Inside dark containers**: add `brightness-0 invert` to force white rendering
- **Never** wrap in a coloured box/div — logo floats freely with `gap-1` next to "Solexpay" text

---

## General Patterns
- Page horizontal padding: always `px-4 sm:px-6`, never just `px-6`
- Sections with AOS `fade-left`/`fade-right`: wrap in `overflow-x-hidden` — AOS uses `translateX` which causes horizontal scroll if not clipped
- SVG illustrations: use explicit mobile widths (`w-[220px]`) + `shrink-0`, never `w-full` on illustrations that have drop-shadow filters
- Font sizes: always provide a mobile size first, then `sm:` or `md:` escalation
