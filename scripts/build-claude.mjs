#!/usr/bin/env node
// Builds the Claude Code layout (.claude/ + CLAUDE.md) from the Copilot layout in .github/.
// .github/ is the single source of truth; never edit the generated files by hand.
//
//   node scripts/build-claude.mjs           regenerate .claude/ and CLAUDE.md
//   node scripts/build-claude.mjs --check   exit 1 if the generated files are out of date
//
// Mapping:
//   .github/agents/<n>.agent.md        -> .claude/agents/<n>.md        (tools renamed to Claude Code names)
//   .github/skills/**                  -> .claude/skills/**            (same SKILL.md format, paths rewritten)
//   .github/instructions/<n>.instructions.md -> .claude/rules/<n>.md  (applyTo -> paths)
//   .github/copilot-instructions.md    -> CLAUDE.md

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

// Copilot tool alias (lowercased) -> Claude Code tool names.
const TOOL_MAP = {
  execute: ["Bash"], shell: ["Bash"], bash: ["Bash"], powershell: ["PowerShell"],
  read: ["Read"], notebookread: ["Read"],
  edit: ["Edit", "Write"], multiedit: ["Edit"], write: ["Write"], notebookedit: ["NotebookEdit"],
  search: ["Grep", "Glob"], grep: ["Grep"], glob: ["Glob"],
  agent: ["Agent"], "custom-agent": ["Agent"], task: ["Agent"],
  web: ["WebFetch", "WebSearch"], websearch: ["WebSearch"], webfetch: ["WebFetch"],
  todo: ["TodoWrite"], todowrite: ["TodoWrite"],
};

// Built-in Claude Code tool names we may emit, from https://code.claude.com/docs/en/tools-reference
// (checked 2026-10-17). If Claude Code renames a tool, update this list and TOOL_MAP together.
const CLAUDE_TOOLS = new Set([
  "Agent", "Bash", "Edit", "Glob", "Grep", "NotebookEdit", "PowerShell", "Read", "TodoWrite", "WebFetch", "WebSearch", "Write",
]);
for (const [alias, names] of Object.entries(TOOL_MAP)) {
  for (const n of names) if (!CLAUDE_TOOLS.has(n)) throw new Error(`TOOL_MAP '${alias}' emits '${n}', not a known Claude Code tool`);
}

const out = new Map(); // relative output path -> content

const read = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");
const banner = (src) => `<!-- GENERATED from ${src} by scripts/build-claude.mjs. Edit the source, not this file. -->\n`;

// Rewrite references between generated files.
function rewritePaths(text) {
  return text
    .replaceAll(".github/copilot-instructions.md", "CLAUDE.md")
    .replaceAll(/\bcopilot-instructions(\.md)?\b/g, "CLAUDE.md")
    .replaceAll(/\bCopilot (agents?|skills?)\b/g, "$1")
    .replaceAll("Copilot context", "agent context")
    .replaceAll(/\.github\/skills\b/g, ".claude/skills") // also bare dir refs in shell snippets
    .replaceAll(/\.github\/agents\b/g, ".claude/agents")
    .replaceAll(/\.github\/instructions\b/g, ".claude/rules")
    .replaceAll(".agent.md", ".md") // also bare suffixes in globs and shell/Python snippets
    .replaceAll(".instructions.md", ".md")
    .replaceAll('`applyTo: "<glob>"`', "`paths:` (a list of globs)") // Claude Code rules scope with paths:, not applyTo
    .replaceAll("`applyTo`-scoped", "`paths`-scoped");
}

// The files that create or bootstrap other agents/skills. In this repo .claude/ is generated, so anything
// they create there would be deleted by the next build; tell them to edit the .github/ source instead.
const META_SOURCES = new Set([
  ".github/agents/agent-builder.agent.md",
  ".github/skills/create-agent-or-skill/SKILL.md",
  ".github/skills/setup-agent-system/SKILL.md",
]);
const META_NOTE =
  "> **Layout note:** if `scripts/build-claude.mjs` exists in this repo, `.claude/` is generated from `.github/`. " +
  "Create or edit agents, skills and rules under `.github/` (the source), then run `node scripts/build-claude.mjs`; " +
  "files created directly in `.claude/` here are deleted by the next build. In a project without that script, " +
  "create them in `.claude/` directly.\n\n";
const withMetaNote = (src, text) => (META_SOURCES.has(src) ? text.replace(/^(---\n[\s\S]*?\n---\n)/, `$1\n${META_NOTE}`) : text);

// Minimal frontmatter parser: scalars, inline arrays, and folded/literal blocks.
function splitFrontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const fields = {};
  const lines = m[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    if (/^[>|][+-]?$/.test(val)) {
      const parts = [];
      while (i + 1 < lines.length && /^\s+\S|^\s*$/.test(lines[i + 1])) parts.push(lines[++i].trim());
      val = parts.filter(Boolean).join(" ");
    }
    fields[key] = val.replace(/^(["'])(.*)\1$/, "$2");
  }
  return { fields, body: m[2] };
}

const parseList = (v) => v.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);

// ---- agents
for (const f of readdirSync(join(root, ".github/agents")).filter((n) => n.endsWith(".agent.md"))) {
  const src = `.github/agents/${f}`;
  const { fields, body } = splitFrontmatter(read(src), src);
  const name = f.replace(/\.agent\.md$/, "");
  if (!fields.description) throw new Error(`${src}: no description`);
  const tools = [];
  for (const t of parseList(fields.tools || "")) {
    const mapped = TOOL_MAP[t.toLowerCase()];
    if (!mapped) throw new Error(`${src}: tool '${t}' has no Claude Code mapping`);
    for (const m of mapped) if (!tools.includes(m)) tools.push(m);
  }
  const fm = [`name: ${name}`, `description: ${JSON.stringify(rewritePaths(fields.description))}`];
  if (tools.length) fm.push(`tools: ${tools.join(", ")}`);
  if (fields.model) fm.push(`model: ${fields.model}`);
  out.set(`.claude/agents/${name}.md`, withMetaNote(src, `---\n${fm.join("\n")}\n---\n`) + `${banner(src)}${rewritePaths(body)}`);
}

// ---- skills (copy every file; markdown gets path rewriting)
function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
  });
}
for (const src of walk(".github/skills")) {
  const dest = src.replace(".github/skills/", ".claude/skills/");
  out.set(dest, src.endsWith(".md") ? withMetaNote(src, rewritePaths(read(src))) : readFileSync(join(root, src), "utf8"));
}

// ---- instructions -> rules
for (const f of readdirSync(join(root, ".github/instructions")).filter((n) => n.endsWith(".instructions.md"))) {
  const src = `.github/instructions/${f}`;
  const { fields, body } = splitFrontmatter(read(src), src);
  const globs = (fields.applyTo || "").split(",").map((s) => s.trim()).filter(Boolean);
  const fm = globs.length ? `---\npaths:\n${globs.map((g) => `  - ${JSON.stringify(g)}`).join("\n")}\n---\n` : "";
  out.set(`.claude/rules/${f.replace(".instructions.md", ".md")}`, `${fm}${banner(src)}${rewritePaths(body)}`);
}

// ---- CLAUDE.md
// Copilot-specific wording in the source index; each replacement must match so drift is noticed.
const WORDING = [
  [/^# Copilot Instructions — /, "# "],
  ["a\nset of Copilot agents, skills,", "a\nset of agents, skills,"],
  ["Copilot agent definitions (*.agent.md)", "agent definitions (*.md)"],
  ["applied automatically by Copilot", "applied automatically"],
  ["`.github/instructions/*.instructions.md`", "`.claude/rules/*.md`"],
];
let ci = read(".github/copilot-instructions.md");
for (const [from, to] of WORDING) {
  const next = ci.replace(from, to);
  if (next === ci) throw new Error(`CLAUDE.md wording rule no longer matches: ${from}`);
  ci = next;
}
out.set("CLAUDE.md", `${banner(".github/copilot-instructions.md")}${rewritePaths(ci)}`);

// ---- write or check
const generatedDirs = [".claude/agents", ".claude/skills", ".claude/rules"];
const existing = generatedDirs.flatMap((d) => (existsSync(join(root, d)) ? walk(d) : []));
let stale = 0;
for (const [p, content] of out) {
  const abs = join(root, p);
  const current = existsSync(abs) ? readFileSync(abs, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === content) continue;
  stale++;
  if (check) console.log(`out of date: ${p}`);
  else { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); }
}
for (const p of existing.filter((p) => !out.has(p))) {
  stale++;
  if (check) console.log(`orphaned: ${p}`);
  else rmSync(join(root, p));
}
if (check) { console.log(stale ? `${stale} file(s) out of date; run: node scripts/build-claude.mjs` : "claude layout up to date"); process.exit(stale ? 1 : 0); }
console.log(`generated ${out.size} files (${stale} changed)`);
