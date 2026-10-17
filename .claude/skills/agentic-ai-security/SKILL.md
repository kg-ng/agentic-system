---
name: agentic-ai-security
description: Threat model and mitigations for securing the agentic system itself — prompt injection, excessive agency, tool/MCP supply chain, memory poisoning, and multi-agent trust boundaries. Use when designing, reviewing, or hardening any agent, tool, or multi-agent pipeline (not application code in general — see security-and-hardening for that).
---

# Agentic AI Security

Application security (`security-and-hardening`) protects the software an
agent operates on. This skill protects **the agent itself** — its
instructions, tools, memory, and trust boundaries with other agents and
untrusted content. Grounded in OWASP's Top 10 for LLM Applications (2025)
and OWASP Agentic AI – Threats and Mitigations (Feb 2025).

## The lethal trifecta (read this first)
Coined by security researcher Simon Willison: an agent becomes exploitable
for data exfiltration when it simultaneously has all three of:
1. **Access to private/sensitive data.**
2. **Exposure to untrusted content** (web pages, emails, documents, tool
   output, MCP server responses — anything an attacker could have written).
3. **The ability to communicate externally** (send email, make HTTP
   requests, post to a public channel, write to a file an attacker can read).

LLMs cannot reliably distinguish "instructions from my operator" from
"instructions embedded in content I'm summarizing/processing" — both are
just tokens. If an agent has all three trifecta capabilities, assume an
attacker can embed an instruction in any content the agent touches (a web
page, a PDF, a code comment, a support ticket) and have the agent exfiltrate
private data to them.

**Mitigation:** never grant all three to one agent/session without a
human-in-the-loop approval step between "processed untrusted content" and
"performs an external-communication action." Break the trifecta by removing
one leg — e.g. an agent that reads untrusted web content should not also
have unsupervised outbound network/email access in the same turn.

## OWASP LLM Top 10 (2025) — agent-relevant highlights
| Risk | What it means for an agent | Mitigation |
| --- | --- | --- |
| LLM01 Prompt Injection | Untrusted content (tool output, documents, web pages) contains instructions the model follows as if from the operator. | Treat all tool/content output as untrusted data, not instructions. Use `allowed-tools` scoping per skill/agent. Prefer structured data over free text where the agent must extract a decision from content. |
| LLM02 Sensitive Information Disclosure | Agent memory/context or logs leak secrets, PII, or internal system prompts. | Never put raw credentials in agent context; redact before logging; scope memory to what the current task needs, not the whole system's history. |
| LLM03 Supply Chain | A malicious or compromised tool/plugin/MCP server is wired into the agent. | See `mcp-server-hardening` skill — pin versions, verify publishers, review tool descriptions for hidden instructions ("tool poisoning"). |
| LLM06 Excessive Agency | An agent is granted more tools/permissions/autonomy than the task requires, so a successful injection has a large blast radius. | Least-privilege tool scoping per agent (see below). Require human approval for irreversible/high-blast-radius actions (payments, deletes, external sends, prod deploys). |
| LLM07 System Prompt Leakage | An agent's system prompt/instructions are exfiltrated via crafted input, revealing internal logic or secrets embedded in the prompt. | Never embed secrets/credentials in agent/system prompts. Treat prompts as sensitive but not as the sole security boundary — assume they can leak. |
| LLM10 Unbounded Consumption | An agent enters an unbounded loop (retries, sub-agent spawning, tool calls) driven by adversarial or malformed input, causing cost/DoS. | Cap iteration counts, tool-call counts, and sub-agent spawn depth explicitly; fail closed with a clear error rather than looping indefinitely. |

## Agentic-specific threats (OWASP Agentic AI Threats & Mitigations)
- **Memory poisoning** — an attacker injects false "facts" into an agent's
  persistent memory/context (e.g. via a document it summarized) that
  influence its future decisions. Mitigation: validate/sandbox what's
  written to long-lived memory; don't let raw untrusted content become
  "trusted" memory without review.
- **Tool misuse** — an agent uses a legitimate tool in an unintended,
  harmful way (e.g. a file-write tool used to overwrite a config it
  shouldn't touch). Mitigation: scope tool permissions narrowly (specific
  paths/commands), not "full shell access."
- **Privilege compromise** — an agent's credentials/session are used to
  perform actions beyond its intended scope, often via a chain of tool
  calls. Mitigation: short-lived, narrowly-scoped credentials per agent
  task, not one long-lived broad credential shared across all agents.
- **Rogue agents in multi-agent systems** — one compromised or
  misconfigured agent in a pipeline manipulates or feeds bad data to
  others. Mitigation: treat inter-agent messages as untrusted input too;
  don't assume "it came from another agent" means it's safe.
- **Human trust exploitation** — an agent's output is crafted (whether by
  attacker-injected content or by the model itself) to make a human
  approve something they wouldn't have approved with full information.
  Mitigation: approval requests must show the actual action being taken
  (e.g. the real diff/command), not a summary that could omit the risky
  part.
- **Repudiation & untraceability** — no audit trail exists for what an
  agent actually did, making incidents impossible to investigate.
  Mitigation: see `observability-for-agents` skill — log every tool call,
  its inputs, and its result.

## Least-privilege tool scoping
Every agent/skill should declare the narrowest set of tools/commands it
actually needs (the Agent Skills spec's `allowed-tools` field, or your
platform's equivalent), not blanket shell/network access:
```yaml
allowed-tools: Bash(npm:*) Bash(git:*) Read
```
A code-review agent needs read + search, not write + network. A
remediation agent that opens PRs needs git/bash, not arbitrary outbound
HTTP. Review this list whenever an agent's responsibilities change —
permissions should shrink back down when a capability is no longer needed.

## Human-in-the-loop gates
Require explicit human approval before any agent action that is:
- **Irreversible** (deletion, force-push, prod deploy, sending an external
  communication, financial transaction).
- **High blast radius** (affects many users/systems, not just the current
  task's scope).
- **Triggered by content the agent didn't author** (i.e. the action is a
  direct or indirect result of processing untrusted input) — this is the
  trifecta boundary from above.

## Pre-ship checklist for any new agent/tool/MCP server
- [ ] Does this agent combine all three lethal-trifecta capabilities? If
      so, is there a human approval gate between content-processing and
      external-communication?
- [ ] Is the `allowed-tools`/permission scope as narrow as the task allows?
- [ ] Are all tool outputs and inter-agent messages treated as untrusted
      data, never as trusted instructions?
- [ ] Are secrets/credentials kept out of prompts, logs, and agent memory?
- [ ] Is there an iteration/tool-call cap to prevent unbounded loops?
- [ ] Is every tool call logged with enough detail to reconstruct "what did
      this agent actually do" after the fact?
- [ ] Does any new MCP server/tool pass the `mcp-server-hardening` checklist
      before being wired in?

## Sources
- OWASP Top 10 for LLM Applications (2025) — genai.owasp.org/llm-top-10
- OWASP Agentic AI – Threats and Mitigations (Feb 2025) — OWASP GenAI
  Security Project, Agentic Security Initiative
- Simon Willison, "The lethal trifecta for AI agents" (June 2025)
