---
name: observability-for-agents
description: Structured logging, tracing, and audit-trail patterns for agent tool calls and multi-agent pipelines. Use when building or reviewing any agent that takes actions (not just answers questions), so its behavior can be reconstructed and audited after the fact.
---

# Observability for Agents

An agent that takes actions (writes files, opens PRs, calls external APIs)
without a traceable record of what it did and why is a repudiation/
untraceability risk (OWASP Agentic AI Threats) as well as a plain
operational blind spot. This skill defines what to log and how, independent
of any specific logging backend.

## What to log for every tool call
- **Timestamp**, **agent/skill name**, **task or session id**.
- **Tool name and arguments** (redact secrets/PII before writing to logs —
  never log raw credentials, tokens, or full file contents containing
  sensitive data).
- **Source of the input** that triggered the call — was it a direct user
  instruction, or derived from content the agent processed (a file, a web
  page, another agent's output)? This distinction is what lets you
  reconstruct a prompt-injection incident later.
- **Result/outcome** (success, failure, error message) and any
  human-approval decision tied to it.

## Tracing multi-agent pipelines
- Propagate a single **correlation/session id** across every agent and
  tool call in a pipeline so a full run can be reconstructed as one trace,
  not scattered fragments.
- Record **hand-offs between agents** explicitly (agent A produced output
  X, which became agent B's input) — this is what lets you find a "rogue
  agent" that injected bad data into a downstream step.
- Keep traces long enough (retention) to investigate incidents discovered
  after the fact — a common gap is rotating logs faster than an incident
  is typically discovered.

## Minimal log record shape (adapt to your logging backend)
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "session_id": "run-123",
  "agent": "security-remediator",
  "tool": "bash",
  "input_source": "user-instruction | tool-output | agent-handoff",
  "arguments": "npm audit fix",
  "result": "success",
  "human_approved": true
}
```

## What NOT to log
- Raw secrets, API keys, tokens, or full credential material.
- Full contents of documents/PII beyond what's needed to identify which
  content triggered an action (a hash or truncated excerpt is usually
  enough).

## Pre-ship checklist
- [ ] Every tool call an agent makes is logged with enough detail to
      answer "what did this agent actually do, and why."
- [ ] Logs distinguish user-originated instructions from content-derived
      or agent-derived ones.
- [ ] Secrets/PII are redacted before anything is written to a log.
- [ ] A single correlation id ties together every step of a multi-agent
      run.
- [ ] Retention is long enough to investigate incidents discovered after
      the fact, not just real-time alerts.
