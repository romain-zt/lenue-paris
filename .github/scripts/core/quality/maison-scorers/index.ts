import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QualityConfig, FloorRow, RunOptions, ScorerResult } from "./types.js";
import { loadQualityConfig } from "./load-config.js";
import { scoreMarketplaceGrep } from "./marketplace-grep.js";
import { scoreTypographyAccent } from "./typography-accent.js";
import { scoreI18nKeyParity } from "./i18n-key-parity.js";
import { scoreLayoutMetrics } from "./layout-metrics.js";
import { scorePaletteChroma } from "./palette-chroma.js";
import { scoreAssetContract, scoreInfraBlocked } from "./asset-contract.js";
import { scoreKitScorers } from "./kit-scorers.js";

export function runMaisonScorers(
  html: string,
  config: QualityConfig,
  options: RunOptions = {},
): { rows: FloorRow[]; llm_calls: number } {
  const results: ScorerResult[] = [
    scoreMarketplaceGrep(html, config),
    scoreTypographyAccent(html, config),
    scoreI18nKeyParity(html, config),
    scoreLayoutMetrics(html, config),
    scorePaletteChroma(html, config),
    scoreAssetContract(html, config),
    scoreKitScorers(html, config),
  ];

  if (options.previewUrl) {
    results.push(scoreInfraBlocked("lighthouse", "preview_required_for_live_run"));
  } else if (config.lighthouse.block_on_preview_absent) {
    results.push(scoreInfraBlocked("lighthouse", "preview_unavailable"));
  }

  if (config.asset_contract.block_on_host_unreachable) {
    results.push(scoreInfraBlocked("asset_host", "asset_host_unreachable"));
  }

  const rows = results.flatMap((r) => r.rows);
  return { rows, llm_calls: 0 };
}

export function evaluateRows(rows: FloorRow[], fixtureMode = false): boolean {
  const actionable = rows.filter((r) => {
    if (r.status === "blocked" || r.status === "skipped") return false;
    if (fixtureMode && (r.floor_id === "lighthouse" || r.floor_id === "asset_host")) return false;
    return true;
  });
  return !actionable.some((r) => r.status === "fail");
}

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export function loadFixtureHtml(name: string): string {
  const file = path.join(REPO_ROOT, ".project/lenue-luxury/fixtures", `${name}.html`);
  return fs.readFileSync(file, "utf8");
}

export { loadQualityConfig };
