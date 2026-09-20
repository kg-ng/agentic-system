---
applyTo: "components/**,app/**"
---

# Component & Style Rules (Frontend)

## Structure
```
app/                  ← App Router entry (page.tsx, layout.tsx, globals.css)
components/           ← page-level/section components
components/ui/        ← reusable UI primitives
data/                 ← content data — components read from here, don't hardcode copy
lib/utils.ts          ← cn() helper (clsx + tailwind-merge) — the only class-merging utility
```
Content-only changes belong in the data layer, not hardcoded inside components.

## Naming
- Component files: `PascalCase.tsx` matching the exported component name.
- Section components: default export. Reusable UI primitives: named export.
- Data arrays/objects: `camelCase`.

## Component conventions
- Functional components only, no class components.
- `"use client"` at the top of any component using hooks, browser APIs,
  refs, or animation/canvas libraries.
- Prop typing: prefer inline `{ prop }: { prop: Type }` over a separate
  `interface` block, unless the props object is large or reused across files.
- Use `cn()` whenever combining conditional Tailwind classes — never
  string-concatenate classes manually.

## Styling
- Tailwind utility classes only — no CSS modules, no styled-components.
- Reuse the project's central design tokens (Tailwind config / CSS
  variables) instead of hardcoding hex values or ad-hoc palette colors —
  see the project's design-system skill for the token reference.
- New global styles go in the project's global stylesheet; new reusable
  tokens go in the Tailwind config — don't invent a third place for theme
  values.

## SSR / Hydration safety (non-negotiable)
- Any import that touches `document`/`window` at module or render time
  must be lazy-loaded via a client-only dynamic import (SSR disabled).
- Never call `Math.random()`, `Date.now()`, or `new Date()` directly
  inside JSX during render — derive deterministic values instead, or move
  randomness into a client-only `useEffect`.
- Never nest `<a>`/framework `Link` tags — one real anchor per interactive
  element.
- Full details and examples: `.github/skills/frontend-hydration-safety/SKILL.md`.

## Dead code
- Exported symbol with zero callers → delete entirely, don't just remove
  the `export`.
- Commented-out code → delete it, git has history.
