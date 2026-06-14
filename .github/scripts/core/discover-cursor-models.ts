/**
 * discover-cursor-models.ts
 *
 * One-shot utility: lists every model id (and its variant params) the
 * authenticated Cursor account can use via `@cursor/sdk` cloud agents.
 *
 * Run from CI via `.github/workflows/discover-cursor-models.yml`
 * (workflow_dispatch) or locally:
 *
 *   CURSOR_API_KEY=... npx tsx .github/scripts/core/discover-cursor-models.ts
 *
 * Output is a Markdown table dropped into the GitHub Step Summary plus a
 * compact JSON dump on stdout. Use it to:
 *   - confirm the canonical id you intend to set in
 *     `CURSOR_MODEL_<TIER>_ID` repo variables (vision / manager / executor),
 *   - sanity-check that the doctrine in `.cursor/core/rules/20-model-routing.mdc`
 *     still matches what the API exposes after a Cursor model bump.
 *
 * Why a discovery utility (not hard-coded ids):
 *   Cursor periodically ships new model versions (sonnet 4.7, opus 4.9, …).
 *   Hard-coding a stale id silently routes to the account default (which in
 *   this account is gpt-5.5) and bypasses the tier doctrine. Run this when
 *   bumping ids.
 *
 * SECURITY: never logs the API key. Reads `CURSOR_API_KEY` from env and lets
 * the SDK handle auth.
 */

import { Cursor, type ModelListItem } from "@cursor/sdk";
import fs from "node:fs";

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error("❌ CURSOR_API_KEY env var is required.");
  process.exit(1);
}

interface VariantRow {
  modelId: string;
  modelDisplayName: string;
  variantDisplayName: string;
  isDefault: boolean;
  paramsCompact: string;
}

function flattenModels(models: ModelListItem[]): VariantRow[] {
  const rows: VariantRow[] = [];
  for (const m of models) {
    if (!m.variants?.length) {
      rows.push({
        modelId: m.id,
        modelDisplayName: m.displayName,
        variantDisplayName: m.displayName,
        isDefault: true,
        paramsCompact: "(no variants)",
      });
      continue;
    }
    for (const v of m.variants) {
      rows.push({
        modelId: m.id,
        modelDisplayName: m.displayName,
        variantDisplayName: v.displayName,
        isDefault: !!v.isDefault,
        paramsCompact:
          v.params.length === 0
            ? "(none)"
            : v.params.map((p) => `${p.id}=${p.value}`).join(", "),
      });
    }
  }
  return rows;
}

function emitMarkdown(rows: VariantRow[]): string {
  const headers = "| Model id | Display | Default? | Variant params |";
  const sep = "| --- | --- | --- | --- |";
  const lines = rows.map(
    (r) =>
      `| \`${r.modelId}\` | ${r.modelDisplayName} | ${r.isDefault ? "✅" : ""} | ${r.paramsCompact} |`,
  );
  return [headers, sep, ...lines].join("\n");
}

async function main(): Promise<void> {
  const models = await Cursor.models.list({ apiKey });
  const rows = flattenModels(models);
  const defaults = rows.filter((r) => r.isDefault);

  console.log(`Discovered ${models.length} models / ${rows.length} variants.\n`);
  console.log("Default variant per model id:");
  for (const r of defaults) {
    console.log(`  ${r.modelId}: ${r.paramsCompact}`);
  }
  console.log("");
  console.log("Tier id candidates (per .cursor/core/rules/20-model-routing.mdc):");
  console.log("  vision    →  any claude-opus-* id");
  console.log("  manager   →  any claude-sonnet-* id");
  console.log("  executor  →  composer-2.5 (or composer-2.5-fast variant)");

  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    fs.appendFileSync(
      summary,
      [
        "## Cursor models available to this API key\n",
        "Use one of these `Model id` values for `CURSOR_MODEL_<TIER>_ID` repo variables.\n",
        emitMarkdown(rows),
        "\n",
      ].join("\n"),
    );
  }

  fs.writeFileSync(
    "cursor-models-discovered.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), models }, null, 2),
  );
  console.log("\n📦 Wrote cursor-models-discovered.json (full payload).");
}

main().catch((err) => {
  console.error("❌ discover-cursor-models failed:", err);
  process.exit(1);
});
