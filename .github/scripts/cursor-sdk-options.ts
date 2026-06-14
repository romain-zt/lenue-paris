/**
 * Shared Cursor cloud SDK options for the CI scripts in this directory.
 *
 * The model is supplied per-call by each script from
 * `.github/scripts/cursor-models.config.ts` — the single source of truth aligned
 * with `.cursor/rules/20-model-routing.mdc`. No env-var fallback by design: the
 * mapping must live next to the code it governs.
 *
 * Project-agnostic.
 */
export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
  modelId: string,
): {
  apiKey: string;
  model: { id: string };
  cloud: { repos: { url: string }[]; autoCreatePR: boolean; skipReviewerRequest: boolean };
} {
  if (!modelId?.trim()) {
    throw new Error(
      "buildCursorCloudOptions: modelId is required — import from .github/scripts/cursor-models.config.ts",
    );
  }
  return {
    apiKey,
    model: { id: modelId.trim() },
    cloud: {
      repos: [{ url: `https://github.com/${repoSlug}` }],
      autoCreatePR: false,
      skipReviewerRequest: true,
    },
  };
}
