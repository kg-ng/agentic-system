---
name: context-management
description: Manages a long agent session's context window. Use when a session has run for many turns/tool calls, when reasoning quality seems to be degrading, when switching to an unrelated task mid-session, or when deciding whether to keep working in the current context vs starting a fresh one.
---

# Context Management

## Overview

An agent's context window is a finite, shared resource: the system prompt, every
prior turn, every tool call and its output, and the current task all compete for
the same budget. Two distinct failure modes come from mismanaging it:

1. **Hard failure** — hitting the nominal token limit and having old turns
   truncated or dropped outright.
2. **Context rot** — reasoning quality quietly degrading *before* the nominal
   limit is reached, because the useful signal (the actual task, current
   constraints, recent decisions) gets diluted by a long tail of stale tool
   output, resolved side-quests, and superseded instructions.

Context rot is the more dangerous failure because there's no error message —
the agent just starts making worse decisions while sounding equally confident.
This skill is about recognizing it, deciding when to reset vs continue, and
scoping work up front so it's less likely to happen at all.

## When to Use

- A session has accumulated a large number of tool calls or turns and a new,
  unrelated task is starting
- You notice the agent repeating a mistake it already corrected earlier in the
  same session
- The agent contradicts a decision or constraint it stated earlier without
  acknowledging the change
- Reasoning quality (specificity, correctness, adherence to earlier
  instructions) seems to degrade compared to earlier in the session
- Before delegating or accepting a large unit of work — to scope it so this
  doesn't happen at all
- An orchestrator (e.g. `planner`) is deciding whether to keep delegating in
  the current session or close it out with a handoff summary

**When NOT to use:** Short sessions, single-turn tasks, or sessions well within
normal length with no symptoms below present — don't reset preemptively out of
paranoia; a reset has its own cost (re-grounding time, lost in-context nuance).

## Recognizing Context Rot

Symptoms to actively watch for, not just react to after a failure:

| Symptom | What it looks like |
|---|---|
| **Repeated mistakes** | An error already caught and fixed earlier in the session reappears in a later step, as if the correction never happened |
| **Forgotten constraints** | A scope boundary, naming convention, or explicit "don't touch X" from earlier is silently violated |
| **Contradicted decisions** | The agent states something that conflicts with a decision it made 20+ turns ago, without flagging the change |
| **Degraded specificity** | Answers get vaguer, more hedged, or more generic compared to earlier in the same session on comparable questions |
| **Tool-call thrashing** | Re-running the same read/search calls repeatedly, as if unable to recall having already gathered that information |
| **Instruction drift** | The agent's own stated plan or checklist from earlier in the session no longer matches what it's actually doing |

None of these are single-cause-diagnosable in isolation — one occurrence can be
a normal mistake. Two or more compounding in the same session, especially after
a long run of tool calls, is the actual signal.

## Reset vs Continue Decision

```
Is the *next* unit of work unrelated to the current session's task?
├── YES → reset. Don't drag an unrelated task through accumulated context
│         from the previous one — it's pure noise for the new task.
└── NO, it's a continuation
    │
    Has the session crossed a rough length threshold?
    (very high tool-call count, long multi-hour session, or a context-usage
    indicator showing heavy consumption if the platform exposes one)
    ├── NO  → continue. No signal to reset.
    └── YES → are any context-rot symptoms above actually present?
        ├── NO  → continue, but checkpoint (see below) as a precaution.
        └── YES → reset, re-grounding from durable state, not from replaying
                  the raw transcript.
```

Resetting is not "give up and start over on the task." It means: close out the
current context with a durable summary, start a fresh session, and re-ground
that fresh session from the summary — the task's progress is preserved, the
degraded context is not.

## Re-Grounding a Fresh Session

The point of a reset is to drop noise, not information. Re-ground from durable
artifacts, in this priority order, instead of replaying full history:

1. **Project instruction files** (`copilot-instructions.md` / equivalent,
   `.github/instructions/*`) — durable rules that don't change per-session.
2. **The plan/task-breakdown document** (see `planning-and-task-breakdown`) —
   what's done, what's next, acceptance criteria.
3. **A checkpoint** — a persisted summary of the prior session's state (see
   below). This is a superset of `planner`'s Session Report: it must also be
   written somewhere the fresh session can actually read it (a file, the
   session's todo/task-tracking state, or pasted verbatim into the new
   session's opening message) — a report left only in the closed chat cannot
   re-ground anything.
4. **Todo/task state** — whatever tracks in-progress vs completed items.
5. **`lessons.md`** (see `self-learning`) — durable lessons already logged, so
   a fresh session doesn't rediscover the same gap.

A fresh session should be able to resume productively from (1)-(5) alone,
without needing the previous session's raw transcript. If it can't, that's a
sign the checkpoint/summary was under-specified — fix the summary format, not
the instinct to reset.

### Writing a Good Checkpoint

Before closing a session (whether due to context-rot signals, a natural task
boundary, or switching tasks), write a checkpoint that a stranger — or a fresh
instance of yourself with no memory — could resume from:

```
CHECKPOINT
Task: <original task, one line>
Done: <what's complete, verified>
In progress: <what's partially done, current state>
Next: <the single next concrete step>
Decisions made: <anything a fresh session must not silently re-litigate>
Open questions: <anything blocked on a human decision>
```

This is a superset of `planner`'s Session Report (which is chat-oriented and
covers task/agents/files/status, but not in-progress state, decisions, or open
questions). When a `planner`-driven session needs to reset, extend its Session
Report with the fields above and persist it (e.g. as a note in the session's
todo state or a file the next session is pointed at) — don't rely on it
existing only in the chat that's about to be left behind.

## Bounded Task Scoping

The cheapest way to manage context is to never accumulate enough noise for rot
to matter. This complements `incremental-implementation` (small vertical
slices) and `planning-and-task-breakdown` (S/M-sized tasks): keep each unit of
work small enough that it comfortably fits in a single focused session with
room to spare, rather than relying on mid-flight resets to recover.

- Prefer delegating/accepting work sized S or M per `planning-and-task-breakdown`'s
  sizing table — an L or XL task is also a context-management risk, not just a
  scoping inconvenience.
- If a task requires reading many large files or making a large number of
  exploratory tool calls before any implementation starts, that's a sign to
  split the exploration from the implementation into separate checkpointed
  steps, rather than carrying all of it forward in one context.
- When a task naturally forks into unrelated sub-problems mid-session, checkpoint
  and reset between them rather than context-switching in place.

## Orchestrator Guidance (e.g. `planner`)

An orchestrator coordinating multiple agents/steps should treat "end this
session with a summary/handoff" as a first-class decision, not just an
end-of-task formality:

- Produce a Session Report (or checkpoint) at natural task boundaries, not
  only when the entire user request is complete — a long multi-agent task can
  and should checkpoint between phases.
- If the next delegated step is unrelated to what's already in context (e.g.
  moving from a security review to an unrelated frontend task), start that
  delegation from a fresh, re-grounded context rather than carrying the prior
  phase's tool-call history forward.
- If a sub-agent's own output shows context-rot symptoms (contradicts its
  earlier statements, repeats a corrected mistake), don't just re-prompt it in
  the same context — restart it with a re-grounded, distilled brief.
- Never let "we're mid-task" be a reason to skip checkpointing on a long
  session — the cost of writing a checkpoint is small; the cost of silent
  quality degradation discovered late is not.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We're not out of tokens yet, so we're fine" | Context rot happens before the hard limit. Token headroom isn't a quality guarantee. |
| "Resetting will lose all our progress" | A good checkpoint preserves progress; only the noisy transcript is dropped. |
| "It's just one small unrelated question, I'll answer it inline" | Small unrelated detours still add noise that dilutes the main task's context for no benefit. |
| "The agent seems fine, no need to checkpoint" | Symptoms are often only visible in hindsight. Checkpointing at natural boundaries is cheap insurance. |
| "I'll write the summary at the very end" | If the session ends abruptly or degrades first, there's no summary to resume from. Checkpoint as you go. |
| "Replaying the full history will re-ground it better than a summary" | Replaying history reintroduces the same noise that caused the rot. A distilled summary is the point. |

## Red Flags

- A session with a very long tool-call history and no checkpoint anywhere in it
- An agent contradicting an earlier stated decision without acknowledging it
- The same corrected mistake reappearing later in the same session
- A task handed off as one giant unit instead of being broken into S/M slices
- Starting an unrelated new task by continuing in an already-long session
  instead of resetting
- A "reset" that re-injects the full prior transcript instead of a distilled
  checkpoint (defeats the purpose)
- No session-report/checkpoint format being used at all by an orchestrator

## Verification

- [ ] Context-rot symptoms (repeated mistakes, forgotten constraints,
      contradicted decisions, degraded specificity) were actively checked for,
      not just assumed absent
- [ ] The reset-vs-continue decision was made deliberately, not by default
- [ ] If reset, re-grounding used durable artifacts (instructions, plan,
      checkpoint, lessons.md), not a full transcript replay
- [ ] A checkpoint/session-report exists at the point of any session boundary
- [ ] Delegated/accepted units of work are sized to fit comfortably in one
      session (see `planning-and-task-breakdown` sizing table)
