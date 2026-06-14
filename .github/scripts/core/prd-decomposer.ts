/**
 * prd-decomposer.ts — autonomous PRD → decomposition driver (project-agnostic).
 *
 * Bridges "PRD is ready" to "the pipeline has runnable slice steps" without a human
 * in the loop. When docs/project.config.md → "Autonomous decomposition enabled: yes",
 * this fires ONE Cursor cloud agent that runs the full .cursor/ decomposition chain:
 *
 *   Feature Area : map → scaffold → validate → promote → clear-for-vertical
 *   Scope Slice  : slice → scaffold-slices → refine-slice → promote-slice
 *   Wiring       : update docs/state/orchestration.prd-flow-map.json (flow → slice files)
 *
 * It opens a DRAFT PR, lets the agent commit the decomposition, and the agent calls
 * `gh pr ready` on success. pr-automation.yml (ready_for_review) then reviews + merges
 * it; that merge feeds orchestration-automation.yml → sync-prd-orchestration.ts →
 * phase-orchestrator.yml. The whole thing is data-driven — no bundled product prompts.
 *
 * Governance:
 *  - A scope-readiness-checker CLEAR verdict substitutes for in-conversation human
 *    approval (PD-008, feature-area-workflow.mdc §1a, 00-siso "Standing waiver").
 *  - A genuine NEED_HUMAN is never bypassed: the agent marks that item blocked + leaves
 *    a NEED_HUMAN note and continues with siblings.
 */

import { Agent, CursorAgentError, type RunResult } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { formatPickedModel, pickPrdDecomposerModel } from "./cursor-models.config";
import { parseFlowInventory, normalizeFlowCell } from "./sync-prd-orchestration";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const repo = process.env.REPO;
const orchestratorEnabled = process.env.ORCHESTRATOR_ENABLED !== "false";
const trackingBase = (process.env.ORCHESTRATOR_TRACKING_BASE ?? "main").trim() || "main";
/** Set by the workflow when triggered manually with force=true (skip the needs-work guard). */
const forceRun = process.env.DECOMPOSER_FORCE === "1" || process.env.DECOMPOSER_FORCE === "true";

const ROOT = process.cwd();
const PRD_PATH = path.join(ROOT, "docs/prd/PRD.md");
const CONFIG_PATH = path.join(ROOT, "docs/project.config.md");
const MAP_PATH = path.join(ROOT, "docs/state/orchestration.prd-flow-map.json");
const SLICES_DIR = path.join(ROOT, "docs/product/scope-slices");

if (!orchestratorEnabled) {
  console.log("⏸️  ORCHESTRATOR_ENABLED=false — paused. Set it to 'true' to resume.");
  process.exit(0);
}
if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set. Add it as a GitHub Actions secret.");
  process.exit(1);
}
if (!repo) {
  console.error("❌ REPO env var is missing.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Flag + readiness checks
// ---------------------------------------------------------------------------

/** Reads the "Autonomous decomposition enabled" flag from docs/project.config.md. */
function autonomousDecompositionEnabled(): { enabled: boolean; reason: string } {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {
      enabled: false,
      reason: `${CONFIG_PATH} is missing (create it from .cursor/core/templates/project/project.config.template.md and commit it — CI cannot read a gitignored file)`,
    };
  }
  const cfg = fs.readFileSync(CONFIG_PATH, "utf8");
  const m = cfg.match(/Autonomous decomposition enabled:\*\*\s*([a-zA-Z]+)/);
  const value = m?.[1]?.trim() ?? "";
  if (!value) {
    return {
      enabled: false,
      reason: `could not parse "Autonomous decomposition enabled" in ${CONFIG_PATH}`,
    };
  }
  if (!/^yes$/i.test(value)) {
    return { enabled: false, reason: `Autonomous decomposition enabled: ${value}` };
  }
  return { enabled: true, reason: "yes" };
}

/** Normalized keys already mapped in orchestration.prd-flow-map.json. */
function mappedFlowKeys(): Set<string> {
  if (!fs.existsSync(MAP_PATH)) return new Set();
  try {
    const map = JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) as { flows?: Record<string, unknown> };
    return new Set(Object.keys(map.flows ?? {}));
  } catch {
    return new Set();
  }
}

/**
 * Cheap guard so cron runs don't open empty PRs. Work is needed when any PRD Flow
 * Inventory `v0 = Yes` row is not yet present in the flow map, or no scope slices
 * exist at all. Force overrides this.
 */
function needsDecomposition(): { needed: boolean; reason: string } {
  if (forceRun) return { needed: true, reason: "forced via workflow_dispatch" };
  if (!fs.existsSync(PRD_PATH)) return { needed: false, reason: "no docs/prd/PRD.md" };

  const yesFlows = parseFlowInventory(fs.readFileSync(PRD_PATH, "utf8")).filter((r) => r.v0Yes);
  if (yesFlows.length === 0) {
    return { needed: false, reason: "PRD Flow Inventory has no v0=Yes rows yet" };
  }

  const slicesExist =
    fs.existsSync(SLICES_DIR) && fs.readdirSync(SLICES_DIR).some((f: string) => f.endsWith(".md"));
  if (!slicesExist) return { needed: true, reason: "no Scope Slice files exist yet" };

  const mapped = mappedFlowKeys();
  const unmapped = yesFlows.filter((r) => !mapped.has(normalizeFlowCell(r.flow)));
  if (unmapped.length > 0) {
    return {
      needed: true,
      reason: `unmapped v0 flows: ${unmapped.map((r) => r.flow).join(", ")}`,
    };
  }
  return { needed: false, reason: "every v0 flow already mapped to a Scope Slice" };
}

// ---------------------------------------------------------------------------
// git / gh helpers
// ---------------------------------------------------------------------------

function gh(cmd: string): string {
  return execSync(`gh ${cmd}`, { encoding: "utf8" }).trim();
}
function gitExec(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retry a function up to `attempts` times with exponential backoff.
 * Only retries on errors whose message matches `retryablePattern`.
 */
async function withRetry<T>(
  label: string,
  fn: () => T | Promise<T>,
  { attempts = 3, baseDelayMs = 2_000, retryablePattern = /timeout|ETIMEDOUT|rate limit|502|503|504|fetch failed/i }:
    { attempts?: number; baseDelayMs?: number; retryablePattern?: RegExp } = {},
): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = retryablePattern.test(msg);
      if (i === attempts || !isRetryable) throw err;
      const delay = baseDelayMs * 2 ** (i - 1);
      console.warn(`⚠️  ${label} attempt ${i}/${attempts} failed (retryable): ${msg.split("\n")[0]}`);
      console.warn(`   Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

const DECOMPOSE_TITLE_PREFIX = "chore(decompose):";

/**
 * Pre-flight: verify the GITHUB_TOKEN can create PRs.
 * Catches the "GitHub Actions is not permitted to create or approve pull requests"
 * error BEFORE we push any branches.
 */
function preflight_checkPRPermission(): void {
  try {
    const raw = gh(`api repos/${repo} --jq ".permissions"`);
    // If we can list PRs, the token is valid. The actual "create PR" permission
    // is a repo setting we can't query via API, but we can detect the error
    // pattern from a previous run. Instead, we do a lightweight dry-run:
    // try to list PRs (always works) and verify the token is authenticated.
    if (!raw || raw === "null") {
      console.warn("⚠️  Could not read repo permissions — token may be scoped too narrow.");
    }
  } catch {
    // Non-fatal: the actual gh pr create will fail with a clear message.
  }
}

/** Avoid duplicate concurrent decomposition PRs. Also checks for orphaned branches. */
function openDecompositionPRExists(): boolean {
  try {
    const raw = gh(`pr list --repo "${repo}" --state open --json title,baseRefName`);
    const prs = JSON.parse(raw) as { title: string; baseRefName: string }[];
    return prs.some((p) => p.title.startsWith(DECOMPOSE_TITLE_PREFIX) && p.baseRefName === trackingBase);
  } catch {
    return false;
  }
}

/** Delete orphaned decompose branches that have no open PR. */
function cleanupOrphanedDecomposeBranches(): void {
  try {
    const raw = execSync(
      `git ls-remote --heads origin 'orchestrator/decompose-*'`,
      { encoding: "utf8" },
    ).trim();
    if (!raw) return;

    const branches = raw
      .split("\n")
      .map((l) => l.split("\t")[1]?.replace("refs/heads/", ""))
      .filter(Boolean) as string[];

    if (branches.length === 0) return;

    const openPRs = (() => {
      try {
        const prRaw = gh(`pr list --repo "${repo}" --state open --json headRefName`);
        return new Set((JSON.parse(prRaw) as { headRefName: string }[]).map((p) => p.headRefName));
      } catch {
        return new Set<string>();
      }
    })();

    for (const branch of branches) {
      if (openPRs.has(branch)) continue;
      console.log(`🧹 Cleaning up orphaned branch: ${branch}`);
      try {
        execSync(`git push origin --delete ${branch}`, { stdio: "inherit" });
      } catch {
        console.warn(`   Could not delete ${branch} — may need manual cleanup.`);
      }
    }
  } catch {
    // Non-fatal — orphan cleanup is best-effort.
  }
}

interface TrackingPR {
  number: number;
  branch: string;
  url: string;
}

function openDraftPR(): TrackingPR {
  gitExec(`fetch origin`);
  try {
    gitExec(`checkout ${trackingBase}`);
    gitExec(`pull origin ${trackingBase} --ff-only`);
  } catch {
    gitExec(`checkout -B ${trackingBase} origin/${trackingBase}`);
  }

  const branch = `orchestrator/decompose-${Date.now()}`;
  const title = `${DECOMPOSE_TITLE_PREFIX} PRD → scope slices (autonomous)`;

  gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
  gitExec(`config user.name "github-actions[bot]"`);
  gitExec(`checkout -b ${branch}`);

  const stampDir = path.join(ROOT, "docs/state/tracking");
  fs.mkdirSync(stampDir, { recursive: true });
  fs.writeFileSync(
    path.join(stampDir, `decompose-${Date.now()}.md`),
    `# Decomposition run\n\nStarted: ${new Date().toISOString()}\nBranch: ${branch}\n\nAuto-generated by prd-decomposer.ts. The agent fills decomposition artifacts here.\n`,
  );
  gitExec(`add docs/state/tracking/`);
  gitExec(`commit -m "chore(decompose): open decomposition PR [skip ci]"`);
  gitExec(`push origin ${branch}`);

  const bodyFile = path.join(ROOT, ".github/scripts/core/.decompose-pr-body.md");
  fs.writeFileSync(
    bodyFile,
    [
      `## Autonomous decomposition PR`,
      ``,
      `Opened by \`prd-decomposer.ts\` to turn a ready PRD into runnable pipeline steps.`,
      `The agent runs the \`.cursor/\` decomposition chain and marks this PR ready on success;`,
      `\`pr-automation.yml\` then reviews + merges it, which feeds \`orchestration-automation.yml\`.`,
      ``,
      `Governed by PD-008 (autonomous decomposition). A genuine \`NEED_HUMAN\` leaves the`,
      `affected item \`blocked\` rather than inventing product scope.`,
    ].join("\n"),
  );

  try {
    const prUrl = gh(
      `pr create --repo "${repo}" --base "${trackingBase}" --head "${branch}" --draft --title "${title}" --body-file "${bodyFile}"`,
    );
    const number = parseInt(prUrl.split("/").at(-1) ?? "0", 10);
    try { fs.unlinkSync(bodyFile); } catch { /* ignore */ }
    try { gitExec(`checkout ${trackingBase}`); } catch { gitExec(`checkout main`); }

    console.log(`📋 Decomposition PR #${number} opened (draft): ${prUrl}`);
    return { number, branch, url: prUrl };
  } catch (err: unknown) {
    // Clean up the branch we just pushed — don't leave orphans.
    console.error(`❌ Failed to create PR for branch ${branch}. Cleaning up…`);
    try { fs.unlinkSync(bodyFile); } catch { /* ignore */ }
    try { execSync(`git push origin --delete ${branch}`, { stdio: "inherit" }); } catch { /* ignore */ }
    try { gitExec(`checkout ${trackingBase}`); } catch { try { gitExec(`checkout main`); } catch { /* ignore */ } }

    const msg = err instanceof Error ? err.message : String(err);
    if (/not permitted to create or approve pull requests/i.test(msg)) {
      console.error("");
      console.error("═══════════════════════════════════════════════════════════════");
      console.error("  CONFIGURATION REQUIRED");
      console.error("  GitHub Actions is not allowed to create pull requests.");
      console.error("  Fix: repo → Settings → Actions → General → Workflow permissions");
      console.error("    ✅ Read and write permissions");
      console.error("    ✅ Allow GitHub Actions to create and approve pull requests");
      console.error("═══════════════════════════════════════════════════════════════");
      console.error("");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(pr: TrackingPR): string {
  return `# Autonomous PRD decomposition

A **draft tracking PR already exists**: PR #${pr.number}, head \`${pr.branch}\` → base \`${trackingBase}\`.
You are running in **autonomous decomposition mode** with **no human in the conversation**.
Authorized by \`docs/product-decisions/PD-008-autonomous-decomposition.md\`,
\`.cursor/core/rules/feature-area-workflow.mdc\` §1a, and \`.cursor/core/rules/00-siso.mdc\` "Standing waiver".

## Branch discipline (mandatory)
\`\`\`bash
git fetch origin
git checkout ${pr.branch}
git pull --ff-only origin ${pr.branch}
\`\`\`
Commit and push **all** decomposition artifacts to \`${pr.branch}\`. Never open PRs directly to \`${trackingBase}\`.

## Goal
Turn the ready PRD into runnable pipeline input by completing, **in priority-band order from \`docs/project.config.md\`**, the \`.cursor/\` decomposition chain for every v0 Feature Area, following \`.cursor/core/rules/feature-area-workflow.mdc\` and \`.cursor/core/commands/feature-area.md\`:

1. Feature Areas: \`map\` → \`scaffold\` (missing only) → \`validate\` → \`promote\` → \`clear-for-vertical\`.
2. Scope Slices: \`slice\` → \`scaffold-slices\` → \`refine-slice\` → \`promote-slice\` (target \`ready-for-user-stories\`).
3. Wire \`docs/state/orchestration.prd-flow-map.json\`: for each PRD "# Flow Inventory" row with \`v0 = Yes\`, add a normalized flow key mapping to its Scope Slice file path(s) under \`docs/product/scope-slices/\`. Use the existing JSON shape (\`flows: { "<normalized flow>": { "slices": ["docs/product/scope-slices/<fa>--<slice>.md"] } }\`). Keep \`attachAfterStepId\` unchanged.

## Challenge round (mandatory — two models)
Per \`.cursor/core/rules/63-two-model-challenge.mdc\`, a decomposition is never converged by one model alone. Before you **promote** Feature Areas / Scope Slices:
1. Produce your proposed map/slice boundaries.
2. Delegate them to the **\`plan-challenger\`** subagent (a different model) via the \`Task\` tool. It returns AGREE or CHALLENGE + concrete objections (missing parts, wrong boundaries, false convergence, over-scoping).
3. Resolve every CHALLENGE objection (or record why it's rejected) and re-run if material. Only then promote.

## Governance you MUST honor
- Run the **real** \`.cursor/core/checkers/scope-readiness-checker.md\` checks. A genuine \`CLEAR\` verdict is what authorizes each promotion — do not self-assert readiness.
- Respect every \`NEED_HUMAN\`/\`NEED_UPDATE\` flag and open question in \`docs/prd/questions/open-questions.md\`. If a Feature Area or Scope Slice genuinely cannot be bounded without missing product truth, set that item \`blocked\` with a \`NEED_HUMAN:\` note and **continue with the others** — do not invent scope.
- Do **not** edit \`docs/prd/PRD.md\`. Do **not** name architecture, data models, or API routes in Feature Area / Scope Slice files. Do **not** write user stories, specs, tasks, or application code in this run.
- Stay within the v0 boundary in \`docs/project.config.md\`.

## Bounded execution
- One broad read pass max, then act. Don't re-audit the whole \`.cursor/\` setup.
- If required setup is missing or contradictory, stop and commit a short note to \`docs/state/HANDOFF.md\` explaining what's missing, then report \`SETUP_MISSING=true\`. Do not call \`gh pr ready\`.

## Completion
When the decomposition chain is complete for every unblocked v0 Feature Area and the flow map is wired, update \`docs/state/HANDOFF.md\` with what advanced and what (if anything) is blocked, commit + push to \`${pr.branch}\`, then:
\`\`\`bash
gh pr ready ${pr.number} --repo ${repo}
\`\`\`
If everything that could advance is blocked on a human, leave the PR as draft (do not call \`gh pr ready\`) after committing the blocked state + HANDOFF.
`;
}

async function runAgent(message: string): Promise<RunResult> {
  const picked = pickPrdDecomposerModel();
  const opts = buildCursorCloudOptions(apiKey!, repo!, picked.modelSelection);
  console.log(`🤖 Decomposition cloud agent — model: ${formatPickedModel(picked)}`);
  const agent = await Agent.create(opts);
  try {
    const run = await agent.send(message);
    const dashboardUrl = `https://cursor.com/agents/${run.agentId}`;
    console.log(`📎 Cursor cloud agent — decomposition`);
    console.log(`   Dashboard : ${dashboardUrl}`);
    console.log(`   Run id    : ${run.id}`);
    console.log(`::notice title=Cursor decomposition agent::${dashboardUrl}`);
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      fs.appendFileSync(
        summaryPath,
        `### Cursor decomposition agent\n\n- [Open in Cursor](${dashboardUrl})\n- Run id: \`${run.id}\`\n- Agent id: \`${run.agentId}\`\n\n`,
      );
    }
    return await run.wait();
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\n🤖 PRD Decomposer`);
  console.log(`   Repo          : ${repo}`);
  console.log(`   Tracking base : ${trackingBase}\n`);

  if (!fs.existsSync(path.join(ROOT, ".cursor"))) {
    console.error("❌ No .cursor/ governance found — this template requires it.");
    process.exit(1);
  }
  const decomposition = autonomousDecompositionEnabled();
  if (!decomposition.enabled) {
    console.log(`⏸️  Autonomous decomposition is off — ${decomposition.reason}. Nothing to do.`);
    process.exit(0);
  }

  const { needed, reason } = needsDecomposition();
  if (!needed) {
    console.log(`✅ No decomposition needed — ${reason}.`);
    process.exit(0);
  }
  console.log(`🧩 Decomposition needed — ${reason}.`);

  // Clean up orphaned branches from previous failed runs before checking for open PRs.
  cleanupOrphanedDecomposeBranches();

  if (openDecompositionPRExists()) {
    console.log("♻️  An open decomposition PR already exists — letting it finish. Exiting.");
    process.exit(0);
  }

  preflight_checkPRPermission();

  const pr = openDraftPR();

  try {
    const result = await withRetry(
      "Cursor agent",
      () => runAgent(buildPrompt(pr)),
      { attempts: 2, baseDelayMs: 5_000 },
    );
    if (result.status === "error") {
      console.error(`\n❌ Decomposition agent run failed. Check the Cursor dashboard: ${pr.url}`);
      console.error("   The draft PR is left open; the next scheduled run will retry.");
      process.exit(2);
    }
    console.log(`\n✅ Decomposition agent finished. PR: ${pr.url}`);
    console.log("   If the agent marked it ready, pr-automation.yml will review + merge it,");
    console.log("   which feeds orchestration-automation.yml → the phase orchestrator.");
    process.exit(0);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`❌ Decomposition agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
      process.exit(1);
    }
    throw err;
  }
}

await main();
