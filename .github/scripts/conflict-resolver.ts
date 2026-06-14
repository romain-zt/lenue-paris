/**
 * conflict-resolver.ts
 *
 * Invoked by conflict-resolver.yml whenever the base branch advances or on a cron.
 * For every open non-draft PR with CONFLICTING merge status it spawns one Cursor
 * cloud agent that merges the base branch into the PR branch and resolves conflicts
 * intelligently before pushing.
 *
 * Smarter than a blind `--ours` rebase: the agent understands file-level intent
 * (state files take base, lockfiles are regenerated, source is merged carefully).
 * Project-agnostic.
 */

import { Agent, CursorAgentError } from "@cursor/sdk";
import { buildCursorCloudOptions } from "./cursor-sdk-options";
import { formatPickedModel, pickConflictResolverModel } from "./cursor-models.config";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const apiKey = process.env.CURSOR_API_KEY;
const ghToken = process.env.GH_TOKEN;
const repo = process.env.REPO;
const baseBranch = (process.env.BASE_BRANCH ?? "main").trim() || "main";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gh(args: string): string {
  return execSync(`gh ${args}`, {
    encoding: "utf8",
    env: { ...process.env, GH_TOKEN: ghToken! },
  }).trim();
}

interface ConflictedPR {
  number: number;
  headRefName: string;
  title: string;
  isDraft: boolean;
}

function listConflictedPRs(): ConflictedPR[] {
  // GitHub's mergeability computation can lag — retry once with a short wait.
  let raw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    raw = gh(
      `pr list --repo ${repo} --state open --base ${baseBranch} --json number,headRefName,title,isDraft,mergeable --jq '[.[] | select(.mergeable == "CONFLICTING")]'`,
    );
    const prs: ConflictedPR[] = JSON.parse(raw || "[]");
    if (prs.length > 0 || attempt === 1) return prs;
    console.log("⏳  No conflicted PRs yet — waiting 15s for GitHub to catch up…");
    execSync("sleep 15");
  }
  return JSON.parse(raw || "[]");
}

/**
 * List every file changed in a PR (vs its base) — used to decide whether the
 * conflict resolver should run at Manager or Vision tier.
 *
 * Falls back to an empty list on failure: the caller treats that as "default
 * tier" (Manager). The downside of a missed sensitive-path escalation is small
 * — the agent still has full repo access and the same prompt rules.
 */
function listPrChangedFiles(prNumber: number): string[] {
  try {
    const raw = gh(`pr view ${prNumber} --repo ${repo} --json files --jq '.files[].path'`);
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch (err) {
    console.warn(`⚠️  Could not list files for PR #${prNumber} — defaulting to Manager tier.`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Per-PR conflict resolution prompt
// ---------------------------------------------------------------------------

function buildPrompt(pr: ConflictedPR): string {
  return `
You are an automated conflict-resolution agent for this repository.

## Your task
PR #${pr.number} — "${pr.title}" — has merge conflicts with \`${baseBranch}\`.
Resolve those conflicts and push a clean merge commit so the PR becomes mergeable.
Then stop. Do NOT review code quality, suggest refactors, or merge the PR itself.

## Step 1 — Set up git identity
\`\`\`
git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"
\`\`\`

## Step 2 — Fetch and check out the branch
\`\`\`
git fetch origin ${baseBranch} ${pr.headRefName}
git checkout ${pr.headRefName}
git pull origin ${pr.headRefName} --ff-only || git reset --hard origin/${pr.headRefName}
\`\`\`

## Step 3 — Merge origin/${baseBranch}
\`\`\`
git merge origin/${baseBranch} --no-edit
\`\`\`
If the merge is clean, skip to Step 6.

## Step 4 — Identify conflicted files
\`\`\`
git diff --name-only --diff-filter=U
\`\`\`

Read each conflicted file. Resolve using these rules, in priority order:

1. **\`docs/state/tracking/*.md\`** — keep the **branch** version (per-run orchestrator stubs; the branch's stub is active).
2. **\`docs/state/status.json\`** — keep \`origin/${baseBranch}\` as the base and layer on top any keys that exist only on the branch (e.g. a new step in \`orchestration.steps\`). Never discard either side's unique keys.
3. **\`docs/state/orchestration.*.json\`** and other orchestration state — take \`origin/${baseBranch}\` (most current pipeline state).
4. **\`docs/state/HANDOFF.md\`** — take the longer / more detailed version; never shrink it. If both sides added different sections, include both.
5. **Lockfiles (\`pnpm-lock.yaml\`, \`package-lock.json\`, \`yarn.lock\`)** — regenerate with the repo's package manager (e.g. \`pnpm install --frozen-lockfile=false\`); take whatever it produces.
6. **\`.cursor/**\` governance files** — take \`origin/${baseBranch}\` (more authoritative).
7. **Source code (\`apps/**\`, \`packages/**\`, \`src/**\`)** — read both sides carefully and take the more complete / newer implementation, keeping additions from both sides where they don't conflict in intent.
8. **Any other file** — read both sides, pick the more complete one. If genuinely ambiguous, leave a clear TODO comment and take \`origin/${baseBranch}\`'s version.

After editing each file to remove all \`<<<<<<<\`, \`=======\`, \`>>>>>>>\` markers:
\`\`\`
git add <file>
\`\`\`

## Step 5 — Continue merge
\`\`\`
git merge --continue --no-edit
\`\`\`
or if that's unavailable:
\`\`\`
git commit --no-edit -m "chore(merge): resolve ${baseBranch} into ${pr.headRefName}"
\`\`\`

## Step 6 — Push
\`\`\`
git push origin ${pr.headRefName}
\`\`\`

## Step 7 — Verify
\`\`\`
gh pr view ${pr.number} --repo ${repo} --json mergeable --jq '.mergeable'
\`\`\`
If \`MERGEABLE\`, print "✅ PR #${pr.number} is now conflict-free." If still \`CONFLICTING\`, re-read the remaining files and fix them. If \`UNKNOWN\`, wait 10s and check again.

## Important constraints
- Never force-push to \`${baseBranch}\`.
- Never close, delete, or merge the PR — conflict resolution only.
- If you cannot resolve a conflict without human intent, post a comment via
  \`gh pr comment ${pr.number} --repo ${repo} --body "..."\` explaining exactly which file/hunk needs human input, then stop.
`.trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const conflicted = listConflictedPRs();

if (conflicted.length === 0) {
  console.log("✅ No conflicted PRs found — nothing to do.");
  process.exit(0);
}

console.log(`\n🔧 Found ${conflicted.length} conflicted PR(s):`);
for (const pr of conflicted) {
  console.log(`  • PR #${pr.number} — ${pr.title} (${pr.headRefName})`);
}

let anyFailed = false;

for (const pr of conflicted) {
  console.log(`\n━━━ Resolving PR #${pr.number}: ${pr.title} ━━━`);

  const changedFiles = listPrChangedFiles(pr.number);
  const picked = pickConflictResolverModel(changedFiles);

  if (picked.sensitivity === "sensitive") {
    const matched = picked.matchedPaths ?? [];
    console.log(
      `🛡  Escalating to ${formatPickedModel(picked)} — sensitive paths touched: ${matched
        .slice(0, 5)
        .join(", ")}${matched.length > 5 ? `, +${matched.length - 5} more` : ""}`,
    );
  } else {
    console.log(`🔧 ${formatPickedModel(picked)} — no sensitive paths in this PR.`);
  }

  const prompt = buildPrompt(pr);

  try {
    const result = await Agent.prompt(prompt, buildCursorCloudOptions(apiKey!, repo!, picked.modelSelection));

    if (result.status === "error") {
      console.error(`❌ Agent failed for PR #${pr.number}.`);
      anyFailed = true;
    } else {
      console.log(`✅ Agent completed for PR #${pr.number}.`);
    }
  } catch (err) {
    if (err instanceof Error) {
      const retryable =
        err instanceof CursorAgentError
          ? (err as Error & { isRetryable?: boolean }).isRetryable ?? false
          : false;
      console.error(`❌ Agent could not start for PR #${pr.number}: ${err.message} (retryable=${retryable})`);
    } else {
      console.error(`❌ Unexpected error for PR #${pr.number}:`, err);
    }
    anyFailed = true;
  }
}

process.exit(anyFailed ? 1 : 0);
