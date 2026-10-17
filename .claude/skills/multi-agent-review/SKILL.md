---
name: multi-agent-review
description: >
  Propose-critique-revise loop for any non-trivial change. An implementer produces
  output, one or two critics review it in order, and the implementer revises until
  every critic finds no blocking issues. Use for architectural changes, new
  integrations, and any change touching more than 3 files.
---

An implementer produces a change; critics review it sequentially; the implementer
revises until both find no blocking issues. This is generic — swap in whichever
agents this repo defines for "implementer" and "critic".

## Review Tier Gate

Evaluate the changeset before running the loop. Pick a tier:

| Tier | Condition | Action |
|---|---|---|
| SKIP | Docs/README only, CI config only, pure rename | No review — proceed directly |
| SINGLE | 1-3 files changed, no architectural surface touched | Run one critic (e.g. `code-reviewer`) |
| FULL | New service boundary, new integration pattern, auth/security touched, >5 files changed | Full multi-agent loop |

**Default to SINGLE when unsure.**

## When to Use the Full Loop

Run the loop when the task involves:
- A new integration or service boundary
- A refactor touching more than 3 files
- Any change where a silent bug would be hard to detect in tests
- Auth, authorization, or data-handling logic

Skip for: single-file edits, docs-only changes, config tweaks.

## Agent Pairs by Task (example — adapt to this repo's roster)

| Task | Implementer | Critic 1 | Critic 2 |
|---|---|---|---|
| Architecture / integration design | direct implementation | `rubber-duck` | `architecture-governance` |
| General code change | direct implementation | `code-reviewer` | (optional) `rubber-duck` |
| Security-sensitive change | direct implementation | `security-remediator` | `code-reviewer` |

## The Loop

### Round 1 — Implement
Pass to the implementer: task description, acceptance criteria, constraints.
Implementer produces the complete file set. Do not commit yet.

### Round 2 — Critic 1
Pass to critic 1: full changed files + original task description.
Critic returns findings: Blocking / Warning / Info.

### Round 3 — Critic 2 (if FULL tier)
Pass the same diff to critic 2 with the original task description.
Critic returns its own findings.

### Revision
If any Blocking findings exist, pass them back to the implementer to fix.
Repeat Round 2 (+ Round 3) on the revised output.

### Stop When
All critics return no Blocking findings in the same round.

## Maximum Rounds

3 full rounds. After that, present remaining warnings to the user and let them decide.

## Critic Transcript Gate

Each critic must return a transcript block:

```
CRITIC TRANSCRIPT — <agent name> — Round <N>
Task reviewed: <task>
Files reviewed: <files>

BLOCKING: <findings or "none">
WARNING: <findings or "none">

Verdict: PASS | FAIL
```

Do not proceed to the next step without a valid transcript from every required critic.
