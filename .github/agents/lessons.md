# Lessons Learned

Additive, append-only log used by the `self-learning` skill. Never rewrite or
delete an existing entry — only add new rows/blocks.

## Index

| Date | Title | Related file | Fix |
|---|---|---|---|
| 2026-10-17 | Dangling cross-references and implicit all-tools agents went unnoticed | `.github/skills/*`, `.github/agents/*` | Added `scripts/check-references.sh`; fixed refs and tools allowlists |

## Full-Detail Entries

LESSON LEARNED (2026-10-17): Dangling references and implicit all-tools agents
Description: Skills cited files/skills that do not exist (references/orchestration-patterns.md, source-driven-development, performance-optimization, browser-testing-with-devtools); six read-only agents had no tools field.
Root cause:  No automated check; content was adapted from other sources without verifying each pointer resolves, and 'read-only' was stated in prose rather than enforced.
Fix:         Run scripts/check-references.sh before merging any agent/skill change; every agent declares a tools allowlist.
Add to:      scripts/check-references.sh, .github/skills/create-agent-or-skill/SKILL.md
Priority:    HIGH
---
