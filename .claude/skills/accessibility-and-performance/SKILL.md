---
name: accessibility-and-performance
description: WCAG accessibility and Core Web Vitals performance checklist for frontend work. Use when building or reviewing any UI component, page, or design change to catch a11y and performance regressions before they ship.
---

# Accessibility & Performance

Two frontend quality axes that are easy to regress silently and expensive
to retrofit later. Grounded in WCAG 2.2 (accessibility) and Core Web
Vitals (performance) — both are widely-adopted, testable standards rather
than subjective opinions.

## Accessibility (WCAG 2.2)
- **Semantic HTML first** — use `<button>`, `<nav>`, `<label>`, heading
  levels in order; only reach for ARIA roles when no native element fits.
- **Keyboard operability** — every interactive element must be reachable
  and operable via keyboard alone (Tab/Shift+Tab/Enter/Space), with a
  visible focus indicator.
- **Color contrast** — text meets at least 4.5:1 contrast against its
  background (3:1 for large text); never convey state (error/success)
  through color alone.
- **Alt text and labels** — every image conveying information has
  meaningful `alt`; every form input has an associated `<label>`.
- **Motion sensitivity** — respect `prefers-reduced-motion` for any
  non-essential animation.

## Performance (Core Web Vitals)
- **LCP (Largest Contentful Paint) < 2.5s** — optimize the largest
  above-the-fold element: compress/size images correctly, preload critical
  assets, avoid render-blocking resources.
- **INP (Interaction to Next Paint) < 200ms** — keep the main thread free;
  avoid long synchronous tasks on user interaction, defer non-critical JS.
- **CLS (Cumulative Layout Shift) < 0.1** — reserve space for images/ads/
  embeds up front (explicit width/height or aspect-ratio) so content
  doesn't jump as it loads.
- **Bundle discipline** — code-split by route, lazy-load below-the-fold or
  rarely-used components, audit bundle size on every dependency addition.

## How to verify
- Run an automated accessibility scan (e.g. axe-core, Lighthouse a11y
  audit) as part of CI, not just manual spot-checks.
- Run Lighthouse/PageSpeed Insights (or an equivalent CI-integrated tool)
  against representative pages, tracking the three Core Web Vitals above
  over time so regressions are caught at PR time, not after users notice.

## Pre-ship checklist
- [ ] Automated a11y scan passes with no critical/serious violations.
- [ ] Every interactive element is keyboard-operable with visible focus.
- [ ] Color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text).
- [ ] LCP/INP/CLS measured against budget for any page-level change.
- [ ] New dependencies checked against bundle-size impact before merging.
