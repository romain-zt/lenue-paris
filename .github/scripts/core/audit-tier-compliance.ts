#!/usr/bin/env tsx
/**
 * audit-tier-compliance.ts
 *
 * Reads .cursor/observability/turns.jsonl and reports:
 *   - Executor-share of typing-heavy turns (target: ≥ 60%)
 *   - Top violations (code edits made in Manager/Vision context)
 *   - Per-day trend
 *
 * Exit 0 = compliant. Exit 1 = below threshold or no data.
 *
 * Usage:
 *   npx --prefix .github/scripts/core tsx .github/scripts/core/audit-tier-compliance.ts
 *   THRESHOLD=0.7 npx --prefix .github/scripts/core tsx .github/scripts/core/audit-tier-compliance.ts
 *   DAYS=14      npx --prefix .github/scripts/core tsx .github/scripts/core/audit-tier-compliance.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findRepoRoot(start: string): string {
  const { existsSync: exists } = await import("fs").catch(() => ({ existsSync }));
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, ".cursor")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  return resolve(start, "../../..");
}

const ROOT = (() => {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, ".cursor")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  return resolve(__dirname, "../../..");
})();

const THRESHOLD = parseFloat(process.env.THRESHOLD ?? "0.60");
const DAYS = parseInt(process.env.DAYS ?? "7", 10);
const LOG_PATH = resolve(ROOT, ".cursor/observability/turns.jsonl");

interface Turn {
  ts: string;
  tool: string;
  path: string;
  executor_delegation: boolean;
}

// Code file extensions — these turns are "typing-heavy"
const CODE_EXT = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "go", "rb", "rs", "java", "kt", "swift",
  "cs", "cpp", "c", "h", "php", "vue", "svelte",
]);

function isCodePath(p: string): boolean {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  return CODE_EXT.has(ext);
}

function isTypingHeavyTool(tool: string): boolean {
  return ["StrReplace", "Write", "EditNotebook"].includes(tool);
}

// --- Load turns ---

if (!existsSync(LOG_PATH)) {
  console.log(`\nTier Compliance Audit`);
  console.log(`=====================`);
  console.log(`⚠️  No telemetry log found at ${LOG_PATH}`);
  console.log(`   The after-tool-call hook may not be active yet.`);
  console.log(`   Install hooks.json and ensure Cursor IDE is open.`);
  process.exit(1);
}

const raw = readFileSync(LOG_PATH, "utf-8").trim().split("\n").filter(Boolean);
const turns: Turn[] = [];
for (const line of raw) {
  try {
    turns.push(JSON.parse(line) as Turn);
  } catch {
    // skip malformed lines
  }
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - DAYS);

const recent = turns.filter((t) => new Date(t.ts) >= cutoff);

// Typing-heavy turns = StrReplace/Write/EditNotebook on code files
const typingHeavy = recent.filter(
  (t) => isTypingHeavyTool(t.tool) && isCodePath(t.path)
);

// Executor delegations
const delegations = recent.filter((t) => t.tool === "Task" && t.executor_delegation);

// Violations = typing-heavy turns NOT preceded by a delegation in the same batch
// Simplified: we count typing-heavy turns where executor_delegation = false
const violations = typingHeavy.filter((t) => !t.executor_delegation);

const totalTyping = typingHeavy.length;
const totalViolations = violations.length;
const executorShare =
  totalTyping === 0 ? null : (totalTyping - totalViolations) / totalTyping;

// --- Report ---

console.log(`\nTier Compliance Audit`);
console.log(`=====================`);
console.log(`Period: last ${DAYS} days (${cutoff.toISOString().slice(0, 10)} → today)`);
console.log(`Total tool calls logged: ${recent.length}`);
console.log(`Typing-heavy code turns: ${totalTyping}`);
console.log(`Executor delegations: ${delegations.length}`);
console.log(`Violations (inline code edits): ${totalViolations}`);

if (executorShare === null) {
  console.log(`\n⚠️  No typing-heavy turns in the last ${DAYS} days. Nothing to audit.`);
  process.exit(0);
}

const pct = (executorShare * 100).toFixed(1);
const threshold_pct = (THRESHOLD * 100).toFixed(0);

console.log(`\nExecutor share: ${pct}% (threshold: ≥${threshold_pct}%)`);

if (executorShare >= THRESHOLD) {
  console.log(`✅  Compliant. Executor is handling the bulk of typing-heavy turns.`);
} else {
  console.log(`❌  Below threshold. ${totalViolations} violations in the period.`);
  console.log(`\nTop violations (most recent first):`);
  const topViolations = violations
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 10);
  for (const v of topViolations) {
    console.log(`  ${v.ts.slice(0, 16)} ${v.tool.padEnd(12)} ${v.path}`);
  }
  console.log(`\nNext action: ensure Manager/Vision agents fire Task(subagent_type: "executor") for code edits.`);
  console.log(`See: .cursor/core/skills/tier-enforcement/SKILL.md`);
  process.exit(1);
}
