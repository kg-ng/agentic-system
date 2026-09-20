# agentic-system

A generic, reusable multi-agent engineering platform: Copilot agents,
skills, and instructions for both backend platform engineering and
frontend engineering. Designed to be dropped into (or referenced from)
any project as a starting point for an agentic engineering workflow.

Contains **no proprietary or project-specific business logic** — every
agent and skill here is written to be applicable to "a" project of that
kind, not tied to any specific company's architecture or domain model.

## What's inside

```
.github/agents/         32 Copilot agent definitions (planner, code review,
                         bloat-reviewer, alignment/bug-hunter/business-analyst/
                         cost-analyst/security-analyst design-review roles,
                         SOLID reviewer + implementer, infra-stack, test-writer,
                         incident, merge-conflict, security remediation,
                         architecture governance, DevSecOps gating,
                         event-driven design, AI/agent architecture advisor,
                         ETL, agentic-AI security review, MCP tool auditing,
                         agent-builder (self-extends the system), frontend
                         design/content/QA/accessibility/performance,
                         commit/PR/docs, rubber-duck)
.github/skills/         reusable skill references — general engineering
                         practices, API/interface design, spec-driven
                         development, deprecation/migration, observability,
                         AI/agent system architecture (workflow patterns,
                         memory types, gateway/caching/resilience/scaling
                         around a core AI service), meta-skills for the
                         agentic system itself (multi-agent-review,
                         adversarial-design-debate, self-learning,
                         setup-agent-system, create-agent-or-skill), frontend
                         hydration safety + testing + accessibility/
                         performance, PDF/Excel/CSV/ETL data-processing
                         patterns, and agentic-AI-specific security (OWASP LLM
                         Top 10, lethal trifecta, MCP supply chain, agent
                         observability)
.github/instructions/   path-scoped rules Copilot applies automatically
                         (component conventions, anti-bloat, CI workflow rules)
```

## Getting started
1. Start with the `planner` agent — describe what you're trying to do and
   it will route you to the right agent(s) and present plan options before
   any implementation begins.
2. Read `.github/copilot-instructions.md` for the full agent/skill map.
3. If you're adapting this into a specific project, add your own
   project-specific data/config in the consuming repo — keep it out of
   these generic agent/skill definitions so this platform stays reusable.

## Extending this system

New agents/skills/instructions should go through `agent-builder` (backed by the
`create-agent-or-skill` skill), which does a mandatory web-research pass before
drafting — checking official docs and comparable published agent-system designs
for current best practice, rather than drafting purely from static knowledge.
Drift and recurring gaps are tracked via the `self-learning` skill, logged to
`.github/agents/lessons.md`.

## Securing the agentic system itself
Beyond securing the code an agent works on, this platform includes skills
and agents that secure the **agents themselves** — grounded in the OWASP
Top 10 for LLM Applications (2025), OWASP's Agentic AI – Threats and
Mitigations paper, and Simon Willison's "lethal trifecta" concept:
`agentic-ai-security`, `mcp-server-hardening`, and `observability-for-agents`
skills, reviewed by the `agentic-ai-security-reviewer` and `mcp-tool-auditor`
agents.

## Related project
[`ai-security-pipeline`](https://github.com/kg-ng/ai-security-pipeline) —
a standalone Node/TypeScript security-scanning CLI/GitHub Action
(dependency audit, secret scan, native code-pattern scan, LLM-assisted
triage) that pairs naturally with the `security-remediator` and
`devsecops-pipeline` agents here.

## License
MIT
