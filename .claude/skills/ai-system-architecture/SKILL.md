---
name: ai-system-architecture
description: >
  Reference patterns for designing production AI/LLM-powered applications — both
  inside the "core AI service" (agent workflow patterns, memory architecture) and
  around it (API gateway, rate limiting, caching, queues, resilience, load
  balancing, autoscaling, observability). Use when designing a new AI feature/
  agent, reviewing one for production-readiness, or when an AI app "works for a
  few users" but needs to survive real traffic.
---

# AI System Architecture

Two layers to get right, not one:

1. **Core AI Service** — the agent/LLM logic itself: how it plans, calls tools,
   remembers, and produces a result.
2. **The system around it** — what makes that service survive production
   traffic: entry, protection, reuse, resilience, scale, and visibility.

A model or prompt that works correctly in a demo is necessary but not
sufficient — most production AI incidents come from the second layer, not the
first.

Sources synthesized here (check Step 0 of `create-agent-or-skill` before
treating this as exhaustive — this is a living reference, not a final word):
- Anthropic, "Building Effective Agents" (Dec 2024) — workflow vs. agent patterns
- Shirin Khosravi / Jam with AI, "AI System Design: 7 Patterns Explained" and
  "AI Agent Memory: 7 Types Explained" (video + companion articles,
  jamwithai.substack.com)
- General distributed-systems patterns (API gateway, circuit breaker, backpressure)
  predate AI and apply largely unchanged — AI just raises the stakes (higher
  latency, higher cost per request, less predictable failure modes)

---

## Part 1 — Core AI Service: Workflow Patterns

Start from the simplest building block and only add structure when a simpler
pattern demonstrably fails the task. Over-engineering an agent when a single
augmented LLM call would do is as much a violation of `anti-bloat` as
over-engineering any other system.

**Building block — the augmented LLM**
A single model call enhanced with retrieval, tools, and memory. This alone
solves a large fraction of real tasks. Don't reach for multi-step orchestration
before confirming this isn't enough.

| Pattern | Shape | When to use |
|---|---|---|
| Prompt chaining | Fixed sequence of LLM calls, each step's output feeds the next | Task decomposes cleanly into ordered sub-steps (e.g. outline → draft → polish) |
| Routing | A classifier step sends the input down one of several specialized paths | Distinct input categories need different handling/prompts/tools |
| Parallelization | Multiple LLM calls run concurrently, results aggregated | Independent subtasks, or running the same task multiple times for voting/consensus |
| Orchestrator–workers | A central LLM plans and delegates to worker LLM calls, then synthesizes | Task structure isn't known in advance and must be decided at runtime |
| Evaluator–optimizer | One LLM produces a result, another evaluates and requests revision in a loop | Iterative refinement has clear evaluation criteria and produces measurable improvement |
| Autonomous agent | The LLM plans, acts (tools), observes results, and decides next steps in an open loop | Task is open-ended, unpredictable in step count, and needs environment feedback between steps |

**Decision rule:** move down this table only as far as the task requires.
Autonomous agents trade predictability and cost control for flexibility — that
trade-off needs an explicit justification, not a default choice.

**Guardrails for autonomous agents specifically:**
- Bound the loop (max steps/iterations) — an open-ended agent without a bound
  can run away on cost or get stuck in a repeating failure pattern
- Human-in-the-loop checkpoint before any irreversible action (see
  `agentic-ai-security` skill's least-privilege/human-in-the-loop guidance)
- Log every tool call and decision for post-hoc review — an agent's "reasoning"
  is not self-documenting without explicit tracing

---

## Part 2 — Core AI Service: Memory Architecture

Memory is not one database — it's (up to) seven distinct responsibilities.
Treat "add memory" as "pick which of these this agent actually needs," not as
one generic store.

| Type | Responsibility | Typical implementation |
|---|---|---|
| Working memory | What's in the model's context right now | The context window itself — assembled per request |
| Semantic memory | Durable facts and preferences about an entity (user, account, etc.) | Key-value or document store, updated on new facts, not append-only |
| Episodic memory | Specific past experiences/interactions to recall as precedent | Vector or structured store of past cases, retrieved by similarity/relevance |
| Procedural memory | Rules, policies, workflows the agent should follow | Versioned config/prompt templates, not learned — explicit and auditable |
| External memory / retrieval | Knowledge outside the model's training and outside its own history | RAG over a document/knowledge store |
| Parametric memory | Knowledge baked into the model's weights from training | The base/fine-tuned model itself — not something the app manages directly |
| Prospective memory | Future tasks/triggers the agent should wake up for later | Scheduled jobs, durable timers, or a queue with a delay/visibility timeout |

**Design questions before adding a memory type:**
- What's the failure mode if this memory is stale, wrong, or incorrectly
  scoped to the wrong entity? (Wrong-user memory leakage is a security bug,
  not just a quality bug — treat it as such.)
- Does it need to expire, and on what basis (time, supersession, explicit deletion)?
- Is this really a new memory type, or does an existing responsibility already cover it?

---

## Part 3 — The System Around the Core AI Service

Treat the AI logic as one component behind a normal production system boundary
— it needs the same protections any high-latency, expensive-to-call backend needs.

### 3.1 API Gateway
Single controlled entrance: auth, request validation, and routing to the Core
AI Service (and to non-AI backends) live here, not scattered across clients.
See this repo's `api-and-interface-design` skill for the contract-design side
of this.

### 3.2 Rate Limiting & Admission Control
AI calls are expensive (latency + cost) compared to typical API calls — protect
capacity explicitly:
- Per-user/per-key rate limits (token bucket or leaky bucket), not just a
  global limit
- Admission control: reject or queue new requests once in-flight concurrency
  hits a ceiling, rather than letting the Core AI Service degrade for everyone
- Distinguish "too many requests" (429, retry later) from "system overloaded,
  shedding load" (503, different client handling expected)

### 3.3 Caching
- **Exact-match caching**: identical request → identical response, keyed on a
  normalized request hash. Cheapest win, use it first.
- **Semantic caching**: cache keyed on embedding similarity of the input, not
  exact text match — catches paraphrased-but-equivalent requests. Higher
  complexity and a real risk of returning a stale/wrong-enough answer — needs
  an explicit similarity threshold and invalidation policy, not "close enough."
- Never cache a response that depends on per-user private context unless the
  cache key includes that context's identity/version.

### 3.4 Message Queue (async work)
Move long-running or bursty AI work off the synchronous request path:
- Client gets an immediate acknowledgment + a way to poll/subscribe for the result
- Queue absorbs traffic spikes so the Core AI Service scales to average load,
  not peak load
- Apply this repo's `data-pipeline-hardening` skill's idempotency/dead-lettering
  guidance to any AI job queue exactly as you would to any other async pipeline

### 3.5 Timeouts, Retries, and Circuit Breakers
- Every call to a model provider or tool needs an explicit timeout — LLM calls
  can hang far longer than typical API calls under provider-side load
- Retries need a bounded count + backoff, and must only retry genuinely
  retryable failures (timeouts, 5xx) — never blindly retry a 4xx or a
  content-policy rejection
- A circuit breaker should open after a run of failures to a specific
  provider/model and fail fast (or fall back to a secondary provider/model)
  rather than let every new request queue up behind a dying dependency

### 3.6 Load Balancing & Shared State
- If there's more than one instance of the Core AI Service, session/conversation
  state must live in shared storage (cache/DB), not instance memory — a
  request load-balanced to a different instance mid-conversation must still
  see the right state
- Route by capability if using multiple model providers/versions (e.g. don't
  load-balance a request needing a large context window to an instance backed
  by a smaller-context model)

### 3.7 Autoscaling & Cold Starts
- AI workloads often have expensive cold starts (model/weights loading, GPU
  provisioning) — factor this into scale-out latency expectations
  differently than a typical stateless web service
- Scale on a metric that reflects actual AI-service load (queue depth,
  in-flight request count, GPU utilization) rather than generic CPU, which
  can be misleading for I/O-bound model-serving workloads

---

## Part 4 — Observability for AI Systems

Standard observability (see `observability-and-instrumentation` skill) plus
AI-specific additions:
- **Tracing**: trace a full agent/workflow run end-to-end, including every
  tool call and intermediate model call, not just the outer request
- **Metrics**: track cost per request, tokens per request, and latency
  percentiles per model/provider — not just request count and error rate
- **AI evaluations**: run offline/online evals against known good/bad examples
  as a first-class part of the pipeline, not an occasional manual check — a
  model or prompt change is a deploy that needs its own regression signal,
  the same way code changes need tests

---

## Applying This Skill

- Use `ai-architecture-advisor` to review a proposed AI feature/agent design
  against Parts 1–4 before implementation.
- For a significant AI architecture decision (e.g. "should this be an
  autonomous agent or a fixed workflow?", "do we need semantic caching?"), run
  `adversarial-design-debate`.
- Keep this skill itself current — see `create-agent-or-skill`'s mandatory
  research step. AI system-design practice moves fast; re-verify sources
  every few months rather than treating this as settled.
