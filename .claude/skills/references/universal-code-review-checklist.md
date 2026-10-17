# Universal Code Review Checklist

Checks every reviewer agent in this system should apply, regardless of language
or platform. These are the kinds of issues that repeatedly cause production
incidents in real systems — not style preferences. Loaded by `code-reviewer`,
`solid-reviewer`, `bug-hunter`, and any other reviewer agent added later.

---

## 1. Async Error Handling & Masking

Rule: Never catch an error without understanding it. Silent catches hide bugs.

Why it matters
- Swallowing errors leads to infinite retry loops and hangs that are invisible until they cascade
- Catching-and-rethrowing in a `finally`/cleanup block can mask the real root cause
- Costs: data loss at scale, cascading failures, hours lost to misdiagnosis

BLOCK if:
- A `catch` block returns a default value with no logging and no rethrow for
  unexpected error types
- A cleanup/`finally` block can itself throw and silently replace the original error

---

## 2. Secrets & Credentials

Rule: Secrets in code lead to leaks in logs, version control history, and backups.
Never hardcode or log them.

Why it matters
- Hardcoded secrets committed to version control are exposed forever, even after
  removal, if anyone already has a clone
- Logged secrets end up in log aggregators, alerting tools, and support tickets
- Costs: forced credential rotation, potential data breach, compliance violation

BLOCK if:
- A credential, API key, or connection string is hardcoded anywhere in source
- Log statements include full request bodies, tokens, or credentials

---

## 3. Idempotency & Timezone

Rule: Operations must be deterministic. Date keys, timers, and completion markers
must use a single, explicit timezone convention throughout.

Why it matters
- Timezone bugs cause off-by-one date selection — a whole day's work re-run or skipped
- Idempotency failures cause retries to loop forever if state already exists but
  isn't recognized as such
- Costs: duplicate processing, operational overhead, silent data corruption

BLOCK if:
- A date key is derived from a different timezone than the schedule/trigger that
  produces it
- A consumer of an at-least-once delivery source (queue, webhook, event bus) has
  no idempotency guard — classify every event type as replay-safe (upsert) or not
  before shipping; non-idempotent events need a dedup mechanism

---

## 4. Infrastructure-as-Code

Rule: Stacks/modules must receive their target environment (account/region or
equivalent) explicitly at instantiation — never inferred implicitly.

Why it matters
- Missing environment context causes context-provider/lookup failures at deploy time
- Hardcoded environment values make a stack non-reusable across environments

Rule: A stack/module that imports another's resource *by name/ARN/lookup* (not by
passing the actual construct object) needs an explicit dependency declaration —
most IaC tools only auto-track dependencies when a real object reference crosses
the boundary, never a plain string/identifier.

```typescript
const workerStack = new WorkerStack(scope, 'WorkerStack', { bucketName }); // string, not a ref
// imports the bucket by name inside WorkerStack — dependency is NOT auto-inferred
workerStack.addDependency(ingestStack); // REQUIRED
```

Prefer passing the real construct object when both stacks are in the same app —
it restores automatic dependency detection. When only a lookup/import is
possible, the explicit dependency declaration is mandatory.

Rule: Avoid nested-stack-style constructs purely for code organisation — prefer
a plain construct/module. A nested deployable unit creates a real separate
deployment artifact with its own rollback/logical-ID semantics; only use it when
a genuine platform hard limit (e.g. resource count) requires it.

---

## 5. Constants & DRY

Rule: Never hardcode paths, URLs, or configuration values. Use constants,
config objects, or environment variables.

Why it matters
- Hardcoded paths couple code tightly to a specific deployment's structure
- Duplicated values across files cause sync errors during any later migration

---

## 6. Type Safety & Buffers

Rule: Never assume a type. Guard against unexpected return types or shapes,
especially at integration/API boundaries.

Why it matters
- Type assumption violations cause corrupted data or crashes at runtime that
  the type system cannot catch
- Costs: data loss, service downtime

---

## 7. Logging & Monitoring

Rule: Log at appropriate levels with enough context (correlation/trace id,
action, status) to debug in production — but never log secrets or full PII.

Why it matters
- Missing context makes production debugging effectively impossible
- Logged secrets/PII are both a security and a compliance problem

BLOCK if:
- A log statement includes raw request payloads, secrets, or full personal data
  fields (name, DOB, phone, email, document numbers) instead of metadata only
- An error-path log omits status/context needed to diagnose the failure

---

## 8. Performance — Push Filtering to the Data Layer

Rule: Never load an entire table/collection into memory to filter results in
application code. Push exclusions and joins into the query layer.

Why it matters
- Loading a full table scales with total row count, not query size — unbounded
  memory growth as the dataset grows
- Extra round trips and wasted compute even when the final result set is small

BLOCK if:
- A full-table read is immediately used to build a set for filtering another query's results
- An in-memory filter removes rows that a JOIN or WHERE clause could have excluded
- The filtered collection has no upper bound on size

---

## 9. Build Must Pass Before Commit

Rule: The project's build/typecheck must exit 0 before any commit is staged.
A passing test suite is not sufficient on its own.

Why it matters
- Compilation catches errors that mocked tests silently hide (broken comment
  blocks, unclosed syntax, missing imports, wrong types on untested paths)
- A passing test suite with a failing build means the deployed artifact won't even start

BLOCK if:
- Any agent proposes to stage or commit without first running the build
- The build exits non-zero for any file in the changeset

---

## Review Checklist (apply on every review)

- **Build**: exits 0. Check this first — before tests.
- Error handling: no silent `catch { return default }`. Rethrow unexpected errors.
- Secrets: no hardcoded creds, no secrets in logs.
- Idempotency: consistent timezone for date keys; completion logic triggers on
  state, not just count.
- IaC: environment passed explicitly; no implicit environment inference;
  dependencies between stacks/modules are real, not just implied by ordering.
- Constants: no hardcoded paths/URLs; use config/env.
- Types: no unchecked `as any`/blind casts on external input.
- Logging: no secrets/PII; sufficient context for debugging.
- Performance: no full-collection loads for in-memory filtering.
- **Dead code**: delete files/exports with zero callers immediately — don't leave
  them "for later". Verify with a repo-wide symbol search before deleting.
- **Docs/code alignment**: when implementation changes, update README/comments
  in the same commit. Stale docs are a quality violation, not a nice-to-have fix.
- **CI workflow permissions**: top-level workflow permissions should be
  least-privilege; grant elevated permissions (write scopes) only at the
  specific job that needs them.
- **CI workflow timeouts**: every job — especially any job that calls a reusable
  workflow — must specify a timeout. A hang without one blocks the pipeline indefinitely.
- **Unused variables/imports**: zero unused-variable warnings before committing.
- **Input parsing**: parsing untrusted input (e.g. `JSON.parse` on a request
  body) must guard against `null`/non-object results before use — never cast blindly.
- **Case sensitivity in comparisons**: string comparisons against a known
  constant (e.g. a status value) must not silently assume matching case —
  normalize explicitly.

---

## Escalation

If a reviewer encounters a potential violation of one of these checks, flag it
as BLOCKING and request revision. These are non-negotiable defaults; a project
may add more, but should not weaken these without an explicit, documented reason.
