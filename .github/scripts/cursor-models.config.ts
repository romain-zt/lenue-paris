/**
 * Per-script model assignment for Cursor cloud agent invocations from CI.
 *
 * Single source of truth. Aligned with .cursor/rules/20-model-routing.mdc:
 *
 *   Vision   → claude-opus-4-8     (strategy, irreversible/high-stakes decisions)
 *   Manager  → claude-4.6-sonnet   (routing, planning, routine review — most CI agents)
 *   Executor → composer-2.5-fast   (smallest concrete brick; sub-delegated from a Manager)
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
  prReview: "claude-4.6-sonnet",

  /**
   * conflict-resolver.ts — file-level merge judgment.
   *   - `default`   for source / lockfile / docs conflicts (most PRs).
   *   - `sensitive` when ANY conflicted file matches SENSITIVE_CONFLICT_GLOBS:
   *     governance (.cursor/**), pipeline state (docs/state/**), or product
   *     decomposition (docs/product/**). These paths can change behaviour in
   *     subtle, hard-to-reverse ways, so the resolver escalates to Vision.
   */
  conflictResolver: {
    default: "claude-4.6-sonnet",
    sensitive: "claude-opus-4-8",
  },

  /**
   * phase-orchestrator.ts (worker mode) — picks the smallest coherent layer
   * for one Scope Slice, then sub-delegates the actual typing to Executor
   * subagents via .cursor/rules/20-model-routing.mdc. The worker IS the
   * per-step router, so it runs at Manager tier.
   */
  orchestratorWorker: "claude-4.6-sonnet",

  /**
   * prd-decomposer.ts — drives the full PRD → Feature Area → Scope Slice
   * decomposition chain autonomously (no human in the conversation) and wires
   * orchestration.prd-flow-map.json. It commits durable product-scope decisions
   * that directly feed implementation, so per 20-model-routing.mdc ("irreversible
   * or strategic → Vision") it runs at Vision tier.
   */
  prdDecomposer: "claude-opus-4-8",
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

export function pickConflictResolverModel(filePaths: readonly string[]): {
  modelId: string;
  tier: "default" | "sensitive";
  matchedPaths: string[];
} {
  const matchedPaths = filePaths.filter((f) =>
    SENSITIVE_CONFLICT_GLOBS.some((g) => f.startsWith(g)),
  );
  if (matchedPaths.length > 0) {
    return {
      modelId: CURSOR_MODELS.conflictResolver.sensitive,
      tier: "sensitive",
      matchedPaths,
    };
  }
  return {
    modelId: CURSOR_MODELS.conflictResolver.default,
    tier: "default",
    matchedPaths: [],
  };
}
