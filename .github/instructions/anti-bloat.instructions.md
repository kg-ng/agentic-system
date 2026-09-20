---
applyTo: "src/**,components/**,app/**,lib/**,data/**"
---

# Anti-Bloat Rules

## Code size
- Functions > 40 lines → too much, split it.
- Files > 200 lines → question splitting (a single cohesive primitive is an
  allowed exception if the logic genuinely doesn't decompose cleanly).

## Additions
- No new helper unless called from 2+ places in the changeset.
- No new prop/type/field added "for future use" — add it when a real
  caller needs it.
- No wrapper component/function around a single expression.
- No new dependency unless it solves something the existing toolkit can't
  already do.

## Scope
- Only modify files in scope for the task.
- Do not refactor unrelated code while implementing a feature or fixing a
  bug.
- Visual/design changes (`frontend-designer` scope) and content changes
  (`content-editor` scope) stay in separate commits — don't mix them.
- Backend logic changes and their ADR/architecture documentation
  (`architecture-governance` scope) stay in separate commits from
  unrelated feature work.
