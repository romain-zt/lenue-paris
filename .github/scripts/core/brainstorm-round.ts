/**
 * brainstorm-round.ts — multi-participant slice round for CI (P00000 graft).
 *
 * Structural parity with `.cursor/scripts/brainstorm-chat/server.mjs`:
 *   Orchestrator routes → Spark implements → Skeptic gates → optional specialists.
 *
 * State lives in git (docs/state/*, scope slice file), not sqlite.
 * Invoked from phase-orchestrator worker before `gh pr ready` when
 *   BRAINSTORM_ROUND_ENABLED=true (default off until graft is signed).
 *
 * Round sequence (one slice):
 *   1. orchestrator — read frozen scope slice + HANDOFF; emit route + acceptance checklist
 *   2. spark       — implement within allowlist; push to tracking branch
 *   3. skeptic     — run luxury-brand-gate + slice acceptance; pass/fail only
 *   4. (optional)  — maison-lens / payload-architect when slice tags require it
 *
 * Exit codes:
 *   0 — round complete, worker may call gh pr ready
 *   1 — gate failed; remediation JSON appended to luxury-review-log
 *   2 — orchestrator blocked / NEED_HUMAN
 */

import fs from "node:fs";
import path from "node:path";
import { compileManagerAllowlist } from "./orchestrator-allowlist";

export type RoundRole = "orchestrator" | "spark" | "skeptic" | "maison-lens" | "payload-architect";

export interface RoundContext {
  repo: string;
  stepId: string;
  scopeSlicePath: string;
  trackingBranch: string;
  trackingPrNumber: number;
}

export interface RoundResult {
  ok: boolean;
  role: RoundRole;
  summary: string;
  openFloorIds?: string[];
}

const ROOT = process.cwd();

export function loadScopeSlice(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing scope slice: ${relPath}`);
  }
  return fs.readFileSync(abs, "utf8");
}

/** Build orchestrator prompt: frozen slice only — no live PRD.md */
export function buildOrchestratorRoundPrompt(ctx: RoundContext): string {
  const slice = loadScopeSlice(ctx.scopeSlicePath);
  const allowlist = compileManagerAllowlist({
    repoRoot: ROOT,
    scopeSliceFile: ctx.scopeSlicePath,
    basePrompt: slice,
  });
  if (!allowlist.ok) {
    throw new Error(`Allowlist compile failed: ${allowlist.reason}`);
  }
  return `# Orchestrator round — ${ctx.stepId}

You route specialists for this frozen scope slice only. Do not read docs/prd/PRD.md.

## Scope slice (binding)
${slice}

## Branch
Tracking PR #${ctx.trackingPrNumber} on \`${ctx.trackingBranch}\`.

## Routing
1. Spark implements within the slice allowlist on the tracking branch.
2. Skeptic runs \`luxury-brand-gate --diff apps/web\` and slice acceptance; floors hard-fail.
3. Reply with ROUTE: spark | skeptic | wait and one paragraph of guidance.
`;
}

export function buildSparkRoundPrompt(ctx: RoundContext): string {
  const slice = loadScopeSlice(ctx.scopeSlicePath);
  return `# Spark — implement slice ${ctx.stepId}

${slice}

Implement only paths in the slice allowlist. Commit and push to \`${ctx.trackingBranch}\`.
Run tests and luxury-brand-gate before handoff to Skeptic.
`;
}

export function buildSkepticRoundPrompt(ctx: RoundContext): string {
  return `# Skeptic — gate slice ${ctx.stepId}

Verify on disk:
- luxury-brand-gate --diff apps/web exits 0, llm_calls: 0
- Slice acceptance criteria in ${ctx.scopeSlicePath}
- No forbidden paths outside allowlist

Reply PASS or FAIL with structured floor rows. FAIL blocks gh pr ready.
`;
}

/** CI entry — dispatches cloud agents in sequence (wired in phase-orchestrator). */
export async function runBrainstormRound(
  ctx: RoundContext,
  dispatch: (role: RoundRole, prompt: string) => Promise<string>,
): Promise<RoundResult> {
  const orchReply = await dispatch("orchestrator", buildOrchestratorRoundPrompt(ctx));
  if (/ROUTE:\s*wait/i.test(orchReply)) {
    return { ok: false, role: "orchestrator", summary: "Orchestrator requested human wait" };
  }

  await dispatch("spark", buildSparkRoundPrompt(ctx));
  const skepticReply = await dispatch("skeptic", buildSkepticRoundPrompt(ctx));

  if (/^\s*FAIL/i.test(skepticReply)) {
    return { ok: false, role: "skeptic", summary: skepticReply };
  }

  return { ok: true, role: "skeptic", summary: skepticReply || "PASS" };
}

// CLI smoke: tsx brainstorm-round.ts --step orch-selection-ux--p0-primary-cta --slice docs/product/scope-slices/selection-ux--p0-primary-cta.md
if (import.meta.url === `file://${process.argv[1]}`) {
  const stepIdx = process.argv.indexOf("--step");
  const sliceIdx = process.argv.indexOf("--slice");
  const stepId = stepIdx >= 0 ? process.argv[stepIdx + 1] : "orch-selection-ux--p0-primary-cta";
  const scopeSlicePath =
    sliceIdx >= 0 ? process.argv[sliceIdx + 1] : "docs/product/scope-slices/selection-ux--p0-primary-cta.md";

  console.log("--- orchestrator prompt (preview) ---\n");
  console.log(
    buildOrchestratorRoundPrompt({
      repo: process.env.REPO ?? "romain-zt/lenue-paris",
      stepId,
      scopeSlicePath,
      trackingBranch: "feat/example",
      trackingPrNumber: 0,
    }).slice(0, 1200),
  );
  console.log("\n--- end preview ---");
}
