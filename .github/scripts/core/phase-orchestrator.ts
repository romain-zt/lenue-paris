/**
 * phase-orchestrator.ts — autonomous pipeline driver (project-agnostic).
 *
 * Coordinator/worker model:
 *  - Coordinator (no STEP_ID): reads docs/state/orchestration.pipeline.json + status.json,
 *    finds every ready step (deps complete) and every in-progress step that still has an
 *    open tracking PR (draft OR ready), and dispatches one parallel worker per step.
 *  - Worker (STEP_ID set): executes exactly one step — reuses the step's open tracking PR
 *    if one exists (remediation) or opens a fresh draft one, fires a Cursor cloud agent
 *    against the Scope Slice, and verifies the outcome.
 *
 * Resilience built in:
 *  - tracking PRs are matched regardless of draft state, so a readied-but-unmergeable PR
 *    (e.g. failing CI) is never mistaken for an orphan — this prevents duplicate PRs.
 *  - in-progress steps with NO tracking PR at all are reset to not-started (orphan recovery).
 *  - a circuit breaker auto-blocks a step after MAX_REMEDIATION_RUNS to stop infinite refire.
 *  - blocked steps are skipped so a single stall never freezes the whole pipeline.
 * The hourly orchestrator-cleanup.yml is the external safety net (see that file).
 *
 * Every workload is a "slice": it points at a Feature Area + Scope Slice in
 * docs/product/** and lets the .cursor governance drive the actual implementation.
 * There are no project-specific bundled prompts — everything is data-driven.
 */

import { Agent, CursorAgentError, type RunResult } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { formatPickedModel, pickOrchestratorWorkerModel } from "./cursor-models.config";
import fs from "node:fs";
import path from "node:path";
import { execSync, execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const repo = process.env.REPO;
const mergedHeadBranch = process.env.MERGED_HEAD_BRANCH ?? "";
const mergedPrNumber = process.env.MERGED_PR_NUMBER ?? "";
const orchestratorEnabled = process.env.ORCHESTRATOR_ENABLED !== "false";
/** Open tracking PRs against `main` or a long-lived integration branch, e.g. `feature/my-epic`. */
const trackingBase = (process.env.ORCHESTRATOR_TRACKING_BASE ?? "main").trim() || "main";
/** When set, run as a worker for this specific step id only (dispatched by the coordinator). */
const stepId = process.env.STEP_ID?.trim() || "";

/**
 * Max consecutive remediation runs before a step is auto-blocked. Prevents infinite
 * agent refire loops when an agent keeps exploring without committing.
 */
const MAX_REMEDIATION_RUNS = parseInt(process.env.MAX_REMEDIATION_RUNS ?? "5", 10);

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
// Prompt building blocks
// ---------------------------------------------------------------------------
// Each prompt receives `{TRACKING_PR_NUMBER}`, `{TRACKING_PR_BRANCH}`, `{REPO}`,
// `{TRACKING_BASE}` placeholders filled in before firing the agent. The agent MUST
// call `gh pr ready {TRACKING_PR_NUMBER}` as its final act on success to trigger the
// next orchestrator run via pr-ready.yml.

const ORCHESTRATOR_BRANCH_RULES = `## Orchestrator branch rules (mandatory)

A **draft tracking PR already exists**: PR #{TRACKING_PR_NUMBER}, head \`{TRACKING_PR_BRANCH}\` → base \`{TRACKING_BASE}\`.

Automation **only auto-merges that tracking PR** (and stacked dependents via pr-cascade.yml).
Commits that exist only on PRs targeting \`{TRACKING_BASE}\` directly will **not** be included when the tracking PR merges.

### Branch discipline
Before editing:
\`\`\`bash
git fetch origin
git checkout {TRACKING_PR_BRANCH}
git pull --ff-only origin {TRACKING_PR_BRANCH}
\`\`\`
All implementation, tests, docs, and state changes must be committed and pushed to \`{TRACKING_PR_BRANCH}\`.
Never leave useful work only in the local workspace.

### Stacked work
If this step needs more than one PR, stack them: the first additional PR targets
\`--base {TRACKING_PR_BRANCH} --draft\`; each next one targets the previous feature branch.
Never open standalone PRs directly to \`{TRACKING_BASE}\`.

## Bounded setup preflight (≤ 3 tool calls)
Inspect only \`.cursor/rules\`, \`.cursor/skills\`, \`docs/project.config.md\` to learn active constraints.
Do not deep-audit or rewrite the setup. If required setup is missing or contradictory, stop and report:
\`\`\`txt
SETUP_MISSING=true
Reason: ...
Required human/action: ...
\`\`\`

## Anti-analysis-loop rule
This run must produce exactly one concrete outcome:
1. a committed code/test/docs diff pushed to \`{TRACKING_PR_BRANCH}\`, or
2. a committed blocked-state update pushed to \`{TRACKING_PR_BRANCH}\`, or
3. a \`SETUP_MISSING=true\` report.

Hard limits: max 1 broad exploration pass; **after reading 5 files without writing code you MUST stop reading** and either write code or commit a blocked state; max 2 attempts to patch the same file.

## Work package limit
Implement the smallest coherent layer for this step, in this order, doing only the first incomplete one:
1. data/schema (migrations) → 2. contracts/types → 3. domain/business logic → 4. API/route handlers → 5. UI → 6. tests + state finalization.
Record the next layer in \`docs/state/HANDOFF.md\`, commit, push, and stop unless this is the finalization layer.

## Governance
Follow the active \`.cursor/core/rules/\` — especially \`implementation-workflow.mdc\` (spec → test → implementation gates),
\`30-test-strategy.mdc\` (test-first; contract/integration/unit over e2e), \`40-architecture-baseline.mdc\` (stack), and
the v0 boundary in \`docs/project.config.md\`. Do not change architecture, dependencies, or package boundaries unless the step requires it.

## Tier delegation (mandatory)
You are running at **Manager** tier. Per \`.cursor/core/rules/20-model-routing.mdc\`, manager plans/splits, executor builds.
Two named subagents are pre-wired into this run via the \`Task\` tool:
- **\`executor\`** (composer-2.5) — for the actual code-typing brick (one Task / one commit). Use it for mechanical edits, scaffolding from an approved spec, and test-first writes once the layer to implement is unambiguous.
- **\`vision-reviewer\`** (claude-opus-4-8) — read-only escalation for high-risk decisions (irreversible, security, architecture, contract). Use it before committing changes that touch \`auth\`, \`money\`, \`data migrations\`, public contracts, or anything you can't undo.
Default DOWN: do as much as you can yourself at Manager; delegate to \`executor\` for the implementation brick; escalate to \`vision-reviewer\` only when the call is genuinely high-stakes.

## Checks
Run the repo's check commands (typically \`pnpm typecheck\`, \`pnpm build\`, \`pnpm test\`; prefer the narrowest relevant command first).
Do not mark the step complete if required checks fail.

## Human blocker behavior
If work cannot proceed without a person (secrets, product decision, access, ambiguous architecture, unresolved conflict):
1. Set \`docs/state/status.json\` → \`orchestration.steps["{STEP_ID}"] = "blocked"\` and \`orchestration.blocker\` starting with \`NEED_HUMAN:\`.
2. Update \`docs/state/HANDOFF.md\` (what was attempted, what's blocked, the exact input needed).
3. Commit + push to \`{TRACKING_PR_BRANCH}\`. **Do not** call \`gh pr ready\`.
The orchestrator mirrors the blocked state to \`{TRACKING_BASE}\` and skips this step so it can pick other work.

## Completion behavior
Only when the step is fully implemented, checks pass, and \`orchestration.steps["{STEP_ID}"] = "complete"\` is committed on the tracking branch:
\`\`\`bash
gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}
\`\`\`
Otherwise commit the partial layer, update HANDOFF, and stop without calling \`gh pr ready\`.
`;

// ---------------------------------------------------------------------------
// Pipeline + status schema (slice-only, data-driven)
// ---------------------------------------------------------------------------

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface StatusJson {
  orchestration?: {
    steps?: Record<string, PhaseStatus>;
    blocker?: string;
    /** Per-step count of consecutive remediation runs (circuit breaker). */
    remediation_counts?: Record<string, number>;
  };
  [key: string]: unknown;
}

interface PipelineWorkloadSlice {
  kind: "slice";
  title: string;
  featureAreaFile: string;
  scopeSliceFile: string;
  userStoryFile: string | null;
  planFile: string | null;
  notes?: string;
}

interface PipelineStepRow {
  id: string;
  dependsOn: string[];
  workload: PipelineWorkloadSlice;
}

interface PipelineConfig {
  version: number;
  description?: string;
  steps: PipelineStepRow[];
}

const STATUS_PATH = path.join(process.cwd(), "docs/state/status.json");
const PIPELINE_PATH = path.join(process.cwd(), "docs/state/orchestration.pipeline.json");

let pipelineMemo: PipelineConfig | undefined;

function loadPipeline(): PipelineConfig {
  if (pipelineMemo) return pipelineMemo;
  if (!fs.existsSync(PIPELINE_PATH)) {
    console.error("❌ Missing docs/state/orchestration.pipeline.json — seed it under docs/state/ so CI can schedule work.");
    process.exit(1);
  }
  try {
    pipelineMemo = JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf8")) as PipelineConfig;
  } catch (e) {
    console.error("❌ Invalid JSON in docs/state/orchestration.pipeline.json:", e);
    process.exit(1);
  }
  if (!pipelineMemo?.steps?.length) {
    console.error("❌ orchestration.pipeline.json must define a non-empty steps[] array.");
    process.exit(1);
  }
  return pipelineMemo!;
}

function pipelineStepById(id: string): PipelineStepRow {
  const row = loadPipeline().steps.find((s) => s.id === id);
  if (!row) {
    console.error(`❌ Step "${id}" is not listed in docs/state/orchestration.pipeline.json`);
    process.exit(1);
  }
  return row!;
}

function resolveStepStatus(status: StatusJson, id: string): PhaseStatus | undefined {
  return status.orchestration?.steps?.[id];
}

function writeStepState(status: StatusJson, id: string, value: PhaseStatus): void {
  status.orchestration ??= {};
  status.orchestration.steps ??= {};
  status.orchestration.steps[id] = value;
}

function readStatus(): StatusJson | null {
  if (!fs.existsSync(STATUS_PATH)) {
    console.warn("⚠️  docs/state/status.json not found — no automated steps will fire.");
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as StatusJson;
  } catch (err) {
    console.error("❌ Failed to parse docs/state/status.json:", err);
    process.exit(1);
    throw err;
  }
}

function writeStatus(updated: StatusJson): void {
  fs.writeFileSync(STATUS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
}

function getTrackingTitle(stepRow: PipelineStepRow): string {
  const slug = path.basename(stepRow.workload.scopeSliceFile, ".md");
  return `chore(orchestrator): [tracking] ${stepRow.id} — ${slug}`;
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

/** All steps ready to run in parallel: deps complete, step itself not complete/in-progress/blocked. */
function determineReadySteps(status: StatusJson): string[] {
  const cfg = loadPipeline();
  const statusMap = new Map<string, PhaseStatus | undefined>();
  for (const s of cfg.steps) statusMap.set(s.id, resolveStepStatus(status, s.id));

  const ready: string[] = [];
  const blocked: string[] = [];

  for (const row of cfg.steps) {
    const stepStatus = statusMap.get(row.id);
    if (stepStatus === "complete" || stepStatus === "in-progress") continue;

    if (stepStatus === "blocked") {
      console.log(`⏭️  Skipping "${row.id}" (blocked). Will try next eligible step.`);
      blocked.push(row.id);
      continue;
    }

    const unmetDep = row.dependsOn.find((dep) => statusMap.get(dep) !== "complete");
    if (unmetDep) {
      const depStatus = statusMap.get(unmetDep);
      if (depStatus === "blocked") {
        console.log(`⏭️  Skipping "${row.id}" (dependency "${unmetDep}" is blocked).`);
        blocked.push(row.id);
      } else {
        console.log(`⏭️  Skipping "${row.id}" (dependency "${unmetDep}" is ${depStatus ?? "not-started"}).`);
      }
      continue;
    }

    ready.push(row.id);
  }

  if (blocked.length > 0) {
    console.log(`\n🚧 Blocked steps: ${blocked.join(", ")}`);
    console.log("   Check docs/state/status.json for blocker details.");
  }

  return ready;
}

// ---------------------------------------------------------------------------
// git / gh helpers + tracking PR
// ---------------------------------------------------------------------------

function gh(cmd: string): string {
  return execSync(`gh ${cmd}`, { encoding: "utf8" }).trim();
}

function gitExec(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

function ensureOnTrackingMergeBaseBranch(): void {
  gitExec(`fetch origin`);
  try {
    gitExec(`checkout ${trackingBase}`);
    gitExec(`pull origin ${trackingBase} --ff-only`);
    return;
  } catch {
    /* fall through */
  }
  try {
    gitExec(`checkout -B ${trackingBase} origin/${trackingBase}`);
  } catch (e2) {
    console.error(`❌ Could not check out orchestrator merge base '${trackingBase}'. Ensure the branch exists on origin.`);
    throw e2;
  }
}

interface TrackingPR {
  number: number;
  branch: string;
  url: string;
}

function openTrackingPR(stepRow: PipelineStepRow): TrackingPR {
  const step = stepRow.id;
  ensureOnTrackingMergeBaseBranch();

  const branch = `orchestrator/tracking-${step}-${Date.now()}`;
  const title = getTrackingTitle(stepRow);

  gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
  gitExec(`config user.name "github-actions[bot]"`);
  gitExec(`checkout -b ${branch}`);

  const trackingDir = path.join(process.cwd(), "docs/state/tracking");
  fs.mkdirSync(trackingDir, { recursive: true });
  fs.writeFileSync(
    path.join(trackingDir, `${step}.md`),
    `# Tracking: ${step}\n\nStarted: ${new Date().toISOString()}\nBranch: ${branch}\n\nAuto-generated by the phase orchestrator. Delete after the step completes.\n`,
  );

  gitExec(`add docs/state/tracking/`);
  gitExec(`commit -m "chore(orchestrator): open tracking PR for ${step} [skip ci]"`);
  gitExec(`push origin ${branch}`);

  const bodyFile = path.join(process.cwd(), ".github/scripts/core/.tracking-pr-body.md");
  fs.writeFileSync(
    bodyFile,
    [
      `## Orchestrator tracking PR`,
      ``,
      `Step: \`${step}\``,
      `Merge base: \`${trackingBase}\``,
      `Started: ${new Date().toISOString()}`,
      ``,
      `Opened automatically when a step agent starts. The agent marks it \`ready for review\``,
      `on completion, which triggers pr-ready.yml to merge it and advance the chain.`,
      ``,
      `**Do not merge manually** — let the agent drive it.`,
      `**If this stays draft for >1h**, orchestrator-cleanup.yml will re-dispatch or escalate it.`,
    ].join("\n"),
  );

  try {
    const prUrl = gh(
      `pr create --repo "${repo}" --base "${trackingBase}" --head "${branch}" --draft --title "${title}" --body-file "${bodyFile}"`,
    );
    const prNumber = parseInt(prUrl.split("/").at(-1) ?? "0", 10);

    try { fs.unlinkSync(bodyFile); } catch { /* ignore */ }
    try { gitExec(`checkout ${trackingBase}`); } catch { gitExec(`checkout main`); }

    console.log(`📋 Tracking PR #${prNumber} opened (draft): ${prUrl}`);
    return { number: prNumber, branch, url: prUrl };
  } catch (err: unknown) {
    console.error(`❌ Failed to create tracking PR for step ${step} on branch ${branch}. Cleaning up…`);
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

function readStatusFromGitRev(revLike: string): StatusJson | null {
  try {
    const raw = execFileSync("git", ["show", `${revLike}:docs/state/status.json`], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(raw) as StatusJson;
  } catch {
    return null;
  }
}

function extractStepFromTrackingTitle(title: string): string | null {
  if (!title.startsWith("chore(orchestrator): [tracking]")) return null;
  const m = title.match(/\[tracking\]\s+(\S+)/u);
  return m?.[1] ?? null;
}

interface GhPrListRow {
  number: number;
  title: string;
  headRefName: string;
  isDraft: boolean;
  url: string;
  baseRefName: string;
}

/**
 * Find the canonical open tracking PR for a step, **regardless of draft state**.
 *
 * Critical: a tracking PR that an agent has flipped to "ready for review"
 * (non-draft) is STILL this step's tracking PR. Filtering to drafts only — as a
 * previous version did — made a readied-but-unmergeable PR (e.g. failing CI)
 * invisible, so the orchestrator treated the step as orphaned, reset it, and
 * opened a brand-new tracking PR → duplicate stuck PRs. We therefore match any
 * open PR for the step on the tracking base.
 *
 * When more than one exists (a residual race), the OLDEST (lowest PR number) is
 * the canonical one. orchestrator-cleanup.ts uses the same oldest-wins rule, so
 * both converge on the same PR and the cleanup closes the newer duplicates.
 */
function findTrackingPR(step: string): TrackingPR | null {
  try {
    const raw = gh(`pr list --repo "${repo}" --state open --json number,title,headRefName,isDraft,url,baseRefName`);
    const prs = JSON.parse(raw) as GhPrListRow[];
    const matches = prs
      .filter((pr) => extractStepFromTrackingTitle(pr.title) === step && pr.baseRefName === trackingBase)
      .sort((a, b) => a.number - b.number);
    const pr = matches[0];
    if (pr) {
      if (matches.length > 1) {
        console.log(
          `   …${matches.length} open tracking PRs for "${step}" (${matches
            .map((m) => `#${m.number}`)
            .join(", ")}); treating oldest #${pr.number} as canonical (cleanup closes the rest).`,
        );
      }
      return { number: pr.number, branch: pr.headRefName, url: pr.url };
    }
  } catch (e) {
    console.warn("⚠️  findTrackingPR failed:", e);
  }
  return null;
}

function phaseCompleteOnStatus(id: string, st: StatusJson): boolean {
  return resolveStepStatus(st, id) === "complete";
}

function phaseBlockedOnStatus(id: string, st: StatusJson): boolean {
  return resolveStepStatus(st, id) === "blocked";
}

/** Copy blocked step state from the agent branch into the merge base so the pipeline can skip and continue. */
function syncBlockedFromRemoteToBase(step: string, remoteRev: string): boolean {
  const remoteS = readStatusFromGitRev(remoteRev);
  if (!remoteS || !phaseBlockedOnStatus(step, remoteS)) return false;
  try {
    gitExec(`checkout ${trackingBase}`);
    gitExec(`pull origin ${trackingBase} --ff-only`);
  } catch { /* */ }
  const baseS = readStatus();
  if (!baseS) return false;
  writeStepState(baseS, step, "blocked");
  const blockerFromRemote = remoteS.orchestration?.blocker;
  if (blockerFromRemote) {
    baseS.orchestration ??= {};
    baseS.orchestration.blocker = blockerFromRemote;
  }
  writeStatus(baseS);
  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): mirror blocked state for ${step} from agent branch [skip ci]"`);
    gitExec(`push`);
    console.log(`📌 Mirrored '${step}' → blocked on ${trackingBase} (orchestrator will skip this step).`);
    return true;
  } catch (err) {
    console.warn("⚠️  Could not commit blocked mirror:", err);
    return false;
  }
}

function markInProgress(status: StatusJson, id: string): void {
  writeStepState(status, id, "in-progress");
  writeStatus(status);
  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): mark ${id} as in-progress [skip ci]"`);
    gitExec(`push`);
    console.log(`📝 status.json updated: ${id} → in-progress`);
  } catch (err) {
    console.warn("⚠️  Could not commit status update (non-fatal):", err);
  }
}

function resetInProgress(id: string): void {
  try {
    gitExec(`checkout ${trackingBase}`);
    gitExec(`pull origin ${trackingBase} --ff-only`);
  } catch { /* may already be on base */ }

  const current = readStatus();
  if (!current) return;
  if (resolveStepStatus(current, id) !== "in-progress") return;

  writeStepState(current, id, "not-started");
  writeStatus(current);
  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "chore(orchestrator): reset ${id} from in-progress to not-started (agent failed) [skip ci]"`);
    gitExec(`push`);
    console.log(`🔄 Reset ${id} → not-started (will retry on next cron).`);
  } catch (err) {
    console.warn("⚠️  Could not commit status reset (non-fatal):", err);
  }
}

// ---------------------------------------------------------------------------
// Preflight (light, generic)
// ---------------------------------------------------------------------------

function runPreflight(): boolean {
  const cwd = process.cwd();
  if (!fs.existsSync(path.join(cwd, ".cursor"))) {
    console.error("❌ Preflight: no .cursor/ governance found — this template requires it.");
    return false;
  }
  if (!fs.existsSync(path.join(cwd, "docs/project.config.md"))) {
    console.warn("⚠️  Preflight: docs/project.config.md missing — the agent will have no project identity/v0 boundary.");
  }
  console.log("✅ Preflight OK.");
  return true;
}

// ---------------------------------------------------------------------------
// Cloud run telemetry + prompt
// ---------------------------------------------------------------------------

function githubNoticeBody(text: string): string {
  return text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

function emitCursorCloudRunTelemetry(args: { label: string; agentId: string; runId: string }): void {
  const { label, agentId, runId } = args;
  const dashboardUrl = `https://cursor.com/agents/${agentId}`;
  const streamUrl = `https://api.cursor.com/v1/agents/${agentId}/runs/${runId}/stream`;

  console.log(`\n📎 Cursor cloud agent — ${label}`);
  console.log(`   Dashboard : ${dashboardUrl}`);
  console.log(`   Run id    : ${runId}`);
  console.log(`   Stream API: ${streamUrl}`);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    fs.appendFileSync(
      summaryPath,
      `### Cursor cloud agent — ${label}\n\n- [Open in Cursor](${dashboardUrl})\n- Run id: \`${runId}\`\n- Agent id: \`${agentId}\`\n- Stream (SSE, needs \`CURSOR_API_KEY\`): \`${streamUrl}\`\n\n`,
    );
  }
  console.log(`::notice title=Cursor cloud agent::${githubNoticeBody(`${label}: ${dashboardUrl}`)}`);
}

async function runOneCloudPrompt(message: string, label: string): Promise<RunResult> {
  const picked = pickOrchestratorWorkerModel();
  const opts = buildCursorCloudOptions(apiKey!, repo!, picked.modelSelection);
  console.log(`🤖 Cloud agent for "${label}" — model: ${formatPickedModel(picked)}`);
  const agent = await Agent.create(opts);
  try {
    const run = await agent.send(message);
    emitCursorCloudRunTelemetry({ label, agentId: run.agentId, runId: run.id });
    return await run.wait();
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

function sliceWorkloadMarkdown(stepRow: PipelineStepRow): string {
  const w = stepRow.workload;
  const us = w.userStoryFile?.trim()
    ? `- User story: \`${w.userStoryFile}\`\n`
    : `- User story: if none is linked yet, derive it from the Scope Slice per governance once it is ready-for-user-stories — do not invent scope beyond the Slice file.\n`;
  const plan = w.planFile?.trim()
    ? `- Implementation plan (approved): \`${w.planFile}\`\n`
    : `- Implementation plan: if missing and the implementation phase requires one, produce it per \`.cursor/core/commands/\`; until approved, set this step \`blocked\` + NEED_HUMAN referencing the Slice path.\n`;
  const notes = w.notes?.trim() ? `\nOperator notes — ${w.notes.trim()}\n` : "";

  return `## Step workload — ${w.title}

Current pipeline step id: \`${stepRow.id}\`. Set \`docs/state/status.json\` → \`orchestration.steps["${stepRow.id}"]\` to \`"complete"\` or \`"blocked"\` before declaring the step done (also set \`orchestration.blocker\` when blocked).

Read \`docs/state/HANDOFF.md\` and \`docs/project.config.md\`, then anchor on:
- Feature Area: \`${w.featureAreaFile}\`
- Scope Slice: \`${w.scopeSliceFile}\`
${us}${plan}${notes}
### Done criteria
1. Smallest coherent layer implemented for this Slice, inside its scope only.
2. Repo check commands pass on every head you push.
3. \`orchestration.steps["${stepRow.id}"] = "complete"\` committed on \`{TRACKING_PR_BRANCH}\`, then \`gh pr ready {TRACKING_PR_NUMBER} --repo {REPO}\`.
4. If blocked on a human/policy decision: \`blocked\`, refresh HANDOFF, omit \`gh pr ready\`.
`;
}

function validateRunnableStep(id: string): void {
  const row = pipelineStepById(id);
  const cwd = process.cwd();
  for (const rel of [row.workload.featureAreaFile, row.workload.scopeSliceFile]) {
    if (!fs.existsSync(path.join(cwd, rel))) {
      console.error(`❌ Step "${id}" references missing file: ${rel}`);
      process.exit(1);
    }
  }
}

function buildOrchestratorPrompt(id: string, trackingPR: TrackingPR, remediate: boolean): string {
  const stepRow = pipelineStepById(id);
  const body = sliceWorkloadMarkdown(stepRow);
  const remediation = remediate
    ? `## Remediation pass (mandatory context)

Step **${id}** is **in-progress**. Draft tracking PR **#${trackingPR.number}** (\`${trackingPR.branch}\` → \`${trackingBase}\`) already exists.
Automation is re-invoking you to **continue** until the work merges or you block it cleanly:
- Rebase/repair \`${trackingPR.branch}\` onto \`${trackingBase}\`; keep stacked dependents consistent.
- Clear failing CI checks and reviewer feedback with additional commits.
- Success: \`orchestration.steps["${id}"] = "complete"\`, push, then \`gh pr ready ${trackingPR.number} --repo ${repo}\`.
- Human stall: \`blocked\`, set \`orchestration.blocker\` (\`NEED_HUMAN:\` when appropriate), update HANDOFF, do not call \`gh pr ready\`.

`
    : "";

  return `${remediation}${ORCHESTRATOR_BRANCH_RULES}${body}`
    .replace(/\{TRACKING_PR_NUMBER\}/g, String(trackingPR.number))
    .replace(/\{TRACKING_PR_BRANCH\}/g, trackingPR.branch)
    .replace(/\{REPO\}/g, repo!)
    .replace(/\{TRACKING_BASE\}/g, trackingBase)
    .replace(/\{STEP_ID\}/g, id);
}

async function executeAgentRun(step: string, trackingPR: TrackingPR, remediate: boolean): Promise<void> {
  validateRunnableStep(step);
  const prompt = buildOrchestratorPrompt(step, trackingPR, remediate);
  console.log(`🚀 Firing Cursor cloud agent for ${step}${remediate ? " (remediation)" : ""}…\n`);

  try {
    const result = await runOneCloudPrompt(prompt, remediate ? `${step} (remediation)` : step);

    if (result.status === "error") {
      console.error(`\n❌ Agent run for "${step}" failed. Check the Cursor dashboard.`);
      // Only a genuine orphan (no tracking PR at all) is reset. While the
      // tracking PR exists, leave the step in-progress so the bounded
      // remediation loop (MAX_REMEDIATION_RUNS) retries instead of spawning a
      // duplicate PR.
      if (!findTrackingPR(step)) resetInProgress(step);
      process.exit(2);
    }

    console.log(`\n🔍 Verifying post-agent conditions for "${step}"…`);
    try {
      gitExec(`fetch origin ${trackingPR.branch}`);
    } catch {
      console.warn(`⚠️  git fetch origin ${trackingPR.branch} failed — status check may fail.`);
    }

    const remoteRev = `origin/${trackingPR.branch}`;
    const freshStatus = readStatusFromGitRev(remoteRev);
    const phaseIsComplete = freshStatus ? phaseCompleteOnStatus(step, freshStatus) : false;
    const phaseIsBlocked = freshStatus ? phaseBlockedOnStatus(step, freshStatus) : false;

    // Blocked → mirror to the base so the orchestrator skips this step and picks
    // other work. Takes priority over draft/ready state.
    if (phaseIsBlocked && syncBlockedFromRemoteToBase(step, remoteRev)) {
      console.log("✅ Step marked blocked on base; orchestrator can pick other work.");
      process.exit(0);
    }

    let trackingPRIsDraft = true;
    try {
      const prData = JSON.parse(
        execSync(`gh pr view ${trackingPR.number} --repo "${repo}" --json isDraft`, { encoding: "utf8" }).trim(),
      ) as { isDraft: boolean };
      trackingPRIsDraft = prData.isDraft;
    } catch {
      console.warn(`⚠️  Could not query tracking PR #${trackingPR.number} state (non-fatal).`);
    }

    if (phaseIsComplete) {
      // Work is done on the branch. If the agent forgot to flip the PR ready,
      // do it for them (idempotent) so pr-ready.yml / cleanup can merge it.
      if (trackingPRIsDraft) {
        try {
          gh(`pr ready ${trackingPR.number} --repo "${repo}"`);
          console.log(`🟢 Marked tracking PR #${trackingPR.number} ready for review (agent reported complete).`);
        } catch {
          console.warn(`⚠️  Could not flip PR #${trackingPR.number} to ready (non-fatal).`);
        }
      }
      console.log(
        `✅ Post-agent checks passed: "${step}" complete — tracking PR #${trackingPR.number} will merge once checks are green.`,
      );
      process.exit(0);
    }

    // Not complete and not blocked → still in progress. The tracking PR exists,
    // so DO NOT reset: that is exactly what spawned duplicate PRs before.
    // Leave the step in-progress; the next bounded remediation worker continues.
    console.log(
      `\n⏳ "${step}" not yet complete (tracking PR #${trackingPR.number}, ${
        trackingPRIsDraft ? "draft" : "ready"
      }). Leaving in-progress for the next remediation run.`,
    );
    process.exit(0);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
      if (!findTrackingPR(step)) resetInProgress(step);
      process.exit(1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Circuit breaker (worker remediation bookkeeping)
// ---------------------------------------------------------------------------

function commitStatus(message: string): void {
  try {
    gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    gitExec(`config user.name "github-actions[bot]"`);
    gitExec(`add docs/state/status.json`);
    gitExec(`commit -m "${message}"`);
    gitExec(`push`);
  } catch (err) {
    console.warn("⚠️  Could not persist status (non-fatal):", err);
  }
}

/** Returns true if the circuit breaker tripped (step auto-blocked); false to proceed. */
function bumpRemediationOrTrip(status: StatusJson, id: string): boolean {
  status.orchestration ??= {};
  status.orchestration.remediation_counts ??= {};
  const remCount = (status.orchestration.remediation_counts[id] ?? 0) + 1;
  status.orchestration.remediation_counts[id] = remCount;

  if (remCount > MAX_REMEDIATION_RUNS) {
    const blocker = `NEED_HUMAN: step "${id}" exceeded ${MAX_REMEDIATION_RUNS} remediation runs (agent kept exploring without committing). Review the Cursor dashboard and reset manually once resolved.`;
    console.error(`\n❌ Circuit breaker tripped for "${id}" (${remCount} > ${MAX_REMEDIATION_RUNS}). Auto-blocking.`);
    writeStepState(status, id, "blocked");
    status.orchestration.blocker = blocker;
    writeStatus(status);
    commitStatus(`chore(orchestrator): auto-block ${id} after ${MAX_REMEDIATION_RUNS} remediation attempts [skip ci]`);
    return true;
  }

  writeStatus(status);
  commitStatus(`chore(orchestrator): remediation run ${remCount}/${MAX_REMEDIATION_RUNS} for ${id} [skip ci]`);
  console.log(`🔁 Remediation ${remCount}/${MAX_REMEDIATION_RUNS} for "${id}".`);
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function mainOrchestrator(): Promise<void> {
  console.log(`\n🤖 Phase Orchestrator`);
  console.log(`   Merged PR     : #${mergedPrNumber}`);
  console.log(`   Head branch   : ${mergedHeadBranch}`);
  console.log(`   Repo          : ${repo}`);
  console.log(`   Tracking base : ${trackingBase}`);
  console.log(`   Mode          : ${stepId ? `worker (${stepId})` : "coordinator"}\n`);

  let status = readStatus();
  if (!status) {
    process.exit(0);
    return;
  }

  // -------------------------------------------------------------------------
  // Worker mode — execute exactly one step
  // -------------------------------------------------------------------------
  if (stepId) {
    if (!runPreflight()) {
      console.error(`❌ Preflight failed for "${stepId}". Halting.`);
      process.exit(2);
    }

    const currentStepStatus = resolveStepStatus(status, stepId);
    validateRunnableStep(stepId);

    // Always look for an existing tracking PR for this step first (draft OR
    // ready) — the worker is idempotent and may be re-dispatched (cron, CI
    // failure, manual). If one exists, that's the source of truth; reuse it.
    // This is the primary defense against duplicate tracking PRs: we never open
    // a second PR while one is already open for the step.
    const existingPR = findTrackingPR(stepId);

    if (existingPR) {
      // If a tracking PR already exists for this step, by definition the agent
      // is continuing previous work, not starting fresh. Always run in
      // remediation mode and ensure status.json reflects in-progress so the
      // coordinator + cleanup see a coherent state.
      if (currentStepStatus !== "in-progress") {
        console.log(
          `🔧 Worker: status was "${currentStepStatus ?? "unset"}" but tracking PR #${existingPR.number} exists — restoring in-progress.`,
        );
        markInProgress(status, stepId);
        status = readStatus() ?? status;
      }
      console.log(`♻️  Reusing existing tracking PR #${existingPR.number} for "${stepId}" (remediation).`);
      if (bumpRemediationOrTrip(status, stepId)) process.exit(2);
      await executeAgentRun(stepId, existingPR, true);
      return;
    }

    // No tracking PR exists. If the status still says in-progress that is an
    // actual orphan (a previous agent run died before/after committing). Reset
    // and continue with a fresh PR. (If status is anything else this is just a
    // fresh dispatch — no reset needed.)
    if (currentStepStatus === "in-progress") {
      console.log(
        `⚠️  Worker: "${stepId}" in-progress but no tracking PR for '${trackingBase}' — orphaned, resetting before retry.`,
      );
      resetInProgress(stepId);
      status = readStatus() ?? status;
    }

    console.log(`\n📋 Opening draft tracking PR for ${stepId}…`);
    const trackingPR = openTrackingPR(pipelineStepById(stepId));
    // Mark the step in-progress as soon as we own a PR — keeps status.json and
    // the open PR in sync even if the agent run dies before completing.
    markInProgress(status, stepId);
    status = readStatus() ?? status;
    await executeAgentRun(stepId, trackingPR, false);
    return;
  }

  // -------------------------------------------------------------------------
  // Coordinator mode — fan-out across all ready steps
  // -------------------------------------------------------------------------

  // 1. Reset orphaned in-progress steps (in-progress but no tracking PR at all).
  for (const row of loadPipeline().steps) {
    if (resolveStepStatus(status, row.id) !== "in-progress") continue;
    if (!findTrackingPR(row.id)) {
      console.log(`⚠️  "${row.id}" in-progress but no tracking PR for '${trackingBase}'. Resetting.`);
      resetInProgress(row.id);
    }
  }

  status = readStatus();
  if (!status) { process.exit(0); return; }

  // 2. in-progress steps WITH tracking PRs (draft or ready) → remediation workers.
  const remediationSteps: string[] = [];
  for (const row of loadPipeline().steps) {
    if (resolveStepStatus(status, row.id) !== "in-progress") continue;
    if (findTrackingPR(row.id)) remediationSteps.push(row.id);
  }

  // 3. ready steps (deps complete, not started).
  const readySteps = determineReadySteps(status);

  if (readySteps.length === 0 && remediationSteps.length === 0) {
    console.log("🏁 No next automated step. All steps complete or awaiting a human decision.");
    process.exit(0);
  }

  // 4. Validate + mark ready steps in-progress sequentially (avoid push races on status.json).
  for (const step of readySteps) validateRunnableStep(step);
  for (const step of readySteps) {
    markInProgress(status, step);
    status = readStatus() ?? status;
  }

  // 5. Dispatch one worker per step (parallel GHA jobs).
  const toDispatch = [...new Set([...readySteps, ...remediationSteps])];
  console.log(`\n🔀 Dispatching ${toDispatch.length} parallel worker(s): ${toDispatch.join(", ")}`);

  for (const step of toDispatch) {
    try {
      execSync(
        `gh workflow run phase-orchestrator.yml --repo "${repo}" -f step_id="${step}" -f reason="parallel dispatch (${step})"`,
        { stdio: "inherit" },
      );
      console.log(`  ✅ Dispatched: ${step}`);
    } catch (err) {
      console.warn(`  ⚠️  Dispatch failed for "${step}" (non-fatal — next cron will retry):`, err);
    }
  }
}

await mainOrchestrator();
