#!/usr/bin/env bash
# Fails if any agent/skill/instruction references a file or skill that does not exist.
# Run from the repo root: bash scripts/check-references.sh
set -u
cd "$(dirname "$0")/.."

fail=0

# 1. references/<file>.md pointers must resolve under .github/skills/references/
while read -r p; do
  [ -e ".github/skills/$p" ] || { echo "MISSING file: $p"; fail=1; }
done < <(grep -rhoE "references/[A-Za-z0-9_-]+\.md" .github | sort -u)

# 2. skills/<name>/SKILL.md pointers must resolve
while read -r p; do
  [ -e ".github/$p" ] || { echo "MISSING skill file: $p"; fail=1; }
done < <(grep -rhoE "skills/[a-z0-9-]+/SKILL\.md" .github | sort -u)

# 3. "`name` skill" mentions must name an existing skill directory
while read -r n; do
  [ -d ".github/skills/$n" ] || { echo "MISSING skill: $n"; fail=1; }
done < <(grep -rhoE '`[a-z0-9]+(-[a-z0-9]+)+` skill' .github | grep -oE '[a-z0-9]+(-[a-z0-9]+)+' | sort -u)

# 4. every agent file must declare a tools allowlist (no implicit "all tools")
for f in .github/agents/*.agent.md; do
  grep -q '^tools:' "$f" || { echo "NO tools allowlist: $f"; fail=1; }
done

# 5. tool names must be documented aliases (unrecognized names are silently ignored)
allowed=" execute shell bash powershell read notebookread edit multiedit write notebookedit search grep glob agent custom-agent task web websearch webfetch todo todowrite "
for f in .github/agents/*.agent.md; do
  line=$(grep -m1 '^tools:' "$f" | tr -d '\r') || continue
  for t in $(echo "$line" | sed 's/^tools://' | tr -d "[]\"'" | tr ',' ' '); do
    case "$t" in */*|\*) continue ;; esac
    case "$allowed" in *" $(echo "$t" | tr 'A-Z' 'a-z') "*) ;; *) echo "UNDOCUMENTED tool '$t': $f"; fail=1 ;; esac
  done
done

# 6. generated Claude Code agents must use Claude Code tool syntax (comma list of names), not Copilot's ["alias"] list
for f in .claude/agents/*.md; do
  [ -e "$f" ] || continue
  grep -m1 '^tools:' "$f" | tr -d '\r' | grep -q '[]["]' && { echo "Copilot tool syntax in Claude agent: $f"; fail=1; }
done

[ "$fail" -eq 0 ] && echo "references OK"
exit "$fail"
