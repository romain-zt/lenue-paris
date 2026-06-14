/**
 * Shared Cursor cloud SDK options for the CI scripts in this directory.
 *
 * Two important bits of routing happen here:
 *
 *  1. **Model selection** is supplied per-call as a canonical
 *     `ModelSelection = { id, params }` from `cursor-models.config.ts` — the
 *     single source of truth aligned with `.cursor/core/rules/20-model-routing.mdc`.
 *     We do NOT use `id: "default"` (server-picks-auto) anywhere because that
 *     silently falls back to the account default model (gpt-5.5 for this repo)
 *     and bypasses the tier doctrine.
 *
 *  2. **Subagent router** is wired automatically via `agents` so every cloud
 *     run can `Task`-delegate to an `executor` (composer-2.5) or `vision-reviewer`
 *     (claude-opus-4-8). Definitions live in `cursor-subagents.config.ts`.
 *
 * Project-agnostic.
 */

import type { AgentOptions, ModelSelection } from "@cursor/sdk";
import { getSubagentDefinitions } from "./cursor-subagents.config";

/**
 * Sanity-check a {@link ModelSelection} before we hand it to the SDK. The
 * Cloud API rejects partial / unknown variant matches with `[invalid_model]`,
 * which is hard to debug when surfaced from inside `Agent.create`. We catch
 * the obvious cases here (empty id, duplicated/empty/non-string params) and
 * surface a clear error pointing at the discovery / validation tooling.
 *
 * For exhaustive validation against the live API, run the
 * `validate-cursor-models.ts` script (CI does this on every PR touching the
 * model config).
 */
function assertModelSelectionShape(model: ModelSelection): void {
  if (!model?.id?.trim()) {
    throw new Error(
      "buildCursorCloudOptions: model.id is required — import a tier from .github/scripts/core/cursor-models.config.ts",
    );
  }
  if (model.params !== undefined && !Array.isArray(model.params)) {
    throw new Error(
      `buildCursorCloudOptions: model.params for '${model.id}' must be an array of { id, value }.`,
    );
  }
  const seen = new Set<string>();
  for (const p of model.params ?? []) {
    if (!p?.id?.trim() || typeof p.value !== "string") {
      throw new Error(
        `buildCursorCloudOptions: model '${model.id}' has a malformed param ${JSON.stringify(p)}.`,
      );
    }
    if (seen.has(p.id)) {
      throw new Error(
        `buildCursorCloudOptions: model '${model.id}' has duplicate param id '${p.id}'.`,
      );
    }
    seen.add(p.id);
  }
}

export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
  model: ModelSelection,
): AgentOptions {
  assertModelSelectionShape(model);
  for (const def of Object.values(getSubagentDefinitions())) {
    if (def.model && def.model !== "inherit") assertModelSelectionShape(def.model);
  }
  return {
    apiKey,
    model,
    cloud: {
      repos: [{ url: `https://github.com/${repoSlug}` }],
      autoCreatePR: false,
      skipReviewerRequest: true,
    },
    agents: getSubagentDefinitions(),
  };
}
