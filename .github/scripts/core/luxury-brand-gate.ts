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

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function parseArgs(argv: string[]) {
  let fixture: string | undefined;
  let htmlPath: string | undefined;
  let previewUrl: string | undefined;
  let logPath: string | undefined;
  let checkAssets = false;
  let checkFrames = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fixture" && argv[i + 1]) fixture = argv[++i];
    else if (a === "--html" && argv[i + 1]) htmlPath = argv[++i];
    else if (a === "--preview-url" && argv[i + 1]) previewUrl = argv[++i];
    else if (a === "--preview" && argv[i + 1]) previewUrl = argv[++i];
    else if (a === "--log" && argv[i + 1]) logPath = argv[++i];
    else if (a === "--check-assets") checkAssets = true;
    else if (a === "--check-frames") checkFrames = true;
    else if (a === "--help") {
      console.log(`Usage:
  luxury-brand-gate.ts --fixture marketplace-heavy|maison-pass
  luxury-brand-gate.ts --html path/to/slice.html [--preview-url URL] [--log docs/state/luxury-review-log.ndjson]
  luxury-brand-gate.ts --check-assets
  luxury-brand-gate.ts --check-frames --preview http://localhost:3001`);
      process.exit(0);
    }
  }

  return { fixture, htmlPath, previewUrl, logPath, checkAssets, checkFrames };
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadQualityConfig();
  const fixtureMode = Boolean(args.fixture);

  let rows: Awaited<ReturnType<typeof runMaisonScorers>>["rows"];
  let llm_calls = 0;

  if (args.checkAssets) {
    ({ rows } = scoreAssetDuplicateHash());
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
    console.error("❌ Provide --fixture, --html, --check-assets, or --check-frames");
    process.exit(2);
  }

  const pass = evaluateRows(rows, fixtureMode);
  const failures = rows.filter((r) => r.status === "fail");

  const report = {
    gate: "luxury-brand-gate",
    slice: config ? "storefront-shell--global-chrome" : undefined,
    mode: args.checkAssets
      ? "check-assets"
      : args.checkFrames
        ? "check-frames"
        : "fixture",
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
