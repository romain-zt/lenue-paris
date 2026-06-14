/**
 * Shared Cursor cloud SDK options for the CI scripts in this directory.
 *
 * Two important bits of routing happen here:
 *
 *  1. **Model selection** is supplied per-call as a canonical
 *     `ModelSelection = { id, params }` from `cursor-models.config.ts` — the
 *     single source of truth aligned with `.cursor/rules/20-model-routing.mdc`.
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

export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
  model: ModelSelection,
): AgentOptions {
  if (!model?.id?.trim()) {
    throw new Error(
      "buildCursorCloudOptions: model.id is required — import from .github/scripts/cursor-models.config.ts",
    );
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
