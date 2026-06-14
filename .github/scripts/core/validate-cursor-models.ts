/**
 * validate-cursor-models.ts
 *
 * Lints our `TIER_MODELS` config against the live Cursor Cloud API. For each
 * tier we check that `{ id, params }` exactly matches one of the variants
 * returned by `Cursor.models.list()` — if the param set is partial or has an
 * unknown key, the Cloud API rejects the call with `[invalid_model]`. This
 * script catches that BEFORE a real run does.
 *
 * Run via:
 *   CURSOR_API_KEY=... tsx .github/scripts/core/validate-cursor-models.ts
 * or via `.github/workflows/validate-cursor-models.yml` on every PR that
 * touches the model config.
 *
 * Exit code:
 *   0 — every tier matches a registered variant.
 *   1 — at least one tier does not match (prints the exact mismatch and the
 *       closest variant for that model id).
 */

import { Cursor, type ModelListItem, type ModelParameterValue } from "@cursor/sdk";
import { TIER_MODELS, type Tier } from "./cursor-models.config";

interface VariantSig {
  modelId: string;
  modelDisplay: string;
  params: ModelParameterValue[];
  isDefault: boolean;
}

function flattenVariants(models: ModelListItem[]): VariantSig[] {
  const out: VariantSig[] = [];
  for (const m of models) {
    if (!m.variants?.length) {
      out.push({ modelId: m.id, modelDisplay: m.displayName, params: [], isDefault: true });
      continue;
    }
    for (const v of m.variants) {
      out.push({
        modelId: m.id,
        modelDisplay: m.displayName,
        params: v.params,
        isDefault: !!v.isDefault,
      });
    }
  }
  return out;
}

function paramsToMap(params: ReadonlyArray<ModelParameterValue>): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of params) m.set(p.id, p.value);
  return m;
}

function paramsEqual(
  a: ReadonlyArray<ModelParameterValue>,
  b: ReadonlyArray<ModelParameterValue>,
): boolean {
  if (a.length !== b.length) return false;
  const ma = paramsToMap(a);
  const mb = paramsToMap(b);
  for (const [k, v] of ma) {
    if (mb.get(k) !== v) return false;
  }
  return true;
}

function formatParams(params: ReadonlyArray<ModelParameterValue>): string {
  if (params.length === 0) return "(none)";
  return params.map((p) => `${p.id}=${p.value}`).join(", ");
}

interface TierVerdict {
  tier: Tier;
  modelId: string;
  ok: boolean;
  message: string;
}

function validateTier(tier: Tier, all: VariantSig[]): TierVerdict {
  const sel = TIER_MODELS[tier];
  const candidates = all.filter((v) => v.modelId === sel.id);

  if (candidates.length === 0) {
    const knownIds = [...new Set(all.map((v) => v.modelId))].sort().join(", ");
    return {
      tier,
      modelId: sel.id,
      ok: false,
      message:
        `Model id '${sel.id}' is not in Cursor.models.list() for this account.\n` +
        `      Known ids: ${knownIds}\n` +
        `      Run 'tsx .github/scripts/core/discover-cursor-models.ts' for the full table.`,
    };
  }

  const exact = candidates.find((v) => paramsEqual(v.params, sel.params ?? []));
  if (exact) {
    return {
      tier,
      modelId: sel.id,
      ok: true,
      message: `${sel.id} (${formatParams(sel.params ?? [])})${exact.isDefault ? " — default variant" : ""}`,
    };
  }

  const ourKeys = new Set((sel.params ?? []).map((p) => p.id));
  const closest =
    candidates.find((v) => v.params.every((p) => ourKeys.has(p.id))) ??
    candidates.find((v) => v.isDefault) ??
    candidates[0]!;

  const ourMap = paramsToMap(sel.params ?? []);
  const variantMap = paramsToMap(closest.params);
  const missing = [...variantMap.keys()].filter((k) => !ourMap.has(k));
  const extra = [...ourMap.keys()].filter((k) => !variantMap.has(k));
  const wrongValue = [...ourMap.entries()].filter(([k, v]) => variantMap.has(k) && variantMap.get(k) !== v);

  const diffLines: string[] = [];
  if (missing.length > 0) {
    diffLines.push(
      `      Missing params: ${missing
        .map((k) => `${k}=${variantMap.get(k) ?? "?"}`)
        .join(", ")}`,
    );
  }
  if (extra.length > 0) {
    diffLines.push(`      Unknown params: ${extra.join(", ")}`);
  }
  if (wrongValue.length > 0) {
    diffLines.push(
      `      Wrong values: ${wrongValue
        .map(([k, v]) => `${k}=${v} (variant has ${variantMap.get(k)})`)
        .join(", ")}`,
    );
  }

  return {
    tier,
    modelId: sel.id,
    ok: false,
    message:
      `Params for '${sel.id}' do not match any registered variant.\n` +
      `      Configured: ${formatParams(sel.params ?? [])}\n` +
      `      Closest variant${closest.isDefault ? " (default)" : ""}: ${formatParams(closest.params)}\n` +
      diffLines.join("\n"),
  };
}

async function main(): Promise<void> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    console.error("❌ CURSOR_API_KEY env var is required.");
    process.exit(1);
  }

  console.log("🔎 Validating TIER_MODELS against Cursor.models.list()…\n");
  const models = await Cursor.models.list({ apiKey });
  const variants = flattenVariants(models);

  const tiers: Tier[] = ["vision", "manager", "executor"];
  const verdicts = tiers.map((t) => validateTier(t, variants));

  for (const v of verdicts) {
    const icon = v.ok ? "✅" : "❌";
    console.log(`${icon} ${v.tier}: ${v.message}`);
  }

  const failed = verdicts.filter((v) => !v.ok);
  if (failed.length > 0) {
    console.error(
      `\n❌ ${failed.length} tier${failed.length === 1 ? "" : "s"} mismatched. Cloud agent calls will fail with [invalid_model].`,
    );
    console.error(
      "   Sync .github/scripts/core/cursor-models.config.ts → TIER_PARAMS using the discovery table.",
    );
    process.exit(1);
  }

  console.log("\n✅ All tier configs match a registered variant.");
}

main().catch((err) => {
  console.error("❌ validate-cursor-models failed:", err);
  process.exit(1);
});
