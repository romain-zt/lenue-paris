import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QualityConfig } from "./types.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

function readYamlScalar(block: string, key: string): string | undefined {
  const m = block.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  const raw = m?.[1]?.trim();
  if (!raw) return undefined;
  return raw.replace(/^['"]|['"]$/g, "");
}

function readYamlNumber(block: string, key: string, fallback: number): number {
  const raw = readYamlScalar(block, key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readYamlBool(block: string, key: string, fallback: boolean): boolean {
  const raw = readYamlScalar(block, key);
  if (!raw) return fallback;
  return raw === "true";
}

function readYamlList(block: string, key: string): string[] {
  const lines = block.split("\n");
  const start = lines.findIndex((l) => l.trim().startsWith(`${key}:`));
  if (start < 0) return [];
  const keyIndent = lines[start].match(/^(\s*)/)?.[1].length ?? 0;
  const items: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (line.trim() && indent <= keyIndent) break;
    const m = line.match(/^\s+-\s+(.+)$/);
    if (m) items.push(m[1].replace(/^['"]|['"]$/g, ""));
  }
  return items;
}

function section(yaml: string, name: string): string {
  const lines = yaml.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^  ${name}:\\s*(#.*)?$`).test(l));
  if (start < 0) return "";
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^  \w/.test(line) && !line.startsWith("    ")) break;
    out.push(line);
  }
  return out.join("\n");
}

export function loadQualityConfig(configPath?: string): QualityConfig {
  const file =
    configPath ??
    path.join(REPO_ROOT, ".project/lenue-luxury/quality_floor.yaml");
  const yaml = fs.readFileSync(file, "utf8");

  const marketplace = section(yaml, "marketplace_grep");
  const typography = section(yaml, "typography_accent");
  const layout = section(yaml, "layout_metrics");
  const hero = section(layout, "hero");
  const grid = section(layout, "catalogue_grid");
  const palette = section(yaml, "palette_chroma");
  const i18n = section(yaml, "i18n_key_parity");
  const lighthouse = section(yaml, "lighthouse");
  const asset = section(yaml, "asset_contract");
  const phash = section(yaml, "phash_mood_board");
  const kit = section(yaml, "kit_scorers");

  return {
    marketplace_grep: {
      enabled: readYamlBool(marketplace, "enabled", true),
      forbidden_strings: readYamlList(marketplace, "forbidden_strings"),
      forbidden_patterns: readYamlList(marketplace, "forbidden_patterns"),
      forbidden_elements: readYamlList(marketplace, "forbidden_elements"),
    },
    typography_accent: {
      wordmark_required: readYamlScalar(typography, "wordmark_required") ?? "Lénue",
      wordmark_forbidden_visible:
        readYamlScalar(typography, "wordmark_forbidden_visible") ?? "Lenue",
    },
    layout_metrics: {
      hero: {
        selector: readYamlScalar(hero, "selector") ?? "[data-maison='hero']",
        whitespace_ratio_min: readYamlNumber(hero, "whitespace_ratio_min", 0.38),
        full_bleed_required: readYamlBool(hero, "full_bleed_required", true),
        card_in_card_forbidden: readYamlBool(hero, "card_in_card_forbidden", true),
      },
      catalogue_grid: {
        selector: readYamlScalar(grid, "selector") ?? "[data-maison='catalogue-grid']",
        whitespace_ratio_min: readYamlNumber(grid, "whitespace_ratio_min", 0.38),
        columns_max_below_768: readYamlNumber(grid, "columns_max_below_768", 3),
        gutter_min_mobile_px: readYamlNumber(grid, "gutter_min_mobile_px", 24),
        gutter_min_desktop_px: readYamlNumber(grid, "gutter_min_desktop_px", 32),
      },
    },
    palette_chroma: {
      accent_chroma_max: readYamlNumber(palette, "accent_chroma_max", 0.35),
      forbidden_accent_tokens: readYamlList(palette, "forbidden_accent_tokens"),
    },
    i18n_key_parity: {
      locales: readYamlList(i18n, "locales").length
        ? readYamlList(i18n, "locales")
        : ["fr", "en", "ru"],
      required_key_prefixes: readYamlList(i18n, "required_key_prefixes"),
    },
    lighthouse: {
      performance_min: readYamlNumber(lighthouse, "performance_min", 90),
      accessibility_min: readYamlNumber(lighthouse, "accessibility_min", 90),
      block_on_preview_absent: readYamlBool(lighthouse, "block_on_preview_absent", true),
    },
    asset_contract: {
      inline_base64_forbidden: readYamlBool(asset, "inline_base64_forbidden", true),
      block_on_host_unreachable: readYamlBool(asset, "block_on_host_unreachable", true),
    },
    phash_mood_board: {
      manifest: readYamlScalar(phash, "manifest") ?? ".project/lenue-luxury/phash/reference-manifest.json",
      distance_max_to_any_reference: readYamlNumber(phash, "distance_max_to_any_reference", 18),
      distance_min_to_negative_fixture: readYamlNumber(phash, "distance_min_to_negative_fixture", 12),
    },
    kit_scorers: {
      readability_min: readYamlNumber(kit, "readability_min", 0.5),
      design_tokens_min: readYamlNumber(kit, "design_tokens_min", 1),
      seo_meta_min: readYamlNumber(kit, "seo_meta_min", 1),
      alt_coverage_min: readYamlNumber(kit, "alt_coverage_min", 1),
    },
  };
}
