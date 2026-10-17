---
name: verify-before-concluding
description: >
  Evidence discipline for audits, refactors, and bulk edits. Use before proposing
  to merge, cut, rename, or "fix" agents, skills, or code; before replacing a broken
  reference with a "closest match"; and before committing any scripted or bulk edit.
  Keeps conclusions tied to what was actually read and run.
---

# Verify Before Concluding

A name, a description, or a README is not evidence about what a file does. This skill
exists because an audit once proposed merging agents from their descriptions alone;
reading the bodies showed most of them checked different things. Different from
`doubt-driven-development`, which has a fresh reviewer challenge a decision: this one
governs how evidence is gathered and how edits are checked, and applies even when
working alone.

## 1. Say what you have and haven't read
Before any conclusion, list what was read in full, what was only skimmed
(names, headings, descriptions), and what was not looked at. Label every claim
**verified** (read or ran it), **inferred** (from skimming), or **assumed**.
Hedges like "looks like" are not a substitute for reading.

## 2. Read the bodies before judging overlap
To claim two things overlap, quote or cite the specific lines on both sides that
do the same job. Then ask: would anyone lose a check, a rule, or a trigger if one
were removed? If yes, they are not duplicates. Shared goals (e.g. "independent
critique") do not make two workflows the same.

## 3. Run the mechanical checks, don't eyeball them
```bash
bash scripts/check-references.sh          # dangling refs, tools allowlists, tool names
node scripts/build-claude.mjs --check     # generated .claude/ matches .github/
```
Add a check to the script when a new class of defect is found by hand, so it is
caught automatically next time.

## 4. Replacing a broken reference
Never swap in the "closest match" by name. Read the candidate target; if it does
not do the same job, remove the reference instead of redirecting it.

## 5. Check every edit before committing
- Prefer exact-match edits over `sed` one-liners; after any `sed`/bulk edit,
  read the resulting diff (`git diff -U0`) before staging.
- Look for stray text, wrong line numbers, and unintended deletions.
- One logical fix per commit, so a bad one can be reverted alone.
- Never undo a deliberate test break with `git checkout`/`git restore` on a file that has
  uncommitted work; it discards that work too. Commit first, or restore from a backup copy.
- A passing build or check is not proof the content is right; re-read the diff.

## 6. Report honestly
State outcomes as they are: what was fixed, what was left alone and why, what
could not be verified. If an earlier claim turns out wrong, retract it explicitly
and log it via the `self-learning` skill.

## Common Rationalizations
| Excuse | Reality |
|---|---|
| "The descriptions are clear enough" | Descriptions say what a file intends, not what it checks. |
| "It's a trivial sed, no need to look" | Line-number sed edits are exactly where silent damage happens. |
| "The closest name is probably the same thing" | Names drift from behavior; read the target. |
| "The check passed, so it's fine" | Checks cover known defect classes only. |

## Red Flags
- A recommendation to merge/cut with no cited lines from the bodies
- "Looks like", "probably", "seems to" in a conclusion
- A commit made without viewing its diff
- A reference redirected to a file that was never opened
