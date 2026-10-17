---
name: webapp-testing
description: End-to-end and component testing patterns for web frontends — Playwright/browser automation, test data isolation, and flake prevention. Use when adding or reviewing tests for any frontend feature, or when an agent needs to verify UI behavior rather than just unit logic.
---

# Web App Testing

Unit tests (see `test-driven-development`) verify logic in isolation.
This skill covers testing a frontend the way a user experiences it —
in a real or headless browser — which is what an agent needs when it must
verify that a UI actually renders/behaves correctly, not just that a
function returns the right value.

## When to reach for browser-level testing
- Verifying a full user flow (navigate, fill a form, submit, see a result).
- Catching hydration/SSR mismatches that unit tests can't see (a component
  can pass unit tests and still fail to hydrate correctly).
- Visual/layout regressions that only manifest in a rendered DOM.
- Accessibility checks that require a real accessibility tree (see
  `accessibility-and-performance`).

## Core patterns
- **Isolate test data per test** — don't let tests share mutable state
  (a shared test user/account) that causes order-dependent flakiness.
- **Wait for state, not time** — assert on a visible element/condition
  appearing, never `sleep(n)`; fixed waits are the #1 cause of flaky
  browser tests.
- **Prefer accessible selectors** (role, label, text) over CSS classes or
  DOM structure — this doubles as an accessibility check and is more
  resilient to markup refactors.
- **Run against a production-like build**, not just dev mode — dev-mode
  behavior (fast refresh, unminified bundles) can mask real hydration or
  bundling issues that only appear in the built output.
- **Capture traces/screenshots on failure** so a failure is diagnosable
  without needing to reproduce it locally first.

## Minimal example (Playwright)
```ts
import { test, expect } from "@playwright/test";

test("submits the contact form", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Message sent")).toBeVisible();
});
```

## Pre-ship checklist
- [ ] Tests assert on visible state/text, never on fixed timeouts.
- [ ] Selectors are accessible-role/label based where practical.
- [ ] Tests run against a built (not just dev-mode) app in CI.
- [ ] Failures capture a trace/screenshot for diagnosis.
- [ ] No test depends on another test's leftover state.
