# Lessons Learned

Additive, append-only log used by the `self-learning` skill. Never rewrite or
delete an existing entry — only add new rows/blocks.

## Index

| Date | Title | Related file | Fix |
|---|---|---|---|
| 2026-10-17 | Dangling cross-references and implicit all-tools agents went unnoticed | `.github/skills/*`, `.github/agents/*` | Added `scripts/check-references.sh`; fixed refs and tools allowlists |
| 2026-10-17 | Generated Claude copy of a skill still taught Copilot tool syntax | `.github/skills/create-agent-or-skill/SKILL.md` | Source skill documents both syntaxes; check 6 in `scripts/check-references.sh` |

## Full-Detail Entries

LESSON LEARNED (2026-10-17): Dangling references and implicit all-tools agents
Description: Skills cited files/skills that do not exist (references/orchestration-patterns.md, source-driven-development, performance-optimization, browser-testing-with-devtools); six read-only agents had no tools field.
Root cause:  No automated check; content was adapted from other sources without verifying each pointer resolves, and 'read-only' was stated in prose rather than enforced.
Fix:         Run scripts/check-references.sh before merging any agent/skill change; every agent declares a tools allowlist.
Add to:      scripts/check-references.sh, .github/skills/create-agent-or-skill/SKILL.md
Priority:    HIGH
---

LESSON LEARNED (2026-10-17): Platform-specific syntax in a shared source file
Description: create-agent-or-skill showed only Copilot `tools: ["read", "search"]`; its generated .claude copy therefore taught Claude Code agents syntax they do not understand. Only found by rereading the generated output.
Root cause:  Generator rewrote paths and names but cannot know that example code blocks are platform-specific; first fix was a generator special case instead of correcting the source.
Fix:         Fix the source so it is correct for both platforms; do not patch around it in the generator. Check 6 in scripts/check-references.sh flags Copilot syntax in generated agents.
Add to:      scripts/check-references.sh, .github/skills/create-agent-or-skill/SKILL.md
Priority:    MEDIUM
---
