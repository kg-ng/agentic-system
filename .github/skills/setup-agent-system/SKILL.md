---
name: setup-agent-system
description: >
  Checklist for bootstrapping this agentic system into a new or existing project.
  Use when a repo has no agents/skills/instructions yet, or when auditing an
  existing repo's agentic system for gaps against this platform's baseline.
---

Use this skill whenever this agentic-system platform is adopted by a new project,
or when auditing an existing adopter for drift/gaps.

## Step 1 — Confirm the Project's Shape

Before copying anything, answer:
- Is this backend, frontend, or both? (determines which agent/skill subset applies)
- Does it need CI/CD security gating? (`devsecops-pipeline`)
- Does it do heavy ETL/document processing? (`data-etl-agent`, `pdf-processing`, `spreadsheet-etl`)
- Is there an existing agentic system already (partial adoption, drifted copy)?

## Step 2 — Core Set (every adopter needs this)

- [ ] `planner.agent.md` — entry point, orchestrator
- [ ] `code-reviewer.agent.md` — multi-axis PR review
- [ ] `rubber-duck.agent.md` — generic logic/design reviewer, no domain bias
- [ ] `commit.agent.md` — stages/commits with Conventional Commits, never pushes
- [ ] `pr-preparer.agent.md` — pre-PR gate checklist
- [ ] `docs-writer.agent.md` — keeps docs in sync with code/agent/skill changes
- [ ] Core skills: `test-driven-development`, `debugging-and-error-recovery`,
      `incremental-implementation`, `code-review-and-quality`,
      `git-workflow-and-versioning`, `documentation-and-adrs`,
      `planning-and-task-breakdown`, `security-and-hardening`

## Step 3 — Optional Sets (adopt based on Step 1 answers)

**Architecture/quality depth:**
- [ ] `alignment.agent.md`, `bug-hunter.agent.md`, `business-analyst.agent.md`
- [ ] `solid-reviewer.agent.md` + `solid-implementer.agent.md`
- [ ] `architecture-governance.agent.md`

**Security:**
- [ ] `security-remediator.agent.md`, `security-analyst.agent.md`
- [ ] `agentic-ai-security-reviewer.agent.md`, `mcp-tool-auditor.agent.md` (if this
      project itself builds or hosts agents/MCP servers)

**Infra/cost/ops:**
- [ ] `infra-stack.agent.md`, `cost-analyst.agent.md`, `incident.agent.md`,
      `merge-conflict.agent.md`, `test-writer.agent.md`

**Frontend:**
- [ ] `frontend-designer.agent.md`, `content-editor.agent.md`, `qa-reviewer.agent.md`,
      `accessibility-reviewer.agent.md`, `performance-reviewer.agent.md`
- [ ] Skills: `frontend-hydration-safety`, `webapp-testing`, `accessibility-and-performance`

**Data/ETL:**
- [ ] `data-etl-agent.agent.md`
- [ ] Skills: `pdf-processing`, `spreadsheet-etl`, `data-pipeline-hardening`

## Step 4 — Meta Skills (recommended for all adopters)

- [ ] `multi-agent-review/SKILL.md` — propose-critique-revise loop
- [ ] `self-learning/SKILL.md` — continuous improvement loop, `lessons.md`
- [ ] `adversarial-design-debate/SKILL.md` — FOR/AGAINST design review for significant decisions
- [ ] `create-agent-or-skill/SKILL.md` — procedure (with mandatory web research step)
      for adding new agents/skills/instructions without duplicating or reinventing
      existing patterns

## Step 5 — Instructions

- [ ] At least one `applyTo`-scoped instructions file for the main source directory
      (naming conventions, dead-code rules, anti-bloat rules)
- [ ] A CI/workflow instructions file if the project has `.github/workflows/**`
      (timeouts, runner pinning, action version pins, concurrency, secrets handling)

**Anti-bloat rule:** if the main instructions file grows beyond ~100 lines, extract
its anti-bloat section into its own `anti-bloat.instructions.md`.

## Step 6 — copilot-instructions.md

- [ ] Table of all agents with one-line descriptions, grouped by category
- [ ] Table of all skills with trigger phrases
- [ ] Working conventions section (review gates, never skip, commit/push rules)
- [ ] Note on keeping project-specific business logic out of the generic
      agent/skill definitions if this platform is meant to stay reusable

## Step 7 — Verify

```bash
# Every .agent.md file has frontmatter
for f in .github/agents/*.agent.md; do
  head -1 "$f" | grep -q "^---" || echo "MISSING FRONTMATTER: $f"
done

# name: in frontmatter matches filename
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

## Step 8 — Audit an Existing Adopter for Drift

When re-running this skill against a repo that already has an agentic system:
1. Diff each agent/skill against this platform's baseline copy.
2. Flag any agent that has silently gained project-specific business logic if the
   intent was to stay generic — route that logic into project-specific config
   instead.
3. Flag any shared agent (e.g. `rubber-duck`) that has been modified per-project —
   it should stay identical everywhere it's copied.
4. Log any gap found via the `self-learning` skill.
