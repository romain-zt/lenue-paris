/**
 * Per-script model assignment for Cursor cloud agent invocations from CI.
 *
 * Single source of truth. Aligned with .cursor/rules/20-model-routing.mdc:
 *
 *   Vision   → claude-opus-4-8-thinking-high  (strategy, irreversible/high-stakes decisions)
 *   Manager  → "auto"                          (Cursor picks; Cloud API slug for Sonnet-tier models
 *                                               is not publicly documented — use Cursor.models.list()
 *                                               to discover the exact id for your account)
 *   Executor → composer-2.5                    (smallest concrete brick; sub-delegated from a Manager)
 *
 * These are Cursor Cloud Agent API slugs (not IDE agent frontmatter short names).
 * NOTE: Cloud API slugs differ from Cursor IDE Task tool slugs. Confirmed valid Cloud API
 * slugs: "auto", "composer-2.5", "claude-opus-4-8-thinking-high".
 *
 * Why a constants file (not env vars / Actions Variables):
 *   - Grep-able and type-checked at build time.
 *   - Reviewed in PRs alongside the script that uses it.
 *   - Impossible to skew silently via stale repo variables.
 *   - Cloud agents themselves still honour the doctrine inside the run by reading
 *     .cursor/rules/20-model-routing.mdc and delegating via Task subagents.
 */

export const CURSOR_MODELS = {
  /**
   * pr-automation.ts — reviews PR against .cursor/rules and squash-merges.
   * PRs in this repo are kept under ~20 files, so Manager is sufficient.
   */
  prReview: "auto",

  /**
   * conflict-resolver.ts — file-level merge judgment.
   *   - `default`   for source / lockfile / docs conflicts (most PRs).
   *   - `sensitive` when ANY conflicted file matches SENSITIVE_CONFLICT_GLOBS:
   *     governance (.cursor/**), pipeline state (docs/state/**), or product
   *     decomposition (docs/product/**). These paths can change behaviour in
   *     subtle, hard-to-reverse ways, so the resolver escalates to Vision.
   */
  conflictResolver: {
    default: "auto",
    sensitive: "claude-opus-4-8-thinking-high",
  },

  /**
   * phase-orchestrator.ts (worker mode) — picks the smallest coherent layer
   * for one Scope Slice, then sub-delegates the actual typing to Executor
   * subagents via .cursor/rules/20-model-routing.mdc. The worker IS the
   * per-step router, so it runs at Manager tier.
   */
  orchestratorWorker: "auto",

  /**
   * prd-decomposer.ts — drives the full PRD → Feature Area → Scope Slice
   * decomposition chain autonomously (no human in the conversation) and wires
   * orchestration.prd-flow-map.json. It commits durable product-scope decisions
   * that directly feed implementation, so per 20-model-routing.mdc ("irreversible
   * or strategic → Vision") it runs at Vision tier.
   */
  prdDecomposer: "claude-opus-4-8-thinking-high",

  /**
   * ci-failure-autofix.ts — reads a failed CI/E2E run's logs and pushes the
   * smallest fix to the PR branch.
   *   - `default`   for ordinary build/lint/test/config failures (most cases).
   *   - `sensitive` when the PR diff touches governance (.cursor/**), pipeline
   *     state (docs/state/**), or product decomposition (docs/product/**) —
   *     a wrong fix there is hard to reverse, so it escalates to Vision.
   */
  ciAutofix: {
    default: "auto",
    sensitive: "claude-opus-4-8-thinking-high",
  },
} as const;

/**
 * If any conflicted file path matches one of these prefixes, conflict-resolver.ts
 * escalates from `conflictResolver.default` (Manager) to `conflictResolver.sensitive`
 * (Vision). Keep ordered prefix-style for cheap startsWith() matching.
 */
export const SENSITIVE_CONFLICT_GLOBS = [
  ".cursor/",
  "docs/state/",
  "docs/product/",
  "docs/product-decisions/",
] as const;

function pickBySensitivity(
  filePaths: readonly string[],
  models: { default: string; sensitive: string },
): { modelId: string; tier: "default" | "sensitive"; matchedPaths: string[] } {
  const matchedPaths = filePaths.filter((f) =>
    SENSITIVE_CONFLICT_GLOBS.some((g) => f.startsWith(g)),
  );
  if (matchedPaths.length > 0) {
    return { modelId: models.sensitive, tier: "sensitive", matchedPaths };
  }
  return { modelId: models.default, tier: "default", matchedPaths: [] };
}

export function pickConflictResolverModel(filePaths: readonly string[]): {
  modelId: string;
  tier: "default" | "sensitive";
  matchedPaths: string[];
} {
  return pickBySensitivity(filePaths, CURSOR_MODELS.conflictResolver);
}

/**
 * Same sensitivity logic as the conflict resolver: a CI fix that has to touch
 * governance / pipeline-state / product files is high-stakes → Vision.
 */
export function pickCiAutofixModel(filePaths: readonly string[]): {
  modelId: string;
  tier: "default" | "sensitive";
  matchedPaths: string[];
} {
  return pickBySensitivity(filePaths, CURSOR_MODELS.ciAutofix);
}
