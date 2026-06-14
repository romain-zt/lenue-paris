/**
 * Orchestrator Cleanup — frequent safety net ("re-catch").
 *
 * This is the workflow that guarantees nothing stays stuck: it runs on a 15-min
 * cron independent of any PR event, plus immediately when CI fails on a tracking
 * branch (see orchestrator-cleanup.yml workflow_run trigger).
 *
 * 1. DUPLICATE PRs — when multiple tracking PRs exist for the same step,
 *    keep the best one (non-draft > draft, newest wins on tie) and close the rest.
 *
 * 2. STUCK READY PRs — tracking PRs that are non-draft (ready for review) but
 *    haven't been merged within STALE_READY_MINUTES. pr-ready.yml fires only on
 *    the draft→ready transition; if it was missed, the PR just sits there. Re-merge it.
 *
 * 3. ORPHANED IN-PROGRESS STEPS — pipeline steps marked in-progress in status.json
 *    but with no open tracking PR at all (branch/PR deleted out-of-band). Reset them
 *    to not-started so the next orchestrator tick can pick them up.
 *
 * 4. STALE PRs — tracking PRs (draft, or ready-but-unmergeable) open longer than
 *    STALE_DRAFT_MINUTES are re-dispatched to the orchestrator (remediation) so a
 *    stalled agent gets retried quickly rather than sitting forever.
 *
 * 5. STATUS / PR DESYNC — a step whose status.json says not-started or complete
 *    but which still has an open tracking PR (draft OR ready). This happens when a
 *    worker races (resets to not-started, opens a PR, agent partially commits, exits
 *    without re-marking in-progress). Restore the step to in-progress so the
 *    next coordinator dispatches a remediation worker instead of opening a
 *    duplicate PR (or ignoring the orphaned one).
 *
 * Duplicate prevention: dedup (#1) and the orchestrator both treat the OLDEST open
 * tracking PR per step as canonical, and tracking PRs are matched regardless of
 * draft state, so a readied/failing PR can never masquerade as a missing one.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const repo = process.env.REPO ?? "";
const trackingBase = (process.env.ORCHESTRATOR_TRACKING_BASE ?? "main").trim() || "main";
/** Close + reset a "ready" tracking PR if it's been open longer than this. */
const STALE_READY_MINUTES = parseInt(process.env.STALE_READY_MINUTES ?? "10", 10);
/** Re-dispatch a still-draft tracking PR (likely a stalled agent) after this long. */
const STALE_DRAFT_MINUTES = parseInt(process.env.STALE_DRAFT_MINUTES ?? "15", 10);
const REQUIRED_CHECKS = process.env.REQUIRED_CHECKS ?? "quality";

if (!repo) {
  console.error("❌ REPO env var is required (e.g. owner/repo).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gh(cmd: string): string {
  return execSync(`gh ${cmd}`, { encoding: "utf8" }).trim();
}

function ghSilent(cmd: string): boolean {
  try {
    execSync(`gh ${cmd}`, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function git(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

function extractStepFromTitle(title: string): string | null {
  if (!title.startsWith("chore(orchestrator): [tracking]")) return null;
  const m = title.match(/\[tracking\]\s+(\S+)/u);
  return m?.[1] ?? null;
}

interface PrRow {
  number: number;
  title: string;
  headRefName: string;
  headRefOid: string;
  isDraft: boolean;
  url: string;
  baseRefName: string;
  createdAt: string;
  mergeable: string;
  mergeStateStatus: string;
}

function requiredChecksPass(pr: PrRow): boolean {
  try {
    execSync("bash .github/scripts/core/wait-for-required-pr-checks.sh", {
      stdio: "inherit",
      env: {
        ...process.env,
        REPO: repo,
        PR_NUMBER: String(pr.number),
        PR_SHA: pr.headRefOid,
        REQUIRED_CHECKS,
        WAIT_MODE: "strict",
      },
    });
    return true;
  } catch {
    return false;
  }
}

interface StatusJson {
  orchestration?: { steps?: Record<string, string> };
  [key: string]: unknown;
}

function listOpenTrackingPRs(): PrRow[] {
  const raw = gh(
    `pr list --repo "${repo}" --state open --json number,title,headRefName,headRefOid,isDraft,url,baseRefName,createdAt,mergeable,mergeStateStatus`,
  );
  const all = JSON.parse(raw) as PrRow[];
  return all.filter((pr) => extractStepFromTitle(pr.title) !== null && pr.baseRefName === trackingBase);
}

function readStatusJson(): StatusJson | null {
  const p = path.join(process.cwd(), "docs/state/status.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as StatusJson;
  } catch {
    return null;
  }
}

function writeStatusJson(s: StatusJson): void {
  const p = path.join(process.cwd(), "docs/state/status.json");
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n", "utf8");
}

function minutesAgo(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 60_000;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("🧹 Orchestrator cleanup starting…");
  console.log(
    `   repo: ${repo}  |  trackingBase: ${trackingBase}  |  staleReadyMin: ${STALE_READY_MINUTES}  |  staleDraftMin: ${STALE_DRAFT_MINUTES}`,
  );

  // Ensure we're on the tracking base branch and up-to-date.
  try {
    git(`checkout ${trackingBase}`);
    git(`pull origin ${trackingBase} --ff-only`);
  } catch {
    // May already be detached or on the right branch — proceed anyway.
  }

  const prs = listOpenTrackingPRs();
  console.log(
    `\n📋 Found ${prs.length} open tracking PR(s):\n${
      prs.map((p) => `  #${p.number} [${p.isDraft ? "draft" : "ready"}] ${extractStepFromTitle(p.title)}`).join("\n") ||
      "  (none)"
    }`,
  );

  if (prs.length === 0) {
    console.log("\n✅ No tracking PRs.");
    reconcileStatusAndPRs([]);
    return;
  }

  // -------------------------------------------------------------------------
  // 1. Group by step — detect duplicates
  // -------------------------------------------------------------------------
  const byStep = new Map<string, PrRow[]>();
  for (const pr of prs) {
    const step = extractStepFromTitle(pr.title)!;
    if (!byStep.has(step)) byStep.set(step, []);
    byStep.get(step)!.push(pr);
  }

  const survivingPRs: PrRow[] = [];

  for (const [step, stepPRs] of byStep) {
    if (stepPRs.length === 1) {
      survivingPRs.push(stepPRs[0]!);
      continue;
    }

    console.log(`\n⚠️  Step "${step}" has ${stepPRs.length} open tracking PRs — picking canonical one.`);

    // Canonical = the OLDEST tracking PR (lowest number). This matches
    // findTrackingPR() in phase-orchestrator.ts, so the orchestrator remediates
    // the exact PR the cleanup keeps. The oldest PR is the original one and
    // typically holds the accumulated work; later duplicates are redundant
    // re-scaffolds and get closed.
    const sorted = [...stepPRs].sort((a, b) => a.number - b.number);
    const winner = sorted[0]!;
    const losers = sorted.slice(1);

    console.log(`  ✅ Keeping  #${winner.number} [${winner.isDraft ? "draft" : "ready"}]`);
    for (const loser of losers) {
      console.log(`  🗑  Closing #${loser.number} [${loser.isDraft ? "draft" : "ready"}]`);
      ghSilent(
        `pr close ${loser.number} --repo "${repo}" ` +
          `--comment "Closing: duplicate tracking PR for step \`${step}\`. ` +
          `PR #${winner.number} is the canonical tracking PR." ` +
          `--delete-branch`,
      );
    }

    survivingPRs.push(winner);
  }

  // -------------------------------------------------------------------------
  // 2. Attempt to merge stuck "ready" (non-draft) tracking PRs
  // -------------------------------------------------------------------------
  console.log("\n🔍 Checking for stuck ready tracking PRs…");

  for (const pr of survivingPRs) {
    if (pr.isDraft) continue;

    const age = minutesAgo(pr.createdAt);
    const step = extractStepFromTitle(pr.title)!;

    if (age < STALE_READY_MINUTES) {
      console.log(`  ⏳ PR #${pr.number} (${step}) ready for ${age.toFixed(1)}min — too recent, skipping.`);
      continue;
    }

    if (pr.mergeable !== "MERGEABLE" || pr.mergeStateStatus === "BLOCKED") {
      console.log(
        `  ⚠️  PR #${pr.number} (${step}) is not mergeable (mergeable=${pr.mergeable}, state=${pr.mergeStateStatus}) — skipping auto-merge.`,
      );
      continue;
    }

    if (!requiredChecksPass(pr)) {
      console.log(`  ⚠️  PR #${pr.number} (${step}) — required checks not green — skipping auto-merge.`);
      continue;
    }

    console.log(`  🚀 PR #${pr.number} (${step}) ready for ${age.toFixed(1)}min — auto-merging.`);
    const ok = ghSilent(
      `pr merge ${pr.number} --repo "${repo}" --merge ` +
        `--subject "chore(orchestrator): complete phase tracking PR #${pr.number}" ` +
        `--delete-branch`,
    );

    if (ok) {
      console.log(`  ✅ Merged PR #${pr.number}.`);
      ghSilent(
        `workflow run phase-orchestrator.yml --repo "${repo}" -f reason="cleanup: merged stuck ready tracking PR #${pr.number}"`,
      );
      survivingPRs.splice(survivingPRs.indexOf(pr), 1);
    } else {
      console.warn(`  ⚠️  Merge failed for PR #${pr.number} — will retry next run.`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Re-dispatch stale tracking PRs (likely a stalled agent).
  //    Covers drafts AND any ready PR that survived the merge attempts above
  //    (i.e. ready but unmergeable — failing CI / conflicts). Both need a fresh
  //    remediation worker; the worker reuses the same PR (no duplicate).
  // -------------------------------------------------------------------------
  console.log("\n🔍 Checking for stale tracking PRs to re-dispatch…");
  for (const pr of survivingPRs) {
    const age = minutesAgo(pr.createdAt);
    const step = extractStepFromTitle(pr.title)!;
    const kind = pr.isDraft ? "draft" : "ready";
    if (age < STALE_DRAFT_MINUTES) {
      console.log(`  ⏳ ${kind} PR #${pr.number} (${step}) open ${age.toFixed(1)}min — within budget.`);
      continue;
    }
    console.log(`  🔁 ${kind} PR #${pr.number} (${step}) open ${age.toFixed(1)}min — re-dispatching remediation worker.`);
    ghSilent(
      `workflow run phase-orchestrator.yml --repo "${repo}" -f step_id="${step}" ` +
        `-f reason="cleanup: re-dispatch stale ${kind} tracking PR #${pr.number} (${age.toFixed(0)}min)"`,
    );
  }

  // -------------------------------------------------------------------------
  // 4. Reset orphaned in-progress steps (in-progress in status.json but no
  //    tracking PR at all) AND reconcile desynced steps (open tracking PR but
  //    status not-started/complete).
  // -------------------------------------------------------------------------
  reconcileStatusAndPRs(survivingPRs);

  console.log("\n✅ Cleanup complete.");
}

/**
 * Reconcile status.json against open tracking PRs (draft OR ready):
 *   A. Step in-progress, no tracking PR → reset to not-started (orphan).
 *   B. Step not-started/complete, a tracking PR exists → restore to in-progress
 *      (desync — the worker raced past status update or got killed mid-run).
 *
 * We count BOTH draft and ready tracking PRs as "live". A readied-but-unmergeable
 * tracking PR (e.g. failing CI) is still this step's PR; treating it as live
 * keeps the step in-progress for remediation instead of resetting it, which is
 * what previously spawned duplicate tracking PRs.
 *
 * Either way the next coordinator tick lands the step + PR back in a coherent
 * state and dispatches a remediation worker instead of opening a duplicate PR.
 */
function reconcileStatusAndPRs(survivingPRs: PrRow[]): void {
  const status = readStatusJson();
  if (!status) return;

  const steps = status.orchestration?.steps ?? {};
  const trackedStepIds = new Set(survivingPRs.map((p) => extractStepFromTitle(p.title)!));

  const inProgressSteps = Object.entries(steps)
    .filter(([, v]) => v === "in-progress")
    .map(([k]) => k);
  const desyncedSteps = Object.entries(steps)
    .filter(([id, v]) => (v === "not-started" || v === "complete") && trackedStepIds.has(id))
    .map(([k]) => k);

  if (inProgressSteps.length === 0 && desyncedSteps.length === 0 && trackedStepIds.size === 0) {
    console.log("\nℹ️  No in-progress steps and no tracking PRs — nothing to reconcile.");
    return;
  }

  console.log(
    `\n🔍 Reconciling ${inProgressSteps.length} in-progress step(s) and ${desyncedSteps.length} desync candidate(s)…`,
  );

  const updates: string[] = [];

  for (const stepId of inProgressSteps) {
    if (trackedStepIds.has(stepId)) {
      console.log(`  ✅ ${stepId} (in-progress) has an active tracking PR — OK.`);
      continue;
    }
    console.log(`  🔄 ${stepId} is in-progress but has no tracking PR — resetting to not-started.`);
    if (!status.orchestration) status.orchestration = {};
    if (!status.orchestration.steps) status.orchestration.steps = {};
    status.orchestration.steps[stepId] = "not-started";
    updates.push(`reset orphan ${stepId} → not-started`);
  }

  for (const stepId of desyncedSteps) {
    const previous = status.orchestration?.steps?.[stepId];
    console.log(
      `  🔧 ${stepId} is "${previous}" but a draft tracking PR is open — restoring to in-progress.`,
    );
    if (!status.orchestration) status.orchestration = {};
    if (!status.orchestration.steps) status.orchestration.steps = {};
    status.orchestration.steps[stepId] = "in-progress";
    updates.push(`restore desync ${stepId} (was ${previous}) → in-progress`);
  }

  if (updates.length === 0) return;

  writeStatusJson(status);

  try {
    git(`config user.email "github-actions[bot]@users.noreply.github.com"`);
    git(`config user.name "github-actions[bot]"`);
    git(`add docs/state/status.json`);
    git(
      `commit -m "chore(orchestrator): cleanup — reconcile status.json (${updates.length} fix${
        updates.length === 1 ? "" : "es"
      }) [skip ci]"`,
    );
    git(`push`);
    console.log(`  📝 Committed reconciliation: ${updates.join("; ")}`);
  } catch (err) {
    console.warn("  ⚠️  Could not commit reconciliation (non-fatal):", err);
  }
}

await main();
