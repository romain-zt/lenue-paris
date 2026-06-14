/**
 * Per-tier model selection for Cursor cloud agent invocations from CI.
 *
 * Single source of truth, aligned with .cursor/rules/20-model-routing.mdc:
 *
 *   Vision   → claude-opus-4-8     (strategy, irreversible/high-stakes decisions)
 *   Manager  → claude-sonnet-4-6   (planning, scoping, splitting work into bricks)
 *   Executor → composer-2.5        (mechanical edits, scaffolding from approved spec)
 *
 * These are the canonical Cloud API model ids returned by `Cursor.models.list()`.
 * The `params` array carries the variant settings (thinking, context, effort, fast)
 * — the same knobs you tune in the IDE picker.
 *
 * Why NOT just pass `"auto"` / `{ id: "default" }`:
 *   - The server's "auto" picks whatever is the user's account default — in this
 *     repo that's gpt-5.5 — which silently bypasses the tier doctrine. Using
 *     canonical ids per tier makes routing deterministic and reviewable.
 *   - Compound strings like `"claude-opus-4-8-thinking-high"` are not real Cloud
 *     API ids. The API expects `id: "claude-opus-4-8"` plus `params: [...]`.
 *
 * Why a constants file (not env vars / Actions Variables) for the structure:
 *   - Grep-able and type-checked at build time.
 *   - Reviewed in PRs alongside the script that uses it.
 *   - Impossible to skew silently via stale repo variables.
 *
 * Why env vars for the *id* values:
 *   - Cursor periodically ships new model versions (sonnet 4.7, opus 4.9, …).
 *     Repo variables (`vars.CURSOR_MODEL_<TIER>_ID`) let you bump the version
 *     without a code change. The variant params are kept in code because they
 *     map 1:1 to the routing doctrine and shouldn't drift per repo.
 *
 * Discovery:
 *   - Run the `Discover Cursor Models` workflow (or
 *     `tsx .github/scripts/discover-cursor-models.ts`) with `CURSOR_API_KEY`
 *     set to print every valid `{ id, params, isDefault }` for your account.
 */

import type { ModelSelection } from "@cursor/sdk";

/** Canonical params for each tier. Kept in code so the routing doctrine is
 *  reviewable; only the model `id` is overridable via env var. */
const TIER_PARAMS = {
  vision: [
    { id: "thinking", value: "true" },
    { id: "context", value: "1m" },
    { id: "effort", value: "high" },
  ],
  manager: [
    { id: "thinking", value: "true" },
    { id: "context", value: "1m" },
    { id: "effort", value: "medium" },
  ],
  executor: [
    { id: "fast", value: "true" },
  ],
} as const;

const DEFAULT_TIER_IDS = {
  vision: "claude-opus-4-8",
  manager: "claude-sonnet-4-6",
  executor: "composer-2.5",
} as const;

function envId(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw && raw.trim() ? raw.trim() : fallback;
}

export const TIER_MODELS: {
  vision: ModelSelection;
  manager: ModelSelection;
  executor: ModelSelection;
} = {
  vision: {
    id: envId("CURSOR_MODEL_VISION_ID", DEFAULT_TIER_IDS.vision),
    params: [...TIER_PARAMS.vision],
  },
  manager: {
    id: envId("CURSOR_MODEL_MANAGER_ID", DEFAULT_TIER_IDS.manager),
    params: [...TIER_PARAMS.manager],
  },
  executor: {
    id: envId("CURSOR_MODEL_EXECUTOR_ID", DEFAULT_TIER_IDS.executor),
    params: [...TIER_PARAMS.executor],
  },
};

export type Tier = keyof typeof TIER_MODELS;

/**
 * Per-script model-tier assignment, aligned with .cursor/rules/20-model-routing.mdc.
 * Each entry resolves to one of the three canonical tiers above. Sensitive
 * variants (paths in SENSITIVE_*_GLOBS below) escalate one tier.
 */
export const SCRIPT_TIERS = {
  /**
   * pr-automation.ts — reviews PR against .cursor/rules and squash-merges.
   * Routine review work → Manager.
   */
  prReview: "manager",

  /**
   * phase-orchestrator.ts (worker mode) — picks the smallest coherent layer
   * for one Scope Slice and sub-delegates the actual typing to the Executor
   * subagent (see cursor-subagents.config.ts). The worker IS the per-step
   * router → Manager.
   */
  orchestratorWorker: "manager",

  /**
   * prd-decomposer.ts — drives the full PRD → Feature Area → Scope Slice
   * decomposition chain autonomously. Commits durable product-scope decisions
   * that directly feed implementation, so per the doctrine ("irreversible or
   * strategic → Vision") it runs at Vision tier.
   */
  prdDecomposer: "vision",

  /**
   * conflict-resolver.ts — file-level merge judgment.
   *   - `default`   → Manager  (most PRs: source / lockfile / docs).
   *   - `sensitive` → Vision   (governance, pipeline state, product decomposition).
   */
  conflictResolver: { default: "manager", sensitive: "vision" },

  /**
   * ci-failure-autofix.ts — reads a failed CI/E2E run and pushes the smallest fix.
   *   - `default`   → Manager  (build/lint/test/config).
   *   - `sensitive` → Vision   (governance / pipeline state / product decomposition).
   */
  ciAutofix: { default: "manager", sensitive: "vision" },
} as const;

/**
 * If any conflicted file path matches one of these prefixes, conflict-resolver.ts
 * escalates from Manager to Vision tier. Cheap startsWith() prefix matching.
 */
export const SENSITIVE_CONFLICT_GLOBS = [
  ".cursor/",
  "docs/state/",
  "docs/product/",
  "docs/product-decisions/",
] as const;

function pickTierBySensitivity(
  filePaths: readonly string[],
  tiers: { default: Tier; sensitive: Tier },
): { tier: Tier; matchedPaths: string[]; sensitivity: "default" | "sensitive" } {
  const matchedPaths = filePaths.filter((f) =>
    SENSITIVE_CONFLICT_GLOBS.some((g) => f.startsWith(g)),
  );
  if (matchedPaths.length > 0) {
    return { tier: tiers.sensitive, matchedPaths, sensitivity: "sensitive" };
  }
  return { tier: tiers.default, matchedPaths: [], sensitivity: "default" };
}

export interface PickedModel {
  modelSelection: ModelSelection;
  tier: Tier;
  /** "default" / "sensitive" — only relevant for sensitivity-aware pickers. */
  sensitivity?: "default" | "sensitive";
  matchedPaths?: string[];
}

function tierModel(tier: Tier): ModelSelection {
  return TIER_MODELS[tier];
}

/** PR review (pr-automation.ts). */
export function pickPrReviewModel(): PickedModel {
  const tier = SCRIPT_TIERS.prReview as Tier;
  return { modelSelection: tierModel(tier), tier };
}

/** PRD decomposer (prd-decomposer.ts). */
export function pickPrdDecomposerModel(): PickedModel {
  const tier = SCRIPT_TIERS.prdDecomposer as Tier;
  return { modelSelection: tierModel(tier), tier };
}

/** Phase orchestrator worker (phase-orchestrator.ts). */
export function pickOrchestratorWorkerModel(): PickedModel {
  const tier = SCRIPT_TIERS.orchestratorWorker as Tier;
  return { modelSelection: tierModel(tier), tier };
}

/** Conflict resolver (conflict-resolver.ts). Escalates on sensitive paths. */
export function pickConflictResolverModel(filePaths: readonly string[]): PickedModel {
  const tiers = SCRIPT_TIERS.conflictResolver as { default: Tier; sensitive: Tier };
  const { tier, matchedPaths, sensitivity } = pickTierBySensitivity(filePaths, tiers);
  return { modelSelection: tierModel(tier), tier, sensitivity, matchedPaths };
}

/** CI failure autofix (ci-failure-autofix.ts). Same sensitivity logic as conflicts. */
export function pickCiAutofixModel(filePaths: readonly string[]): PickedModel {
  const tiers = SCRIPT_TIERS.ciAutofix as { default: Tier; sensitive: Tier };
  const { tier, matchedPaths, sensitivity } = pickTierBySensitivity(filePaths, tiers);
  return { modelSelection: tierModel(tier), tier, sensitivity, matchedPaths };
}

/** Pretty-print helper for logs (e.g. "manager (claude-sonnet-4-6, thinking=true, effort=medium)"). */
export function formatPickedModel(picked: PickedModel): string {
  const params = (picked.modelSelection.params ?? [])
    .map((p) => `${p.id}=${p.value}`)
    .join(", ");
  const suffix = picked.sensitivity ? ` [${picked.sensitivity}]` : "";
  return `${picked.tier}${suffix} (${picked.modelSelection.id}${params ? `, ${params}` : ""})`;
}
