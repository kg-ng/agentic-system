---
name: self-learning
description: >
  Continuous improvement loop for the agents, skills, and instructions in use. Use
  during and after any non-trivial task to catch drift between agents/skills/
  instructions, systemic gaps, and recurring defect classes — then fix the guard
  rail itself. Use explicitly when asked to "self-learn", "review the agentic
  system", or "learn from this", and passively at the close of every significant task.
---

# Self-Learning

## Overview

Agents drift. A rule added to one reviewer doesn't make it into a sibling reviewer.
A defect class gets fixed once and recurs elsewhere. A skill or instruction file
quietly stops matching the code it describes. This skill turns those observations
into fixes **in the guard rails themselves** — the agent, skill, or instruction that
should have caught the problem — so the same gap is not rediscovered twice.

There is no lessons log. What a project learns belongs in that project's own agents,
skills, and instructions, where every agent reads it automatically; a separate log
file is something nobody is guaranteed to open.

This is not a retraining pipeline and not a model fine-tune. It is a structured
feedback loop: **observe → diagnose → fix-or-flag → verify**, applied consistently by
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
- Explicitly, when a user asks to "run self-learning" or "check for agentic system gaps".

**When NOT to use:** Don't encode speculation, style preferences, or one-off typos with
no systemic cause. Don't add a rule that already exists — search first.

## The Loop

```
1. OBSERVE   — something didn't get caught, or the same class of defect appeared twice
2. DIAGNOSE  — find the root cause: missing rule, stale doc, drifted copy, no check at all
3. FIX-OR-FLAG
   ├── Fix now if it's a small, safe, in-scope edit to an agent, skill, or instruction
   └── Flag with a priority + target file if it needs a broader change or a decision
4. VERIFY    — confirm the target file was actually updated, not just discussed
```

Do not skip step 4. A fix that was only described is not a fix.

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
don't conclude "reviewer missed it" without asking *why* the reviewer's rules didn't
cover it.

## Step 3: Fix or Flag

Put the fix where it will be applied automatically:

| The gap is… | Fix it in… |
|---|---|
| A check a reviewer should always run | That agent's checklist |
| A procedure or pattern many agents need | The relevant skill |
| A rule tied to certain files | A path-scoped instructions file |
| A cross-cutting convention | The project's top-level instructions |

```
Is the fix a small, safe edit in a file you already have open?
├── YES → make the edit now, in the same task, before moving to commit
└── NO (requires a larger change or a user decision)
    → Flag with Priority + exact target file(s)
    → Surface to the user before closing the task
    → Do not silently defer — a flagged-and-forgotten gap is the same failure again
```

Priority guide:
- **HIGH** — security, data integrity, or architectural-rule violation risk
- **MEDIUM** — quality/consistency gap that will cause rework but not an incident
- **LOW** — cosmetic drift, naming, or documentation polish

## Step 4: Verify

Before closing the task:

- [ ] If fixed now: the target file was actually edited — re-open it and confirm
- [ ] If flagged: the user has seen the Priority and target file, not just an internal note
- [ ] The rule was not already present elsewhere — searched first, no duplicate added
- [ ] Where a script or check can catch the defect mechanically, it was added to the project's checks

## Applying This Across Multiple Repos

If this agentic system is dropped into more than one project, treat cross-project
consistency checks as a first-class activity, not an occasional audit:
- Diff shared agents/skills (anything meant to be identical across projects) against
  each other periodically.
- If a fix is made to a shared agent/skill in one project, tell the user which other
  projects need the same fix.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's a one-off, not worth encoding" | Check whether it has a systemic cause first; if it does, the checker needs the rule. |
| "I'll fix the guard rail at the end of the session" | Session context gets lost. Fix it the moment you observe it. |
| "The user didn't ask me to improve the agents" | This protocol is passive and should run regardless of being explicitly asked. |
| "A similar rule already exists somewhere" | Read it. If it covers the case, point to it; if not, extend it rather than adding a second copy. |
| "Fixing it now is out of scope for this task" | A same-file, low-risk rule fix is always in scope. Only route out-of-scope for actual code changes elsewhere. |

## Red Flags

- A drifted shared agent (e.g. `rubber-duck`) found and left alone
- The same defect class flagged twice in the same session with no change to the checker
- A HIGH priority gap not surfaced to the user before task close
- A rule added by copy-paste into several files instead of one skill they all reference
- A task closed without asking "did any agent/skill/instruction fail to catch something?"

## Verification

- [ ] Root cause identified, not just symptom described
- [ ] Fix applied now (if safe/in-scope) or explicitly flagged with priority + target + surfaced to user
- [ ] No duplicate of an existing rule
- [ ] Cross-project drift, if found, names every affected location
