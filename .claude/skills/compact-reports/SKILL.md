---
name: compact-reports
description: >
  Fixed short format for a subagent's report back to its orchestrator (planner), and for a
  planner's delegation brief to a subagent. Use whenever an agent finishes a task and reports up,
  or an orchestrator briefs a subagent. Not for anything a human reads, which stays plain prose.
---

# Compact Reports (agent-to-orchestrator only)

Why: every report a planner receives is re-read on each later turn, and every delegation brief is
sent fresh with each subagent call. In a multi-agent session this traffic repeats often in both
directions. Short, structured traffic costs less context and is easier to verify than prose.

## Scope

- **Applies to:** a critic/implementer agent's report back to `planner` (e.g. a `code-reviewer`
  transcript); a planner's delegation brief to a subagent.
- **Does not apply to:** anything a human reads — gate summaries, questions, PR descriptions,
  commit messages, ADRs, docs, or code comments. Write those in full, plain sentences.
- This does not replace an existing fixed transcript format an agent already uses (e.g. the
  `REVIEW TRANSCRIPT` format in the planner's Review Transcript Gate, or `qa-verifier`'s
  `QA REPORT` format). Keep those formats — this skill is for agents and handoffs that don't
  already have one.

## Report format

```
RESULT: done | blocked | failed
DID: <one line>
EVIDENCE: <file paths, line numbers, commands to re-run>
RISKS: <one line, or none>
NEXT: <one line, or none>
```

- Max ~10 lines. Findings lists: top 5 by impact, then "N more in `<path>`".
- Evidence is a pointer, never pasted content. Say `src/handlers/loan.ts:40-52`, not the lines
  themselves. Say `npm test`, not its output. If output is long, write it to a file and give the
  path.
- Keep verbatim: paths, commands, numbers, exact error lines, negations (not, never, only).
- Drop: greetings, recaps of the task, hedging, restating the brief, closing offers.
- Security findings, irreversible-action warnings, and anything where fragment order could be
  misread stay in full plain sentences — never compress those into fragments.

## Delegation brief (orchestrator to subagent)

- Name the goal, the file paths to read, the output path/format, and the stop condition. Nothing
  else.
- Point to files (a ticket, a prior critic transcript, an ADR) by path; never paste their content
  into the brief.
- Do not repeat what the subagent's own agent file or the repo's path-scoped rules already say —
  the subagent loads both.
- One job per delegation call.

## Red flags

- A report that quotes file contents or command output instead of pointing at them.
- A brief longer than the report it asks for.
- The same file or an earlier agent's full report pasted into a later prompt instead of
  referenced by path.
- Terse fragment style leaking into a PR description, ADR, commit message, or any message meant
  for a human.
