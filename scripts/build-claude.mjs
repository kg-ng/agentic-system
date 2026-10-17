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
//   .github/agents/lessons.md          stays where it is (shared log, not an agent)

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

const out = new Map(); // relative output path -> content

const read = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");
const banner = (src) => `<!-- GENERATED from ${src} by scripts/build-claude.mjs. Edit the source, not this file. -->\n`;

// Rewrite references between generated files. lessons.md is intentionally left in .github.
function rewritePaths(text) {
  const keep = "\u0000LESSONS\u0000";
  return text
    .replaceAll(".github/agents/lessons.md", keep)
    .replaceAll(".github/copilot-instructions.md", "CLAUDE.md")
    .replaceAll(/\.github\/skills\b/g, ".claude/skills") // also bare dir refs in shell snippets
    .replaceAll(/\.github\/agents\b/g, ".claude/agents")
    .replaceAll(/\.github\/instructions\b/g, ".claude/rules")
    .replaceAll(/(\*|\b[a-z0-9-]+)\.agent\.md\b/g, "$1.md")
    .replaceAll(/(\*|\b[a-z0-9-]+)\.instructions\.md\b/g, "$1.md")
    .replaceAll(keep, ".github/agents/lessons.md");
}

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
  const fm = [`name: ${name}`, `description: ${JSON.stringify(fields.description)}`];
  if (tools.length) fm.push(`tools: ${tools.join(", ")}`);
  if (fields.model) fm.push(`model: ${fields.model}`);
  out.set(`.claude/agents/${name}.md`, `---\n${fm.join("\n")}\n---\n${banner(src)}${rewritePaths(body)}`);
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
  out.set(dest, src.endsWith(".md") ? rewritePaths(read(src)) : readFileSync(join(root, src), "utf8"));
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
