/**
 * ci-failure-autofix.ts
 *
 * Invoked by ci-failure-autofix.yml when a CI/E2E run on a PR finishes with
 * `failure`. It reads the failing run's logs and fires a Cursor cloud agent that
 * checks out the PR branch, diagnoses the failure, pushes the smallest fix, and
 * lets CI re-run. No human in the loop.
 *
 * Loop safety (so a failing auto-fix can't run forever):
 *   - Kill switch: ORCHESTRATOR_ENABLED=false → exit cleanly (shared with the rest of the pipeline).
 *   - Budget:      every fix commit carries a `[ci-autofix]` marker. Before firing
 *                  we count existing marker commits on the PR; at MAX_CI_AUTOFIX_ATTEMPTS
 *                  we stop and post a NEED_HUMAN comment instead of trying again.
 *   - Scope:       only acts on open PRs; skips branches in SKIP_BRANCH_PREFIXES
 *                  (orchestrator branches drive their own remediation).
 *
 * Project-agnostic — the agent reads docs/project.config.md + .cursor/rules/ in-run.
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { pickCiAutofixModel } from "./cursor-models.config";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const ghToken = process.env.GH_TOKEN;
const repo = process.env.REPO;
const runId = process.env.RUN_ID;
const workflowName = (process.env.WORKFLOW_NAME ?? "CI").trim() || "CI";
const headBranch = (process.env.HEAD_BRANCH ?? "").trim();
const headSha = (process.env.HEAD_SHA ?? "").trim();
const enabled = (process.env.ORCHESTRATOR_ENABLED ?? "true").trim().toLowerCase();
const maxAttempts = Number.parseInt(process.env.MAX_CI_AUTOFIX_ATTEMPTS ?? "3", 10) || 3;
const skipPrefixes = (process.env.SKIP_BRANCH_PREFIXES ?? "orchestrator/")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MARKER = "[ci-autofix]";

if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set.");
  process.exit(1);
}
if (!ghToken) {
  console.error("❌ GH_TOKEN is not set.");
  process.exit(1);
}
if (!repo) {
  console.error("❌ REPO env var is missing.");
  process.exit(1);
}
if (!runId) {
  console.error("❌ RUN_ID env var is missing.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Kill switch
// ---------------------------------------------------------------------------

if (enabled === "false") {
  console.log("⏸  ORCHESTRATOR_ENABLED=false — CI autofix paused. Exiting.");
  process.exit(0);
}

if (!headBranch) {
  console.log("ℹ️  No head branch on the failed run — nothing to fix. Exiting.");
  process.exit(0);
}

if (skipPrefixes.some((p) => headBranch.startsWith(p))) {
  console.log(
    `⏭  Branch "${headBranch}" matches a skip prefix (${skipPrefixes.join(", ")}) — leaving it to its own remediation. Exiting.`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gh(args: string): string {
  return execSync(`gh ${args}`, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GH_TOKEN: ghToken! },
  }).trim();
}

interface OpenPR {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  isDraft: boolean;
}

function findOpenPrForBranch(): OpenPR | null {
  try {
    const raw = gh(
      `pr list --repo ${repo} --head ${headBranch} --state open --json number,title,headRefName,baseRefName,isDraft`,
    );
    const prs: OpenPR[] = JSON.parse(raw || "[]");
    return prs[0] ?? null;
  } catch (err) {
    console.warn("⚠️  Could not list PRs for branch:", err);
    return null;
  }
}

/** Count prior `[ci-autofix]` commits on this PR (the budget counter). */
function priorAutofixCommits(prNumber: number): number {
  try {
    const raw = gh(`pr view ${prNumber} --repo ${repo} --json commits`);
    const data = JSON.parse(raw || "{}") as {
      commits?: { messageHeadline?: string; messageBody?: string }[];
    };
    return (data.commits ?? []).filter(
      (c) =>
        (c.messageHeadline ?? "").includes(MARKER) ||
        (c.messageBody ?? "").includes(MARKER),
    ).length;
  } catch (err) {
    console.warn("⚠️  Could not read PR commit history — assuming 0 prior attempts.", err);
    return 0;
  }
}

function listPrChangedFiles(prNumber: number): string[] {
  try {
    const raw = gh(`pr view ${prNumber} --repo ${repo} --json files --jq '.files[].path'`);
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** Failing logs, trimmed to the tail so the prompt stays bounded. */
function fetchFailedLogs(): string {
  const MAX_CHARS = 16000;
  let log = "";
  try {
    log = gh(`run view ${runId} --repo ${repo} --log-failed`);
  } catch {
    try {
      log = gh(`run view ${runId} --repo ${repo} --log`);
    } catch (err) {
      console.warn("⚠️  Could not fetch run logs:", err);
      return "(logs unavailable — the agent must fetch them itself)";
    }
  }
  if (log.length > MAX_CHARS) {
    log = "…(truncated)…\n" + log.slice(log.length - MAX_CHARS);
  }
  return log || "(empty log output)";
}

function commentAlreadyPosted(prNumber: number, needle: string): boolean {
  try {
    const raw = gh(`pr view ${prNumber} --repo ${repo} --json comments`);
    const data = JSON.parse(raw || "{}") as { comments?: { body?: string }[] };
    return (data.comments ?? []).some((c) => (c.body ?? "").includes(needle));
  } catch {
    return false;
  }
}

function postComment(prNumber: number, body: string): void {
  try {
    execSync(`gh pr comment ${prNumber} --repo ${repo} --body-file -`, {
      input: body,
      stdio: ["pipe", "inherit", "inherit"],
      env: { ...process.env, GH_TOKEN: ghToken! },
    });
  } catch (err) {
    console.warn("⚠️  Could not post comment:", err);
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(pr: OpenPR, attempt: number, logs: string): string {
  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  return `
You are an automated CI-repair agent for this repository.

## Your task
The **${workflowName}** check failed on PR #${pr.number} — "${pr.title}" (branch \`${pr.headRefName}\`, commit ${headSha || "HEAD"}).
Run: ${runUrl}
Diagnose the failure from the logs below, push the **smallest** fix to the PR branch so the check goes green, then stop.
This is automated remediation attempt **${attempt} of ${maxAttempts}** — make it count.

## Failing logs (tail)
\`\`\`
${logs}
\`\`\`
(If you need more, run \`gh run view ${runId} --repo ${repo} --log-failed\`.)

## Step 1 — Set up git identity
\`\`\`
git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
\`\`\`

## Step 2 — Check out the PR branch
\`\`\`
git fetch origin ${pr.headRefName}
git checkout ${pr.headRefName}
git pull origin ${pr.headRefName} --ff-only || git reset --hard origin/${pr.headRefName}
\`\`\`

## Step 3 — Load just enough context (bounded, ≤3 reads)
- \`docs/project.config.md\` — stack, v0 boundary, whether the implementation phase is enabled.
- The package/config files the failing job touches (e.g. \`package.json\`, \`turbo.json\`, the workflow file, \`vercel.json\`, tsconfig, the failing test).
- Relevant \`.cursor/rules/\` only if the fix risks crossing a governance boundary.

## Step 4 — Reproduce & fix
- Identify the **root cause** from the logs (failed command + first real error — ignore noise after it).
- Apply the minimal change that fixes that root cause. Prefer config/build/lint/type/test fixes scoped to the failure.
- If the failure is a genuine test assertion about product behavior, fix the code so the test passes — do **not** delete or weaken the test to go green.
- When practical, reproduce locally before pushing (e.g. \`pnpm install\` then the failing task such as \`pnpm run build\` / \`pnpm run lint\` / \`pnpm run typecheck\` / \`pnpm run test\`).

## Step 5 — Commit & push (REQUIRED marker)
The commit subject **must** contain \`${MARKER}\` — it is the loop-budget counter; without it the fix won't be counted and the safety limit breaks.
\`\`\`
git add -A
git commit -m "fix(ci): ${MARKER} <one-line description of the fix>"
git push origin ${pr.headRefName}
\`\`\`

## Hard constraints
- **Scope:** fix only what made ${workflowName} fail. No unrelated refactors, no scope creep, respect the v0 boundary.
- **Do not** touch \`.cursor/**\`, \`docs/state/**\`, \`docs/product/**\`, or \`docs/product-decisions/**\` unless one of those files is the *actual* cause of the failure.
- **Never** force-push, never commit to \`${pr.baseRefName}\`, never merge/close/approve the PR.
- **Never** disable a check or test just to make CI pass.
- If you cannot fix it confidently (ambiguous root cause, needs a product/architecture decision, missing secret/credential, or the failure is in the CI infra itself), do **not** guess: post a comment with
  \`gh pr comment ${pr.number} --repo ${repo} --body "..."\` that starts with \`NEED_HUMAN:\` and states exactly what a human must decide, then stop.
`.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const pr = findOpenPrForBranch();

if (!pr) {
  console.log(`ℹ️  No open PR for branch "${headBranch}" — nothing to fix. Exiting.`);
  process.exit(0);
}

console.log(`\n🔧 ${workflowName} failed on PR #${pr.number} — "${pr.title}" (${pr.headRefName}).`);

const priorAttempts = priorAutofixCommits(pr.number);
const attempt = priorAttempts + 1;

if (priorAttempts >= maxAttempts) {
  console.log(
    `🛑 Budget exhausted: ${priorAttempts} prior [ci-autofix] commit(s) ≥ MAX_CI_AUTOFIX_ATTEMPTS (${maxAttempts}).`,
  );
  const needle = `NEED_HUMAN: ${MARKER} budget exhausted`;
  if (!commentAlreadyPosted(pr.number, needle)) {
    postComment(
      pr.number,
      `${needle} — automated remediation tried ${priorAttempts} time(s) and **${workflowName}** is still failing.\n\n` +
        `Latest failing run: https://github.com/${repo}/actions/runs/${runId}\n\n` +
        `A human needs to look at this one. Raise \`MAX_CI_AUTOFIX_ATTEMPTS\` to allow more attempts, or fix it manually and push.`,
    );
  } else {
    console.log("ℹ️  NEED_HUMAN budget comment already present — not duplicating.");
  }
  process.exit(0);
}

const changedFiles = listPrChangedFiles(pr.number);
const { modelId, tier, matchedPaths } = pickCiAutofixModel(changedFiles);
if (tier === "sensitive") {
  console.log(
    `🛡  Vision tier (${modelId}) — PR touches sensitive paths: ${matchedPaths.slice(0, 5).join(", ")}${
      matchedPaths.length > 5 ? `, +${matchedPaths.length - 5} more` : ""
    }`,
  );
} else {
  console.log(`🔧 Manager tier (${modelId}) — attempt ${attempt}/${maxAttempts}.`);
}

const logs = fetchFailedLogs();
const prompt = buildPrompt(pr, attempt, logs);

try {
  const result = await Agent.prompt(prompt, buildCursorCloudOptions(apiKey!, repo!, modelId));
  if (result.status === "error") {
    console.error(`❌ Agent run failed for PR #${pr.number}. Check the Cursor dashboard.`);
    process.exit(2);
  }
  console.log(`✅ CI autofix agent completed for PR #${pr.number} (attempt ${attempt}/${maxAttempts}).`);
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
}
