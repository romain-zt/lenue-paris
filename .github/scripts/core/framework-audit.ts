#!/usr/bin/env tsx
/**
 * framework-audit.ts
 *
 * Runs the FR-NN framework readiness checks against framework.manifest.json
 * and reports gaps. Optionally opens GitHub issues for detected gaps and
 * fires the framework-improver cloud agent for core-broken gaps.
 *
 * Usage:
 *   npx --prefix .github/scripts/core tsx .github/scripts/core/framework-audit.ts
 *   OPEN_IMPROVER_PR=true npx --prefix .github/scripts/core tsx .github/scripts/core/framework-audit.ts
 *   DRY_RUN=true  npx --prefix .github/scripts/core tsx .github/scripts/core/framework-audit.ts
 *
 * Exit 0 = READY (no core-broken gaps). Exit 1 = GAP (core-broken or tier-violation).
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { Agent } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { TIER_MODELS } from "./cursor-models.config";
import { openGapsByPriority, type FrameworkGapEvent } from "./framework-gap";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = (() => {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, ".cursor")) || existsSync(resolve(dir, ".git"))) return dir;
    dir = resolve(dir, "..");
  }
  return resolve(__dirname, "../../..");
})();

const DRY_RUN = process.env.DRY_RUN === "true";
const OPEN_IMPROVER_PR = process.env.OPEN_IMPROVER_PR === "true" && !DRY_RUN;
const IMPROVER_PR_CAP = parseInt(process.env.IMPROVER_PR_CAP ?? "3", 10);
const TIER_THRESHOLD = parseFloat(process.env.TIER_COMPLIANCE_THRESHOLD ?? "0.60");
const ORCHESTRATOR_ENABLED = process.env.ORCHESTRATOR_ENABLED !== "false";
const CURSOR_API_KEY = process.env.CURSOR_API_KEY;
const REPO_SLUG = process.env.GITHUB_REPOSITORY ?? process.env.REPO ?? "";

// --- Load manifest ---

const MANIFEST_PATH = resolve(ROOT, ".cursor/core/framework.manifest.json");
if (!existsSync(MANIFEST_PATH)) {
  console.error("❌ framework.manifest.json not found at", MANIFEST_PATH);
  process.exit(1);
}

interface ManifestEntry {
  id: string;
  kind: string;
  path: string;
  purpose: string;
  stage?: string[];
  tier: string;
  expectedTier?: string;
  owners?: string[];
  dependsOn?: string[];
  since: string;
  status: "active" | "deprecated";
  notes?: string;
}

interface Manifest {
  version: number;
  entries: ManifestEntry[];
}

const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const entryById = new Map<string, ManifestEntry>(
  manifest.entries.map((e) => [e.id, e])
);

// --- Gap collector ---

type GapSeverity = "core-broken" | "project-missing" | "tier-violation" | "optional";

interface Gap {
  check: string;
  severity: GapSeverity;
  detail: string;
  entry?: ManifestEntry;
}

const gaps: Gap[] = [];

function addGap(check: string, severity: GapSeverity, detail: string, entry?: ManifestEntry) {
  gaps.push({ check, severity, detail, entry });
}

// --- FR-01..FR-N: Presence checks ---

for (const entry of manifest.entries.filter((e) => e.status === "active")) {
  const fullPath = resolve(ROOT, entry.path);
  if (!existsSync(fullPath)) {
    addGap(`FR-01(${entry.id})`, "core-broken", `Missing: ${entry.path}`, entry);
  }
}

// --- FR-N+1..FR-2N: Orphan detection ---

function walkDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...walkDir(full));
    else results.push(relative(ROOT, full));
  }
  return results;
}

const coreFiles = [
  ...walkDir(resolve(ROOT, ".cursor/core/rules")),
  ...walkDir(resolve(ROOT, ".cursor/core/skills")),
  ...walkDir(resolve(ROOT, ".cursor/core/commands")),
  ...walkDir(resolve(ROOT, ".cursor/core/agents")),
  ...walkDir(resolve(ROOT, ".cursor/core/checkers")),
  ...walkDir(resolve(ROOT, ".cursor/core/hooks")),
].filter((f) => f.endsWith(".md") || f.endsWith(".mdc") || f.endsWith(".sh"));

const scriptFiles = walkDir(resolve(ROOT, ".github/scripts/core")).filter((f) =>
  f.endsWith(".ts")
);

const workflowFiles = walkDir(resolve(ROOT, ".github/workflows")).filter((f) =>
  f.endsWith(".yml")
);

const declaredPaths = new Set(manifest.entries.map((e) => e.path));

for (const f of [...coreFiles, ...scriptFiles, ...workflowFiles]) {
  if (!declaredPaths.has(f) && !f.includes("README") && !f.includes(".gitkeep")) {
    addGap(`FR-orphan(${f})`, "optional", `No manifest entry for ${f}`);
  }
}

// --- FR-2N+2: dependsOn resolution ---

for (const entry of manifest.entries.filter((e) => e.status === "active")) {
  for (const depId of entry.dependsOn ?? []) {
    const dep = entryById.get(depId);
    if (!dep || dep.status !== "active") {
      addGap(
        `FR-dep(${entry.id})`,
        "core-broken",
        `${entry.id} depends on '${depId}' which is ${dep ? "deprecated" : "not in manifest"}`
      );
    }
  }
}

// --- FR-2N+5: Append-only invariant (compare with main) ---

try {
  const mainManifestRaw = execSync("git show main:.cursor/core/framework.manifest.json 2>/dev/null || true", {
    cwd: ROOT,
    encoding: "utf-8",
  }).trim();
  if (mainManifestRaw) {
    const mainManifest: Manifest = JSON.parse(mainManifestRaw);
    const currentIds = new Set(manifest.entries.map((e) => e.id));
    for (const mainEntry of mainManifest.entries) {
      if (!currentIds.has(mainEntry.id)) {
        // Check for FD doc
        const fdFiles = walkDir(resolve(ROOT, "docs/framework-decisions")).filter((f) =>
          f.endsWith(".md")
        );
        const hasFD = fdFiles.some((f) =>
          readFileSync(resolve(ROOT, f), "utf-8").includes(mainEntry.id)
        );
        if (!hasFD) {
          addGap(
            "FR-2N+5",
            "core-broken",
            `Manifest entry '${mainEntry.id}' was on main but is missing — needs FD-NNN doc`
          );
        }
      }
    }
  }
} catch {
  // skip if git not available or main doesn't have the manifest yet
}

// --- FR-2N+6: Tier compliance ---

const TURNS_PATH = resolve(ROOT, ".cursor/observability/turns.jsonl");
if (existsSync(TURNS_PATH)) {
  const raw = readFileSync(TURNS_PATH, "utf-8").trim().split("\n").filter(Boolean);
  const CODE_EXT = new Set(["ts", "tsx", "js", "jsx", "py", "go", "rb", "rs", "java", "kt"]);
  const typingHeavy = raw.filter((line) => {
    try {
      const t = JSON.parse(line);
      const ext = (t.path ?? "").split(".").pop()?.toLowerCase() ?? "";
      return ["StrReplace", "Write", "EditNotebook"].includes(t.tool) && CODE_EXT.has(ext);
    } catch { return false; }
  });
  const violations = typingHeavy.filter((line) => {
    try { return !JSON.parse(line).executor_delegation; } catch { return false; }
  });
  if (typingHeavy.length >= 20) {
    const share = (typingHeavy.length - violations.length) / typingHeavy.length;
    if (share < TIER_THRESHOLD) {
      addGap(
        "FR-2N+6",
        "tier-violation",
        `Executor share ${(share * 100).toFixed(1)}% < ${(TIER_THRESHOLD * 100).toFixed(0)}% threshold (${violations.length}/${typingHeavy.length} violations)`
      );
    }
  }
}

// --- Report ---

const coreBroken = gaps.filter((g) => g.severity === "core-broken");
const tierViolations = gaps.filter((g) => g.severity === "tier-violation");
const optional = gaps.filter((g) => g.severity === "optional");

console.log(`\nFramework Readiness Audit${DRY_RUN ? " (DRY RUN)" : ""}`);
console.log(`==========================`);
console.log(`Manifest entries: ${manifest.entries.length}`);
console.log(`Core files scanned: ${coreFiles.length}`);
console.log(`Script files scanned: ${scriptFiles.length}`);
console.log(`Workflow files scanned: ${workflowFiles.length}`);
console.log(`\nGaps found: ${gaps.length} (${coreBroken.length} core-broken, ${tierViolations.length} tier-violation, ${optional.length} optional)`);

if (gaps.length > 0) {
  console.log(`\n| Check                | Severity       | Detail`);
  console.log(`|----------------------|----------------|-------`);
  for (const g of gaps) {
    console.log(`| ${g.check.padEnd(20)} | ${g.severity.padEnd(14)} | ${g.detail}`);
  }
}

const verdict = coreBroken.length === 0 && tierViolations.length === 0 ? "READY" : "GAP";
console.log(`\nFramework verdict: ${verdict}`);

// --- Open issues for core-broken gaps (CI mode) ---

if (!DRY_RUN && (coreBroken.length > 0 || recordedGaps.length > 0) && process.env.GITHUB_TOKEN) {
  console.log(`\nOpening/updating GitHub issue for framework gaps...`);
  const body = [
    "## Framework audit detected gaps",
    "",
    ...(coreBroken.length > 0
      ? [
          "### Core-broken (declared in manifest, missing/broken on disk)",
          "",
          "| Gap | Detail |",
          "|-----|--------|",
          ...coreBroken.map((g) => `| ${g.check} | ${g.detail} |`),
          "",
        ]
      : []),
    ...(recordedGaps.length > 0
      ? [
          "### Recorded setup gaps (discovered while working — auto-update queue)",
          "",
          "| Priority | Kind | Summary |",
          "|----------|------|---------|",
          ...recordedGaps.map((g) => `| P${g.priority} | ${g.kind} | ${g.summary} |`),
          "",
        ]
      : []),
    `Detected at: ${new Date().toISOString()}`,
    "The improver fires automatically on the nightly schedule (or run `/framework-audit propose`).",
  ].join("\n");

  try {
    execSync(
      `gh issue list --label "framework-audit" --state open --json number --jq '.[0].number' > /tmp/fa-issue-number.txt 2>/dev/null || true`,
      { cwd: ROOT }
    );
    const existing = readFileSync("/tmp/fa-issue-number.txt", "utf-8").trim();
    if (existing && !isNaN(parseInt(existing))) {
      execSync(`gh issue comment ${existing} --body ${JSON.stringify(body)}`, { cwd: ROOT });
      console.log(`Updated issue #${existing}`);
    } else {
      execSync(
        `gh issue create --title "[framework-audit] gaps detected" --label "framework-audit" --body ${JSON.stringify(body)}`,
        { cwd: ROOT }
      );
    }
  } catch (err) {
    console.warn("Could not open GitHub issue:", err);
  }
}

// --- Recorded setup gaps (the "auto-update the setup as needed" queue) ---

const recordedGaps = openGapsByPriority();
if (recordedGaps.length > 0) {
  console.log(`\nRecorded setup gaps (docs/state/framework-gaps.ndjson): ${recordedGaps.length} open`);
  for (const g of recordedGaps) {
    console.log(`  P${g.priority} ${g.id} (${g.kind}${g.suggestedPath ? ` → ${g.suggestedPath}` : ""}) — ${g.summary}`);
  }
}

// --- Fire framework-improver (real) for core-broken gaps AND recorded gaps ---

interface ImproverBrief {
  label: string;
  branchId: string;
  brief: string;
}

function coreBrokenBriefs(): ImproverBrief[] {
  return coreBroken
    .filter((g) => g.entry)
    .map((g) => ({
      label: g.entry!.id,
      branchId: g.entry!.id.replace(/[^a-z0-9-]/gi, "-"),
      brief: JSON.stringify({ gap: g.entry, note: g.detail }, null, 2),
    }));
}

function recordedGapBriefs(): ImproverBrief[] {
  return recordedGaps.map((g: FrameworkGapEvent) => ({
    label: g.id,
    branchId: g.id,
    brief: JSON.stringify(
      { gap: { id: g.id, kind: g.kind, suggestedPath: g.suggestedPath, purpose: g.summary, priority: g.priority } },
      null,
      2,
    ),
  }));
}

function improverPrExists(branchId: string): boolean {
  try {
    const raw = execSync(
      `gh pr list --state open --head framework/improver/${branchId} --json number --jq 'length'`,
      { cwd: ROOT, encoding: "utf-8" },
    ).trim();
    return parseInt(raw || "0", 10) > 0;
  } catch {
    return false;
  }
}

async function fireImprover(item: ImproverBrief): Promise<void> {
  const prompt = [
    "You are the framework-improver (Vision tier). Follow `.cursor/core/agents/framework/framework-improver.md` exactly.",
    "",
    "Gap brief:",
    "```json",
    item.brief,
    "```",
    "",
    "Draft the single missing artifact at the declared/suggested path, append ONE entry to",
    "`.cursor/core/framework.manifest.json`, and open a DRAFT PR on branch",
    `\`framework/improver/${item.branchId}\`. NEVER edit existing artifacts, never delete/rename a`,
    "manifest entry, never merge. Post the self-review checklist as a PR comment.",
    "If the gap is already covered by an existing artifact, open no PR and say so.",
  ].join("\n");

  console.log(`\n🤖 Firing framework-improver for "${item.label}" (branch framework/improver/${item.branchId})…`);
  const result = await Agent.prompt(prompt, buildCursorCloudOptions(CURSOR_API_KEY!, REPO_SLUG, TIER_MODELS.vision));
  if (result.status === "error") {
    console.error(`  ❌ Improver run for "${item.label}" failed (check the Cursor dashboard).`);
  } else {
    console.log(`  ✅ Improver run for "${item.label}" dispatched.`);
  }
}

if (OPEN_IMPROVER_PR && ORCHESTRATOR_ENABLED && CURSOR_API_KEY && REPO_SLUG) {
  const allBriefs = [...coreBrokenBriefs(), ...recordedGapBriefs()]
    .filter((b) => !improverPrExists(b.branchId))
    .slice(0, IMPROVER_PR_CAP);

  if (allBriefs.length === 0) {
    console.log("\nℹ️  No actionable improver gaps (none, or all already have an open improver PR).");
  } else {
    console.log(`\nFiring framework-improver for ${allBriefs.length} gap(s) (cap: ${IMPROVER_PR_CAP})…`);
    for (const item of allBriefs) {
      try {
        await fireImprover(item);
      } catch (err) {
        console.error(`  ⚠️  Could not fire improver for "${item.label}" (non-fatal):`, err);
      }
    }
  }
} else if (OPEN_IMPROVER_PR) {
  console.log("\n⏸️  Improver firing requested but skipped (ORCHESTRATOR_ENABLED=false or missing CURSOR_API_KEY/REPO).");
} else if (coreBroken.length > 0 || recordedGaps.length > 0) {
  console.log("\nℹ️  Gaps detected. Re-run with OPEN_IMPROVER_PR=true (or via the nightly schedule) to fire the improver.");
}

// Recorded setup gaps are discovered needs, not broken core — they do not fail the check.
process.exit(coreBroken.length > 0 || tierViolations.length > 0 ? 1 : 0);
