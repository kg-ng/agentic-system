---
applyTo: ".github/workflows/**"
---

# CI/CD Workflow Rules

## Required Fields for Every Job

When adding or modifying a job, it MUST have a `timeout-minutes` value. Never
omit it — a hanging job can block CI indefinitely. Use a value proportional to
the job (short for lint/unit tests, longer for deploy/e2e).

## Runner Version

Pin to a specific runner image version (e.g. `ubuntu-22.04`) — never a floating
`-latest` tag, which is non-deterministic across time.

## Language/Runtime Version

Use a single, explicit major version across all workflows in the repo (e.g. one
Node.js major version everywhere). Do not mix versions across workflow files —
it causes inconsistent dependency resolution across CI jobs.

## Action Version Pins

Always pin third-party actions to a major version tag (e.g. `@v4`). Never use
`@main` or `@latest`. When touching a workflow file already, align all actions in
that file to a consistent major version rather than leaving it mixed — but don't
make version-bump-only PRs across unrelated workflows.

## Job Ordering & Gating

Security/quality gates should run before build/deploy, not after. A downstream
job's `if:` condition must not silently bypass an upstream gate's failure — if a
job depends on `[deploy, e2e]`, its `if:` must include `success()` (or default,
which already requires success) so a failure upstream actually stops it.

## Concurrency

Define concurrency at the workflow level for any PR-triggered workflow to avoid
redundant runs stacking up:
```yaml
concurrency:
  group: <workflow-name>-${{ github.ref }}
  cancel-in-progress: true
```

## Secrets Handling

- Never echo secrets to logs
- Use `secrets: inherit` for reusable workflow calls where appropriate
- All tokens/webhook URLs must come from repository/organization secrets —
  never hardcoded

## Output Formatting

No emoji or non-ASCII characters in job names, step names, or `run:` step output
intended for CI logs/summaries — plain ASCII only, for portability and log
tooling compatibility. (Content sent to an external API/webhook as a string
literal, e.g. a Slack/Teams message body, is an acceptable exception.)

## Reusable Workflows

Internal workflows invoked with `uses: ./.github/workflows/<file>.yml` and
declaring `workflow_call:` should:
- Follow a consistent naming convention that distinguishes them from top-level
  orchestrator workflows (e.g. an underscore prefix)
- Accept `with:`/`secrets:` blocks if parameterised
- Declare the `workflow_call:` trigger explicitly

## Dependency/Security Audit Configuration

- Any allowlisted vulnerability ID in an audit config must have a comment
  explaining the dependency chain and why it can't currently be fixed
- Never remove an allowlist entry unless the vulnerability is actually resolved
  in a patched version in use
