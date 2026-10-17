---
name: frontend-hydration-safety
description: Checklist and fix patterns for SSR/hydration bugs in Next.js/React apps: SSR-unsafe library imports, non-deterministic render values, and invalid nested-anchor HTML. Use before shipping any change touching client-rendered or animated components.
---

# Next.js / React SSR & Hydration Safety

A generic checklist and fix-pattern reference for the SSR/hydration bug
classes that recur across Next.js (App Router) and other React-SSR
frameworks. Use this before shipping any change touching client-rendered
or animated components.

## 1. Libraries that touch `document`/`window` at import or render time
**Symptom:** `ReferenceError: document is not defined` during build/dev,
even though the component has `"use client"`.
**Cause:** `"use client"` only controls *where the component runs after
hydration* — the framework still does an initial SSR pass for client
components. Libraries that reference browser globals as soon as their
module is evaluated (animation libs, 3D/canvas libs, some charting libs)
break during that SSR pass.
**Fix:** load the library via `next/dynamic` (or the framework's
equivalent) with SSR disabled so it's excluded entirely from server
rendering:
```ts
import dynamic from "next/dynamic";
const HeavyClientWidget = dynamic(() => import("./HeavyClientWidget"), { ssr: false });
```

## 2. Non-deterministic values computed during render
**Symptom:** `Error: Hydration failed because the initial UI does not
match what was rendered on the server.`
**Cause:** `Math.random()`, `Date.now()`, `new Date()`, or any other
non-deterministic call executed directly in a component's render/JSX
produces a different value on the server (build/SSR time) than on the
client (hydration time).
**Fix pattern:** derive the value deterministically from stable data
instead:
```ts
// bad
duration={Math.floor(Math.random() * 10000) + 10000}
// good — deterministic given the same input
duration={10000 + item.id * 1500}
```
If true randomness is required (e.g. a randomized animation on every
visit), generate it inside a `useEffect` + `useState` so it only runs
client-side after the initial hydration pass matches.

## 3. Nested interactive elements (`<a>` inside `<a>`, or `Link` inside `Link`)
**Symptom:** `Error: Hydration failed ... Expected server HTML to contain
a matching <div> in <a>` (or similar structural mismatch), often pointing
at unrelated-looking components.
**Cause:** HTML forbids nesting `<a>` tags. Browsers silently
reparent/close the outer tag when parsing invalid nested anchors, so the
DOM the browser builds differs from what React rendered — a mismatch
React can't reconcile.
**Fix pattern:** only one anchor per interactive card/component. Either
make the outer wrapper a non-interactive `<div>` (with the real link
living inside), or make the inner element a `<span>`/`<button>` instead
of `<a>`.

## 4. Unmount crashes in third-party animation libraries
**Symptom:** `TypeError: Cannot read properties of undefined (reading
'forEach')` (or similar) during unmount/cleanup.
**Cause:** Some libraries' cleanup lifecycle unconditionally iterates
over a prop (e.g. an event-listener array) that wasn't passed.
**Fix:** always pass the expected prop shape (e.g. an empty array)
explicitly, even when you don't need the feature — don't rely on the
library's internal default.

## Pre-ship checklist
- [ ] Production build completes with no prerender/SSR errors.
- [ ] No `Math.random()`/`Date.now()`/`new Date()` called directly in JSX render bodies.
- [ ] Any new animation/canvas/DOM-touching library is wrapped in a client-only dynamic import.
- [ ] No `<a>`/`Link` nested inside another `<a>`/`Link`.
- [ ] Run the dev server, open in a browser, and check the console for hydration warnings.
