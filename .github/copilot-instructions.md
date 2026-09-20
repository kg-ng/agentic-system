# Copilot Instructions — Agentic System

## Overview
This repo is a **generic, reusable multi-agent engineering platform**: a
set of Copilot agents, skills, and instructions covering both backend
platform engineering (code review, security remediation, architecture
governance, DevSecOps gating, event-driven design, heavy ETL/data
pipelines, agentic-AI-specific security) and frontend engineering
(React/Next.js design-system work, content sync, hydration/SSR safety,
accessibility, performance). It's designed to be dropped into (or
referenced from) other projects as a starting point for an agentic
engineering workflow — it contains no project-specific business logic.

It is deliberately generic: it does not encode any particular company's
architecture, domain model, or proprietary systems. Every agent/skill here
should read as applicable to "a" project of that kind, not "the" specific
project it may have been inspired by.

## Structure
```
.github/agents/         Copilot agent definitions (*.agent.md)
.github/skills/         reusable skill references (*/SKILL.md)
.github/skills/references/  supporting detail docs (testing patterns, security checklist)
.github/instructions/   path-scoped rules applied automatically by Copilot
```

## Agents

### Orchestration
- `planner` — entry point. Understands intent, presents plan options,
  delegates to the agents below, gates commits/pushes behind explicit
  approval. Start here for anything spanning multiple agents.

### Backend / platform
- `code-reviewer` — multi-axis PR review (correctness, security,
  performance, maintainability, tests).
- `security-remediator` — triages security-scan findings and opens
  remediation PRs/issues.
- `architecture-governance` — reviews architectural consistency, drafts/
  maintains ADRs.
- `devsecops-pipeline` — orchestrates CI/CD security gates end-to-end.
- `event-driven-architecture-advisor` — reviews event/queue-based
  integration design (idempotency, DLQs, ordering, replay).
- `data-etl-agent` — designs/reviews heavy ETL and document-processing
  pipelines (PDF/Excel/CSV).
- `agentic-ai-security-reviewer` — read-only audit of agents/skills/pipelines for
  agent-specific security risks (excessive agency, lethal-trifecta capability
  combinations, missing human-in-the-loop gates, prompt-injection surface).
- `mcp-tool-auditor` — read-only go/no-go vetting of a new MCP server or external
  tool before it's wired into the system (publisher trust, tool-description
  integrity, permission scope).

### Frontend
- `frontend-designer` — design-system/visual work. No content changes.
- `content-editor` — data-driven content sync. No styling changes.
- `qa-reviewer` — read-only hydration/SSR/runtime safety review.
- `accessibility-reviewer` — read-only WCAG 2.2 accessibility audit.
- `performance-reviewer` — read-only Core Web Vitals/bundle-size audit.

### Shared
- `commit` — stages and commits approved changes with Conventional
  Commits messages. Never pushes.
- `pr-preparer` — read-only pre-PR gate checklist + PR description draft.
- `docs-writer` — keeps README/instructions/agent/skill docs in sync.
- `rubber-duck` — generic adversarial logic reviewer, no domain bias.

## Skills
General engineering: `test-driven-development`,
`debugging-and-error-recovery`, `incremental-implementation`,
`code-review-and-quality`, `git-workflow-and-versioning`,
`documentation-and-adrs`, `planning-and-task-breakdown`,
`doubt-driven-development`, `security-and-hardening`,
`shipping-and-launch`, `caveman` (ultra-terse response mode).

Frontend: `frontend-hydration-safety` (SSR/hydration bug patterns + a
pre-ship checklist), `webapp-testing` (Playwright/browser-level testing
patterns), `accessibility-and-performance` (WCAG 2.2 + Core Web Vitals
checklist).

Data/ETL: `pdf-processing`, `spreadsheet-etl`, `data-pipeline-hardening`
(heavy ETL reliability patterns: idempotency, backpressure, dead-lettering,
observability).

Agentic AI security: `agentic-ai-security` (OWASP LLM Top 10 + Agentic AI
threats, the "lethal trifecta", least-privilege tool scoping,
human-in-the-loop gates), `mcp-server-hardening` (MCP/tool supply-chain
vetting checklist), `observability-for-agents` (audit-trail/tracing
patterns for agent tool calls).

See `.github/skills/references/` for supporting testing-patterns and
security-checklist detail docs.

## Working conventions
- Path-scoped rules in `.github/instructions/*.instructions.md` apply
  automatically to matching files — read them before editing.
- Never skip a review pass for a code change (see `planner`'s agent map).
- Any new/changed agent, skill, or MCP/tool integration must pass `agentic-ai-security-reviewer` before it's considered done.
- Never commit/push without going through `commit`'s branch-check and
  build-gate steps.
- When adapting this platform into a specific project, keep project-
  specific business logic in the consuming repo's own data/config — don't
  let it leak back into these generic agent/skill definitions.
