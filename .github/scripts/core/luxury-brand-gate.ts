#!/usr/bin/env node
/**
 * Luxury Brand Gate — deterministic maison floors only (llm_calls: 0).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateRows,
  loadFixtureHtml,
  loadQualityConfig,
  runMaisonScorers,
} from "./quality/maison-scorers/index.js";
import { scoreAssetDuplicateHash } from "./quality/maison-scorers/asset-duplicate-hash.js";
import {
  scoreCatalogueFrameUniquenessLive,
} from "./quality/maison-scorers/catalogue-frame-uniqueness.js";
import { scoreLayoutMetricsLive } from "./quality/maison-scorers/layout-metrics.js";
import { scoreMarketplaceGrep } from "./quality/maison-scorers/marketplace-grep.js";
import { scorePaletteChroma } from "./quality/maison-scorers/palette-chroma.js";
import { scoreAssetContract } from "./quality/maison-scorers/asset-contract.js";
import { scoreInfraBlocked } from "./quality/maison-scorers/asset-contract.js";
import type { FloorRow } from "./quality/maison-scorers/types.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

interface SlicePathsEntry {
  preview_url?: string;
  paths?: string[];
}

function parseArgs(argv: string[]) {
  let fixture: string | undefined;
  let htmlPath: string | undefined;
  let previewUrl: string | undefined;
  let logPath: string | undefined;
  let checkAssets = false;
  let checkFrames = false;
  let diffPath: string | undefined;
  let slice: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fixture" && argv[i + 1]) fixture = argv[++i];
    else if (a === "--html" && argv[i + 1]) htmlPath = argv[++i];
    else if (a === "--preview-url" && argv[i + 1]) previewUrl = argv[++i];
    else if (a === "--preview" && argv[i + 1]) previewUrl = argv[++i];
    else if (a === "--log" && argv[i + 1]) logPath = argv[++i];
    else if (a === "--check-assets") checkAssets = true;
    else if (a === "--check-frames") checkFrames = true;
    else if (a === "--diff" && argv[i + 1]) diffPath = argv[++i];
    else if (a === "--slice" && argv[i + 1]) slice = argv[++i];
    else if (a === "--help") {
      console.log(`Usage:
  luxury-brand-gate.ts --fixture marketplace-heavy|maison-pass
  luxury-brand-gate.ts --html path/to/slice.html [--preview-url URL] [--log docs/state/luxury-review-log.ndjson]
  luxury-brand-gate.ts --check-assets
  luxury-brand-gate.ts --check-frames --preview http://localhost:3001
  luxury-brand-gate.ts --diff apps/web --slice storefront-shell--global-chrome --preview-url http://localhost:3001/fr`);
      process.exit(0);
    }
  }

  return { fixture, htmlPath, previewUrl, logPath, checkAssets, checkFrames, diffPath, slice };
}

function loadSlicePaths(sliceId: string): SlicePathsEntry {
  const file = path.join(REPO_ROOT, ".project/lenue-luxury/slice-paths.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, SlicePathsEntry>;
  const entry = data[sliceId];
  if (!entry) throw new Error(`Unknown slice in slice-paths.json: ${sliceId}`);
  return entry;
}

async function fetchPreviewHtml(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Preview fetch failed: ${url} → HTTP ${res.status}`);
  }
  return res.text();
}

function readShellCss(paths: string[]): string {
  const cssFiles = paths.filter((p) => p.endsWith(".css"));
  return cssFiles
    .map((rel) => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8"))
    .join("\n");
}

function normalizeAccent(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function scoreTypographyLive(html: string, required: string): FloorRow[] {
  const wordmarkRe = /data-maison=['"]wordmark['"][^>]*>([\s\S]*?)<\/a/i;
  const wordmarkInner = html.match(wordmarkRe)?.[1]?.replace(/<[^>]+>/g, " ") ?? "";
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const requiredNorm = normalizeAccent(required);
  const wordmarkNorm = normalizeAccent(wordmarkInner);
  const visibleNorm = normalizeAccent(visible);

  if (!wordmarkNorm.includes(requiredNorm) && !visibleNorm.includes(requiredNorm)) {
    return [
      {
        floor_id: "typography_accent",
        observed: wordmarkInner.trim() || "missing",
        threshold: required,
        reference_violated: "Lénue wordmark",
        status: "fail",
      },
    ];
  }

  return [
    {
      floor_id: "typography_accent",
      observed: required,
      threshold: required,
      status: "pass",
    },
  ];
}

function scoreI18nLive(html: string, previewUrl: string, locales: string[]): FloorRow[] {
  const rows: FloorRow[] = [];
  const expectedLocale = new URL(previewUrl).pathname.split("/").filter(Boolean)[0] ?? "fr";
  const langMatch = html.match(/<html[^>]*\blang=["']([^"']+)["']/i);
  const pageLang = langMatch?.[1]?.split("-")[0] ?? "";

  if (pageLang && pageLang !== expectedLocale) {
    rows.push({
      floor_id: "i18n_key_parity",
      observed: `lang=${pageLang}`,
      threshold: expectedLocale,
      reference_violated: "tri-locale parity",
      status: "fail",
    });
  }

  for (const locale of locales) {
    const localePresent =
      html.includes(`/${locale}/`) ||
      new RegExp(`\\b${locale}\\b`, "i").test(html.slice(0, 120_000));
    if (!localePresent) {
      rows.push({
        floor_id: "i18n_key_parity",
        observed: `${locale} switch missing`,
        threshold: "all locales",
        reference_violated: "tri-locale parity",
        status: "fail",
      });
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "i18n_key_parity",
      observed: locales.join(","),
      threshold: "all locales",
      status: "pass",
    });
  }

  return rows;
}

function scoreKitFromShell(html: string, cssContent: string, mins: {
  readability_min: number;
  design_tokens_min: number;
  seo_meta_min: number;
  alt_coverage_min: number;
}): FloorRow[] {
  const rows: FloorRow[] = [];
  const text = html.replace(/<[^>]+>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWords = words.length / Math.max(sentences.length, 1);
  const readability = avgWords <= 20 ? 0.9 : avgWords <= 30 ? 0.7 : 0.4;

  const hasRoot = /:root\s*\{/.test(cssContent);
  const hasVar = /var\s*\(--/.test(cssContent);
  const designTokens = hasRoot && hasVar ? 1 : hasRoot ? 0.5 : 0;

  const hasDescription = /<meta\s+name=["']description["']/i.test(html);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
  const seoMeta = (hasDescription ? 0.5 : 0) + (hasViewport ? 0.5 : 0);

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  const altCoverage =
    imgs.length === 0 ? 1 : imgs.filter((m) => /\balt=["'][^"']+["']/i.test(m[0])).length / imgs.length;

  const scores: Array<[string, number, number]> = [
    ["readability", readability, mins.readability_min],
    ["design_tokens", designTokens, mins.design_tokens_min],
    ["seo_meta", seoMeta, mins.seo_meta_min],
    ["alt_coverage", altCoverage, mins.alt_coverage_min],
  ];

  for (const [floorId, observed, threshold] of scores) {
    rows.push({
      floor_id: floorId,
      observed,
      threshold,
      status: observed >= threshold ? "pass" : "fail",
      ...(observed < threshold ? { reference_violated: "agent-loop-kit floor" } : {}),
    });
  }

  return rows;
}

async function runDiffMode(
  diffPath: string,
  sliceId: string,
  previewUrl: string,
): Promise<{ rows: FloorRow[]; llm_calls: number }> {
  if (diffPath !== "apps/web") {
    throw new Error(`--diff only supports apps/web (got ${diffPath})`);
  }

  const config = loadQualityConfig();
  const sliceEntry = loadSlicePaths(sliceId);
  const shellPaths = sliceEntry.paths ?? [];
  const cssContent = readShellCss(shellPaths);

  let html: string;
  try {
    html = await fetchPreviewHtml(previewUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      rows: [
        {
          floor_id: "preview_fetch",
          observed: message,
          threshold: "reachable",
          reference_violated: previewUrl,
          status: "fail",
        },
      ],
      llm_calls: 0,
    };
  }

  const combinedForPalette = `${cssContent}\n${html}`;
  const rows: FloorRow[] = [
    ...scoreMarketplaceGrep(html, config).rows,
    ...scoreTypographyLive(html, config.typography_accent.wordmark_required),
    ...scoreI18nLive(html, previewUrl, config.i18n_key_parity.locales),
    ...scoreLayoutMetricsLive(html, cssContent, config).rows,
    ...scorePaletteChroma(combinedForPalette, config).rows,
    ...scoreAssetContract(html, config).rows,
    ...scoreKitFromShell(html, cssContent, config.kit_scorers),
    ...scoreAssetDuplicateHash().rows,
    ...scoreInfraBlocked("lighthouse", "preview_required_for_live_run").rows,
    ...scoreInfraBlocked("asset_host", "asset_host_unreachable").rows,
  ];

  try {
    const previewBase = previewUrl.replace(/\/fr\/?$/, "");
    const frameResult = await scoreCatalogueFrameUniquenessLive(previewBase, [
      { id: "fr_featured_carousel", path: "/fr", maisonAttr: "catalogue-grid" },
      {
        id: "look_elise_gallery",
        path: "/fr/produits/look-elise-edition-limitee",
        maisonAttr: "product-gallery",
      },
    ]);
    rows.push(...frameResult.rows);
  } catch {
    rows.push({
      floor_id: "catalogue_frame_uniqueness",
      observed: "preview_unreachable",
      threshold: "page_reachable",
      reference_violated: "live preview",
      status: "blocked",
    });
  }

  return { rows, llm_calls: 0 };
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadQualityConfig();
  const fixtureMode = Boolean(args.fixture);

  let rows: FloorRow[];
  let llm_calls = 0;
  let mode = "fixture";
  let sliceId: string | undefined;

  if (args.checkAssets) {
    ({ rows } = scoreAssetDuplicateHash());
    mode = "check-assets";
  } else if (args.checkFrames) {
    if (!args.previewUrl) {
      console.error("❌ --check-frames requires --preview URL");
      process.exit(2);
    }
    const result = await scoreCatalogueFrameUniquenessLive(args.previewUrl, [
      { id: "fr_featured_carousel", path: "/fr", maisonAttr: "catalogue-grid" },
      {
        id: "look_elise_gallery",
        path: "/fr/produits/look-elise-edition-limitee",
        maisonAttr: "product-gallery",
      },
    ]);
    rows = result.rows;
    mode = "check-frames";
  } else if (args.diffPath) {
    if (!args.slice) {
      console.error("❌ --diff requires --slice");
      process.exit(2);
    }
    const previewUrl =
      args.previewUrl ??
      loadSlicePaths(args.slice).preview_url ??
      "http://localhost:3001/fr";
    ({ rows, llm_calls } = await runDiffMode(args.diffPath, args.slice, previewUrl));
    mode = "diff";
    sliceId = args.slice;
  } else if (args.fixture) {
    const html = loadFixtureHtml(args.fixture);
    ({ rows, llm_calls } = runMaisonScorers(html, config, {
      fixtureMode,
      previewUrl: args.previewUrl,
    }));
  } else if (args.htmlPath) {
    const html = fs.readFileSync(path.resolve(args.htmlPath), "utf8");
    ({ rows, llm_calls } = runMaisonScorers(html, config, {
      fixtureMode,
      previewUrl: args.previewUrl,
    }));
  } else {
    console.error("❌ Provide --fixture, --html, --check-assets, --check-frames, or --diff");
    process.exit(2);
  }

  const pass = evaluateRows(rows, fixtureMode);
  const failures = rows.filter((r) => r.status === "fail");

  const report = {
    gate: "luxury-brand-gate",
    slice: sliceId ?? (config ? "storefront-shell--global-chrome" : undefined),
    mode,
    diff: args.diffPath,
    preview_url: args.previewUrl,
    fixture: args.fixture,
    pass,
    llm_calls,
    failures,
    rows,
    ts: new Date().toISOString(),
  };

  console.log(JSON.stringify(report, null, 2));

  if (args.logPath) {
    const logFile = path.resolve(REPO_ROOT, args.logPath);
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `${JSON.stringify(report)}\n`, "utf8");
  }

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
