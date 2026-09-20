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
.github/agents/         19 Copilot agent definitions (planner, code review,
                         security remediation, architecture governance,
                         DevSecOps gating, event-driven design, ETL,
                         agentic-AI security review, MCP tool auditing,
                         frontend design/content/QA/accessibility/performance,
                         commit/PR/docs, rubber-duck)
.github/skills/         reusable skill references — general engineering
                         practices, frontend hydration safety + testing +
                         accessibility/performance, PDF/Excel/CSV/ETL
                         data-processing patterns, and agentic-AI-specific
                         security (OWASP LLM Top 10, lethal trifecta, MCP
                         supply chain, agent observability)
.github/instructions/   path-scoped rules Copilot applies automatically
```

## Getting started
1. Start with the `planner` agent — describe what you're trying to do and
   it will route you to the right agent(s) and present plan options before
   any implementation begins.
2. Read `.github/copilot-instructions.md` for the full agent/skill map.
3. If you're adapting this into a specific project, add your own
   project-specific data/config in the consuming repo — keep it out of
   these generic agent/skill definitions so this platform stays reusable.

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
