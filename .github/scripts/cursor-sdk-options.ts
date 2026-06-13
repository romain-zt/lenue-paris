/**
 * Shared Cursor cloud SDK options for the CI scripts in this directory.
 *
 * Model is overridable per-repo via the `CURSOR_AGENT_MODEL` Actions variable
 * (Settings → Secrets and variables → Actions → Variables). If unset, falls back
 * to a fast default. Keep this project-agnostic.
 */
const DEFAULT_AGENT_MODEL_ID = "composer-2.5";

export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
): {
  apiKey: string;
  model: { id: string };
  cloud: { repos: { url: string }[]; autoCreatePR: boolean; skipReviewerRequest: boolean };
} {
  const modelId = process.env.CURSOR_AGENT_MODEL?.trim() || DEFAULT_AGENT_MODEL_ID;
  const cloud = {
    repos: [{ url: `https://github.com/${repoSlug}` }],
    autoCreatePR: false,
    skipReviewerRequest: true,
  };
  return { apiKey, model: { id: modelId }, cloud };
}
