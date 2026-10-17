---
name: self-learning
description: >
  Continuous self-improvement loop for this agentic system. Use during and after
  any non-trivial task to catch drift between agents/skills/instructions, systemic
  gaps, and recurring defect classes — then log them as durable lessons. Use
  explicitly when asked to "self-learn", "review the agentic system", or "log a
  lesson", and passively at the close of every significant task.
---

# Self-Learning

## Overview

Agents drift. A rule added to one reviewer doesn't make it into a sibling reviewer.
A defect class gets fixed once and recurs elsewhere. A skill or instruction file
quietly stops matching the code it describes. This skill turns those observations
into a durable, versioned record — a `lessons.md` file — so the same gap is never
rediscovered twice.

This is not a retraining pipeline and not a model fine-tune. It is a structured
feedback loop: **observe → diagnose → log → fix-or-flag**, applied consistently by
whichever agent has visibility into the gap.

## When to Use

- At the close of any significant task (the `planner`'s own closing checklist should
  reference this skill).
- After any code review, critic transcript, or audit that surfaces a BLOCKING or
  repeated finding.
- When comparing a shared agent/skill against how a similar one behaves elsewhere in
  the system (e.g. two reviewer agents with slightly different checks) and finding
  drift.
- When a bug is fixed in one place that plausibly exists in an equivalent code path
  elsewhere.
- Explicitly, when a user asks to "run self-learning", "check for agentic system
  gaps", or "log a lesson".

**When NOT to use:** Don't log speculation, style preferences, or one-off typos with
no systemic cause. Don't duplicate an existing lesson — search first.

## The Loop

```
1. OBSERVE   — something didn't get caught, or the same class of defect appeared twice
2. DIAGNOSE  — find the root cause: missing rule, stale doc, drifted copy, no check at all
3. LOG       — append a structured entry to lessons.md
4. FIX-OR-FLAG
   ├── Fix now if it's a small, safe, in-scope doc/rule update
   └── Flag with a priority + owner if it requires a broader change or a decision
5. VERIFY    — confirm the fix target file was actually updated, not just logged
```

Do not skip step 5. A logged-but-unfixed lesson is only useful if someone reads the
log — a lesson with a merged fix is useful automatically.

## Step 1: Observe — Where Gaps Hide

Actively look in these places, don't wait for a failure to surface one:

```
While reading any planner/critic/reference file for delegation:
  → Diff it mentally against similar agents in this system
  → Same agent role, different rules? → drift
  → A check present in one reviewer but absent in a comparable one? → gap

While reviewing test output or diffs across a task:
  → Same defect class recurring (e.g. missing null guard, banned pattern reintroduced)?
    → systemic gap, not a one-off — the *checker* is the thing to fix, not just the code

While closing any task:
  → "Did any agent, skill, or instruction file fail to catch something it should have?"
  → If yes → this skill, before commit
```

## Step 2: Diagnose

For each observed gap, answer explicitly:

| Question | Example answer |
|---|---|
| What broke or was missed? | `code-reviewer` didn't flag a hardcoded config value |
| Why wasn't it caught? | The check exists conceptually but isn't in the reviewer's checklist |
| Is it isolated or systemic? | Systemic — likely true for other reviewer agents too |
| What's the smallest fix? | Add the check to the reviewer's required checklist |

Root-cause it the same way you would a bug (see `debugging-and-error-recovery`) —
don't log "reviewer missed it" without asking *why* the reviewer's rules didn't
cover it.

## Step 3: Log

Append to `.github/agents/lessons.md` (create it if it doesn't exist). Never rewrite
or delete prior entries — lessons are additive history.

Index-row format:

```
| YYYY-MM-DD | <short title> | <skill or file most relevant> | <fix in one line> |
```

Full-detail format (used in the referenced skill/agent file, or inline if no better
home exists):

```
LESSON LEARNED (YYYY-MM-DD): <short title>
Description: <what was found>
Root cause:  <why it wasn't caught before>
Fix:         <what rule or file should be added or updated>
Add to:      <exact .github/ file path(s)>
Priority:    HIGH | MEDIUM | LOW
---
```

## Step 4: Fix or Flag

```
Is the fix a small, safe doc/rule update in a file you already have open?
├── YES → make the edit now, in the same task, before moving to commit
└── NO (requires a larger change or a user decision)
    → Flag with Priority + exact target file(s)
    → Surface to the user before closing the task
    → Do not silently defer — a flagged-and-forgotten lesson is the same failure again
```

Priority guide:
- **HIGH** — security, data integrity, or architectural-rule violation risk
- **MEDIUM** — quality/consistency gap that will cause rework but not an incident
- **LOW** — cosmetic drift, naming, or documentation polish

## Step 5: Verify

Before closing the task:

- [ ] The lesson is in `lessons.md` with today's date
- [ ] If fixed now: the target file was actually edited — re-open it and confirm
- [ ] If flagged: the user has seen the Priority and target file, not just an internal note
- [ ] No duplicate entry was created — searched existing table first

## Applying This Across Multiple Repos

If this agentic system is dropped into more than one project, treat cross-project
consistency checks as a first-class activity, not an occasional audit:
- Diff shared agents/skills (anything meant to be identical across projects) against
  each other periodically.
- If a fix is made to a shared agent/skill in one project, log a lesson noting every
  other project that needs the same fix.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's a one-off, not worth logging" | If it happened once without a systemic cause, a one-line note still prevents re-debugging it later. |
| "I'll log it at the end of the session" | Session context gets lost. Log the moment you observe it. |
| "The user didn't ask for a lesson" | This protocol is passive and should run regardless of being explicitly asked. |
| "This is basically the same as an earlier lesson" | Check first. If truly identical, don't duplicate — if related but distinct, log as a new row referencing the old one. |
| "Fixing it now is out of scope for this task" | A same-file, low-risk doc/rule fix is always in scope. Only route out-of-scope for actual code changes elsewhere. |

## Red Flags

- A drifted shared agent (e.g. `rubber-duck`) found and not logged
- The same defect class flagged twice in the same session without a systemic lesson entry
- A HIGH priority lesson logged but not surfaced to the user before task close
- Lessons file edited to remove or rewrite history instead of appending
- A task closed without asking "did any agent/skill/instruction fail to catch something?"

## Verification

- [ ] Lesson(s) logged to `lessons.md`, additive (not destructive)
- [ ] Root cause identified, not just symptom described
- [ ] Fix applied now (if safe/in-scope) or explicitly flagged with priority + target + surfaced to user
- [ ] No duplicate of an existing lesson
- [ ] Cross-project drift, if found, notes every affected location
