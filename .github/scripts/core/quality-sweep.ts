/**
 * quality-sweep.ts
 *
 * Scheduled maintenance pass. Fires a Cursor cloud agent (Manager tier) that:
 *   1. runs the repo's quality checks,
 *   2. finds the TOP code-quality / refactor / cleanup / plan-hygiene issues,
 *   3. makes ONE small, safe batch of improvements (delegating typing to the
 *      Executor subagent), and
 *   4. opens a DRAFT PR — never merges.
 *
 * Bounded and opt-out-able: respects ORCHESTRATOR_ENABLED and never rewrites the
 * world. Project-agnostic — the agent reads docs/project.config.md + .cursor rules.
 *
 * Env: CURSOR_API_KEY, REPO, GH_TOKEN, [ORCHESTRATOR_ENABLED], [SWEEP_BASE].
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { formatPickedModel, pickQualitySweepModel } from "./cursor-models.config";

const apiKey = process.env.CURSOR_API_KEY;
const repo = process.env.REPO;
const ghToken = process.env.GH_TOKEN;
const baseBranch = (process.env.SWEEP_BASE ?? "main").trim() || "main";
const orchestratorEnabled = process.env.ORCHESTRATOR_ENABLED !== "false";

if (!orchestratorEnabled) {
  console.log("⏸️  ORCHESTRATOR_ENABLED=false — quality sweep paused.");
  process.exit(0);
}
if (!apiKey) {
  console.error("❌ CURSOR_API_KEY is not set.");
  process.exit(1);
}
if (!repo) {
  console.error("❌ REPO env var is missing.");
  process.exit(1);
}
if (!ghToken) {
  console.error("❌ GH_TOKEN is not set.");
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 10);
const branch = `chore/quality-sweep-${stamp}-${Date.now()}`;

const prompt = `
You are the **Quality Sweep** maintainer for this repository (Manager tier). This is a
scheduled, recurring health pass — keep it small, safe, and high-signal.

## Branch discipline (mandatory)
\`\`\`bash
git fetch origin
git checkout ${baseBranch}
git pull --ff-only origin ${baseBranch}
git checkout -b ${branch}
\`\`\`
Commit all changes to \`${branch}\` and open a **draft** PR. Never push to \`${baseBranch}\`. Never merge.

## Step 1 — Load context (bounded, ≤ 4 reads)
- \`docs/project.config.md\` (stack, v0 boundary, apps), \`docs/state/HANDOFF.md\`.
- The code-quality rules: \`.cursor/core/rules/50-code-quality.mdc\`, \`51-backend-code.mdc\`, \`52-frontend-code.mdc\`, \`30-test-strategy.mdc\`.
- Drain the input queue: \`npx --prefix .github/scripts/core tsx .github/scripts/core/inbox.ts list --open\` — fold any quality/refactor/cleanup items in (priority 0 first), and \`resolve\` the ones you action.
- List open setup gaps: \`npx --prefix .github/scripts/core tsx .github/scripts/core/framework-gap.ts list --open\` — note them in the PR backlog so the nightly audit's improver picks them up (you do not draft framework artifacts in a product sweep).

## Step 2 — Assess (run the real checks)
Run the repo's checks (typically \`pnpm typecheck\`, \`pnpm lint\`, \`pnpm test\`, \`pnpm build\` — narrowest first). Catalog the TOP issues by impact:
- code smells vs \`50-code-quality.mdc\` thresholds (over-long functions, deep nesting, dead code, magic values, copy-paste);
- markup quality vs \`52-frontend-code.mdc\` (div soup, missing semantics/landmarks, deep JSX, \`<div onClick>\`);
- backend layering vs \`51-backend-code.mdc\` (logic in boundaries, missing edge validation);
- missing tests for existing behavior; flaky/over-broad e2e where contract/integration would do;
- plan hygiene: stale \`docs/state/HANDOFF.md\`, orphaned status entries, obviously dead pipeline steps.

## Step 3 — Improve ONE small batch
Pick the **highest-impact, lowest-risk** cluster that fits one reviewable PR. Then:
- Make the fix test-first where behavior changes; delegate the actual typing to the \`executor\` subagent (composer) per \`20-model-routing.mdc\`.
- Keep it focused: behavior-preserving refactors, cleanup, and clearly-missing tests. Do NOT change product scope, architecture, or dependencies. Do NOT do a sweeping rewrite.
- For anything risky (auth/money/migration/contract/security) escalate to the \`vision-reviewer\` subagent before committing; if it's not safe to do autonomously, leave it as a written recommendation in the PR body instead.
- Re-run the checks; they must pass.

## Step 4 — Report + open the draft PR
Open a draft PR from \`${branch}\` titled \`chore(quality-sweep): <short summary>\`. In the body include:
- **Done this run** — the batch you actually changed.
- **Backlog** — the other issues you found, ranked by impact, as a checklist for future sweeps (so nothing is lost). For substantial ones, suggest a \`/btw\` priority.
\`\`\`bash
gh pr create --repo "${repo}" --base "${baseBranch}" --head "${branch}" --draft \
  --title "chore(quality-sweep): <summary>" --body-file <(printf '%s' "<body>")
\`\`\`

If the checks are already clean and there is no safe improvement to make, do not open a PR — print a short "nothing to sweep" summary and exit cleanly.

## Limits
- One focused batch. Max 1 broad exploration pass; after reading without acting, decide.
- Never merge, never push to \`${baseBranch}\`, never weaken or disable a check/test to go green.
`.trim();

try {
  const picked = pickQualitySweepModel();
  console.log(`🤖 Firing Quality Sweep agent — model: ${formatPickedModel(picked)}`);
  const result = await Agent.prompt(prompt, buildCursorCloudOptions(apiKey!, repo!, picked.modelSelection));
  if (result.status === "error") {
    console.error("\n❌ Quality sweep agent run failed. Check the Cursor dashboard.");
    process.exit(2);
  }
  console.log("\n✅ Quality sweep completed.");
  process.exit(0);
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`❌ Agent failed to start: ${err.message} (retryable=${err.isRetryable})`);
    process.exit(1);
  }
  throw err;
}
