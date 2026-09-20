---
name: adversarial-design-debate
description: >
  Adversarial design review for significant architecture decisions. An Advocate
  and a Challenger argue FOR and AGAINST a proposed approach, respond to each
  other, and a Moderator produces a recommendation. Use for decisions like "should
  we split this into two services?", "should we adopt this new integration
  pattern?", or "should we replace X with Y?".
---

Use this skill when facing a significant design decision — not for routine code
review. Examples: "should this become its own service?", "should we move
validation into a middleware layer?", "should we adopt event-driven instead of
synchronous calls here?"

## Roles

| Role | Agent | Job |
|---|---|---|
| Advocate | `rubber-duck` | Steelmans the proposal |
| Challenger | `code-reviewer` (or `architecture-governance`) | Finds flaws and risks |
| Business Analyst | `business-analyst` | Evaluates value, scope, and domain fit |
| Cost Analyst | `cost-analyst` | Identifies cost/resource risks |
| Security Analyst | `security-analyst` | Checks auth, data exposure, network risk |
| Moderator | `planner` | Runs rounds, shows everything live, produces verdict |

Not every round is required for every decision — skip Cost/Security Analyst rounds
if the decision has no meaningful cost or security surface, but say so explicitly
rather than silently omitting them.

---

## Round 1 — State the Proposal

The requester (or planner) opens with:

```
DESIGN PROPOSAL
───────────────
Decision: <one sentence>
Proposed approach: <what you want to do>
Rationale: <2-3 sentences>
Alternatives considered: <what you ruled out and why>
Context:
  Relevant files: <file paths>
  Constraints: <e.g. "must not break the existing public API">
```

---

## Round 2 — Advocate Position

`rubber-duck` argues FOR the proposal:

```
ADVOCATE — Round 2
──────────────────
Strongest argument: <why this approach is correct>
Supporting evidence: <reference to files, patterns, or external docs>
Risk acknowledged: <one risk the Advocate concedes>
```

---

## Round 3 — Challenger Position

`code-reviewer` (or `architecture-governance`) argues AGAINST:

```
CHALLENGER — Round 3
─────────────────────
Primary objection: <the most significant flaw>
Secondary objection: <a second concern>
Evidence: <reference to files, patterns, or external docs>
Counter to Advocate: <direct response to Round 2>
```

---

## Round 4 — Advocate Rebuttal

`rubber-duck` responds to the Challenger:

```
ADVOCATE REBUTTAL — Round 4
────────────────────────────
Response to primary objection: <direct answer>
Response to secondary objection: <direct answer>
Revised position (if any): <concession or refinement>
```

Maximum 3 Advocate ↔ Challenger exchange rounds (Rounds 2–4). If unresolved after
Round 4, the Moderator calls it and the requester decides.

---

## Round 5 — Business Analyst (skip if no meaningful business/scope surface)

```
BUSINESS ANALYST — Round 5
───────────────────────────
Value delivered: <what need this satisfies>
Scope concern: <is the proposal larger than the problem?>
Domain fit: <does it align with the project's stated architecture/conventions?>
Verdict: PROPORTIONATE | OVER-ENGINEERED | UNDER-SCOPED
```

---

## Round 6 — Cost Analyst (skip if no meaningful cost surface)

```
COST ANALYST — Round 6
────────────────────────
Cost driver identified: <what resource/infra drives cost>
Estimated impact: <order of magnitude — negligible / low / medium / high>
Cheaper alternative: <if one exists>
Verdict: ACCEPTABLE | NEEDS REVIEW
```

---

## Round 7 — Security Analyst (skip if no meaningful security surface)

```
SECURITY ANALYST — Round 7
───────────────────────────
Risk identified: <auth, network, or data exposure concern>
Severity: LOW | MEDIUM | HIGH
Mitigation required: <what must change before this is safe>
Verdict: SAFE | CONDITIONAL | BLOCKING
```

---

## Moderator Verdict

`planner` closes the debate:

```
MODERATOR VERDICT
──────────────────
Proposal: <one-line restatement>
Outcome: APPROVED | APPROVED WITH CONDITIONS | REJECTED

Rationale: <2-3 sentences synthesising all rounds>
Conditions (if any):
  - <condition 1>
  - <condition 2>
Recommended next step: <what the requester should do now>
```

---

## Rules

- Show every position block to the user in real time — never buffer
- Maximum 3 Advocate ↔ Challenger exchange rounds — after that the Moderator calls it
- Never skip the Challenger role
- Explicitly state (don't silently skip) any Round 5–7 role that doesn't apply
- The debate does not constitute a code change — no commit needed
