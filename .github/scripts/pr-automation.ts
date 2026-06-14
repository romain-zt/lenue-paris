/**
 * pr-automation.ts
 *
 * Fires a Cursor cloud agent that reviews and (if clean) squash-merges a PR.
 * Project-agnostic: the agent reads docs/project.config.md + docs/state/HANDOFF.md
 * and enforces whatever .cursor/rules/ the cloned template ships — no hardcoded
 * project name, stack, or rule numbers.
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { formatPickedModel, pickPrReviewModel } from "./cursor-models.config";
import { execSync } from "node:child_process";

// --- Environment -----------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const ghToken = process.env.GH_TOKEN;
const prNumber = process.env.PR_NUMBER;
const prDraft = process.env.PR_DRAFT === "true";
const repo = process.env.REPO; // e.g. "org/repo"
const baseBranch = process.env.BASE_BRANCH ?? "main";
const headBranch = process.env.HEAD_BRANCH ?? "";
const prSha = process.env.PR_SHA ?? "";
const requiredChecks = process.env.REQUIRED_CHECKS ?? "quality";

if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set. Add it as a GitHub Actions secret.");
  process.exit(1);
}
if (!ghToken) {
  console.error("❌ GH_TOKEN is not set.");
  process.exit(1);
}
if (!prNumber || !repo) {
  console.error("❌ PR_NUMBER or REPO env vars are missing.");
  process.exit(1);
}

// --- Required CI gate (workflow also waits; belt-and-suspenders) ------------

function assertRequiredChecks(): void {
  console.log(`⏳ Verifying required checks (${requiredChecks})…`);
  execSync("bash .github/scripts/wait-for-required-pr-checks.sh", {
    stdio: "inherit",
    env: {
      ...process.env,
      GH_TOKEN: ghToken,
      REPO: repo,
      PR_NUMBER: prNumber,
      PR_SHA: prSha,
      REQUIRED_CHECKS: requiredChecks,
      WAIT_MODE: "strict",
    },
  });
}

assertRequiredChecks();

// --- Undraft if needed -----------------------------------------------------

if (prDraft) {
  console.log(`📋 PR #${prNumber} is a draft — converting to ready-for-review…`);
  try {
    execSync(`gh pr ready ${prNumber}`, {
      stdio: "inherit",
      env: { ...process.env, GH_TOKEN: ghToken },
    });
    console.log("✅ PR marked as ready for review.");
  } catch (err) {
    console.error("⚠️  Could not undraft PR:", err);
    // Non-fatal — proceed with review anyway.
  }
}

// --- Prompt ----------------------------------------------------------------

const prompt = `
You are a senior automated reviewer and merge bot for this repository.

## Context
- PR number: ${prNumber}
- Repository: ${repo}
- Base branch: ${baseBranch}
- Head branch: ${headBranch}
- Required checks: ${requiredChecks}

## Step 1 — Load project context (bounded)
Read, in at most 3 tool calls:
- \`docs/project.config.md\` — project identity, stack overrides, v0 boundary, whether the implementation phase is enabled.
- \`docs/state/HANDOFF.md\` — current architecture, active work, known issues.
- \`.cursor/rules/\` — the active governance rules this PR must satisfy. Do not deep-audit; just identify the load-bearing constraints.

## Step 2 — Verify CI (mandatory)
Run \`gh pr checks ${prNumber}\`. Every required check (${requiredChecks}) must be **pass** on the latest commit.
If any is pending, failing, or missing: post a comment explaining which check blocks merge and **stop** — do not approve or merge.

## Step 3 — Review the PR diff
Run \`gh pr diff ${prNumber}\` and check against the rules you loaded in Step 1. In particular:

1. **Governance boundaries** — respect the architecture baseline and any boundary/layering rules in \`.cursor/rules/\`. Do not let the diff violate them.
2. **Scope** — the change should stay inside the Spec / Scope Slice it claims to implement (no scope creep, no unrelated refactors). Respect the v0 boundary in \`docs/project.config.md\`.
3. **Tests** — per \`.cursor/rules/30-test-strategy.mdc\`: behavior changes need tests; prefer contract/integration/unit over e2e. Flag missing tests.
4. **PR size** — flag oversized PRs; do not hard-block on size alone unless a rule says so.
5. **Merge conflicts** — run \`git merge-tree $(git merge-base HEAD origin/${baseBranch}) HEAD origin/${baseBranch}\` to surface conflicts. If conflicts exist and both sides are clearly equivalent, resolve them and push to the head branch. If intent is ambiguous, post a comment explaining each conflict and stop — do NOT merge.

## Step 4 — Decision

**If review passes AND no ambiguous conflicts:**
- Approve: \`gh pr review ${prNumber} --approve --body "✅ Automated review passed. Approving for squash merge."\`
- Merge:  \`gh pr merge ${prNumber} --squash --auto\`
- Exit with a success summary.

**If review finds small, mechanical, unambiguous fixes** (a missing import, a type annotation, a missing test for an obvious case):
- Push the fixes to the head branch, re-run the checks, then approve and merge if green.

**If review is blocked** (ambiguous conflict, security concern, rule violation you cannot safely auto-fix, permission error):
- Post a comment via \`gh pr comment ${prNumber} --body "..."\` explaining the specific blocker and exactly what a human must do.
- Do NOT approve or merge. Exit with a clear explanation printed to stdout.

## Important notes
- If \`gh pr merge\` fails due to insufficient permissions, print "⚠️  GH_TOKEN lacks merge permission — PR approved but not merged. A repo admin must complete the merge." and exit cleanly.
- Never force-push to \`${baseBranch}\`. Never commit directly to \`${baseBranch}\`. Never close or delete the PR.
- Do not spend the whole run reading: after Step 1 + the diff, make a decision.
`.trim();

// --- Run -------------------------------------------------------------------

try {
  const picked = pickPrReviewModel();
  console.log(`🤖 Firing Cursor cloud agent for PR review — model: ${formatPickedModel(picked)}`);
  const result = await Agent.prompt(
    prompt,
    buildCursorCloudOptions(apiKey!, repo, picked.modelSelection),
  );

  if (result.status === "error") {
    console.error(`\n❌ Agent run failed. Check the Cursor dashboard for details.`);
    process.exit(2);
  }

  console.log(`\n✅ PR automation completed successfully.`);
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
}
