#!/usr/bin/env node
/**
 * Luxury Brand Gate — deterministic maison floors only (llm_calls: 0).
 * Step 2: must fail marketplace-heavy.html, pass maison-pass.html on fixtures.
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

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function parseArgs(argv: string[]) {
  let fixture: string | undefined;
  let htmlPath: string | undefined;
  let previewUrl: string | undefined;
  let logPath: string | undefined;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fixture" && argv[i + 1]) fixture = argv[++i];
    else if (a === "--html" && argv[i + 1]) htmlPath = argv[++i];
    else if (a === "--preview-url" && argv[i + 1]) previewUrl = argv[++i];
    else if (a === "--log" && argv[i + 1]) logPath = argv[++i];
    else if (a === "--help") {
      console.log(`Usage:
  luxury-brand-gate.ts --fixture marketplace-heavy|maison-pass
  luxury-brand-gate.ts --html path/to/slice.html [--preview-url URL] [--log docs/state/luxury-review-log.ndjson]`);
      process.exit(0);
    }
  }

  return { fixture, htmlPath, previewUrl, logPath };
}

function main() {
  const args = parseArgs(process.argv);
  const config = loadQualityConfig();
  const fixtureMode = Boolean(args.fixture);

  let html: string;
  if (args.fixture) {
    html = loadFixtureHtml(args.fixture);
  } else if (args.htmlPath) {
    html = fs.readFileSync(path.resolve(args.htmlPath), "utf8");
  } else {
    console.error("❌ Provide --fixture or --html");
    process.exit(2);
  }

  const { rows, llm_calls } = runMaisonScorers(html, config, {
    fixtureMode,
    previewUrl: args.previewUrl,
  });

  const pass = evaluateRows(rows, fixtureMode);
  const failures = rows.filter((r) => r.status === "fail");

  const report = {
    gate: "luxury-brand-gate",
    slice: config ? "storefront-shell--global-chrome" : undefined,
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

main();
