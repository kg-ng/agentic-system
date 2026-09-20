---
name: create-agent-or-skill
description: >
  Step-by-step procedure for adding a new Copilot agent, skill, or instructions
  file to this system — including a mandatory web-research step to check for
  better, more current, or more widely-approved patterns before drafting from
  scratch. Use when asked to "add an agent", "create a skill", "we need something
  that does X", or when auditing this repo for a missing capability.
---

## When to Use This Skill

- "Add a [role] agent"
- "Create a [name] skill"
- "We need something that does [purpose]"
- Auditing this repo for a capability gap against comparable agentic systems

This skill is deliberately different from copy-pasting an existing agent: **Step 0
is mandatory** and exists specifically to avoid reinventing a worse version of a
pattern that's already well-established elsewhere.

---

## Step 0 — Research Before Drafting (mandatory, do not skip)

Before writing a single line of a new agent/skill/instructions file:

1. **Check for an existing near-match in this repo first.** Read `.github/agents/`
   and `.github/skills/` — is there already an agent/skill that does 80% of this
   and just needs a small addition? Prefer extending over duplicating.
2. **Search the web for current best practice** on the pattern being proposed.
   Look for:
   - Official documentation for the framework/tool/platform involved (not just
     blog posts) — APIs and recommended patterns change; don't draft from
     possibly-stale training knowledge alone.
   - How comparable, well-regarded open-source or vendor-published agent
     systems structure a similar role (e.g. "code review agent design patterns",
     "AI agent tool permission scoping best practices", "OWASP agentic AI
     threats" for anything security-adjacent).
   - Recent (last 6–12 months where possible) guidance, since agent/tool
     conventions move quickly — flag explicitly if you can only find older
     material and treat it as lower-confidence.
3. **Record what you found** in a short research note (kept in the PR/session,
   not necessarily committed):
   ```
   RESEARCH NOTE — <proposed agent/skill name>
   Existing near-match in this repo: <name, or "none">
   External sources consulted: <2-4 links/sources>
   Key pattern adopted: <one or two sentences>
   Anything rejected and why: <one sentence, if applicable>
   Confidence: HIGH | MEDIUM | LOW (LOW if sources were sparse/stale)
   ```
4. If research surfaces a materially better approach than what was originally
   asked for, **say so before drafting** — don't silently substitute it, and
   don't silently ignore it either.

Skipping Step 0 is only acceptable for a trivial, purely mechanical addition (e.g.
copying an already-approved template verbatim with just a name change).

---

## Step 1 — Decide What's Needed

| Symptom | Add |
|---|---|
| Recurring task needs a dedicated persona with judgment/tools | Agent (`.agent.md`) |
| Recurring *procedure* that doesn't need its own persona — a checklist, workflow, or reference | Skill (`SKILL.md`) |
| A rule that should apply automatically to files matching a path | Instructions (`*.instructions.md`) |
| Supporting detail too long for the skill body itself | Reference doc under `.github/skills/references/` |

---

## Step 2 — Name the File

**Agent:** `{name}.agent.md` — kebab-case, no redundant prefix unless this system
namespaces agents by project/domain.
**Skill:** `{name}/SKILL.md` — one directory per skill.
**Instructions:** `{scope}.instructions.md` with `applyTo: "<glob>"` in frontmatter.

---

## Step 3 — Create the File

**Agent frontmatter** (match this repo's existing convention — check a few
existing agents first, since `model:` and `tools:` presence varies):
```yaml
---
name: {name}
description: <one or two sentences — what it does and when to invoke it>
tools: ["read", "search"]   # only what's needed — see tool-scoping table below
---
```

**Tool scoping — assign by role, least privilege first:**

| Role | Tools |
|---|---|
| Reviewer / analyst / read-only advisor | `["read", "search"]` — never `edit` |
| Implementer (writes code/config) | `["read", "edit", "search"]`, add `"bash"`/`"runCommands"` if it needs to run builds/tests |
| Orchestrator/planner | full set, but it should delegate implementation rather than edit directly |
| Reference doc (non-interactive) | omit `tools:` entirely |

**Never give a read-only reviewer `edit` or shell-execution tools.**

**Skill frontmatter:**
```yaml
---
name: {name}
description: >
  <what it's for and the trigger phrases that should invoke it>
---
```

---

## Step 4 — Wire It In

1. Add the new agent to the `planner`'s delegation table (intent → agent → review pass).
2. If it's a critic/reviewer, add it to the relevant Critic Transcript Gate section
   (see `multi-agent-review`).
3. Add it to `.github/copilot-instructions.md`'s agent/skill tables so it's
   discoverable.
4. If it's a skill, list it under the appropriate category in
   `.github/copilot-instructions.md`.

---

## Step 5 — Governance Check

Before considering the new file done:

- [ ] No credentials, secrets, or PII in agent instructions or examples
- [ ] No project-specific business logic baked in, if this system is meant to
      stay generic/reusable (keep that in the consuming project's own config)
- [ ] Agent scope is single-responsibility — one job, done well
- [ ] Terse-mode footer present if this repo's agents use one (check an existing
      agent for the convention)
- [ ] Frontmatter `name:` matches the filename
- [ ] The Step 0 research note's sources are still reasonably current — flag if
      LOW confidence

---

## Step 6 — Validate

```bash
# Every agent file has frontmatter
for f in .github/agents/*.agent.md; do
  head -1 "$f" | grep -q "^---" || echo "MISSING FRONTMATTER: $f"
done

# name: matches filename
python3 -c "
import os, re
path = '.github/agents'
for f in os.listdir(path):
    if not f.endswith('.agent.md'): continue
    content = open(os.path.join(path, f)).read()
    m = re.search(r'^name:\s*(.+)', content, re.MULTILINE)
    if m:
        expected = f.replace('.agent.md', '')
        got = m.group(1).strip().lower().replace(' ', '-')
        if got != expected:
            print(f'NAME MISMATCH: {f} -> name: {m.group(1).strip()}')
"

# Every skill has a SKILL.md
find .github/skills -maxdepth 1 -type d ! -path .github/skills | while read d; do
  [ -f "$d/SKILL.md" ] || echo "MISSING SKILL.md: $d"
done
```

---

## Gotchas

- **Training knowledge about a framework/tool can be stale** — this is exactly why
  Step 0 requires a web check, not just "I already know this pattern."
- **Don't let research paralysis block a trivial addition** — Step 0 scales with
  how novel/important the new agent or skill is, not a flat mandatory research
  essay every time.
- **A "better" pattern found via research is a recommendation, not an override** —
  surface it to the user before adopting it if it changes what was originally asked for.
- **Reference docs still need valid frontmatter** even though they're not
  interactive agents.

---

## Related Skill

Pair this skill with the `agent-builder` agent, which has web-search/fetch tooling
and runs this exact procedure end-to-end when invoked directly (e.g. "use
agent-builder to create a new incident-response agent").
