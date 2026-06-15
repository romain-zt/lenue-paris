import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateRows,
  loadFixtureHtml,
  loadQualityConfig,
  runMaisonScorers,
} from "./index.js";
import { scoreMarketplaceGrep } from "./marketplace-grep.js";
import { scoreTypographyAccent } from "./typography-accent.js";
import { scoreI18nKeyParity } from "./i18n-key-parity.js";
import { scoreLayoutMetrics } from "./layout-metrics.js";
import { scorePaletteChroma } from "./palette-chroma.js";
import { scoreAssetContract } from "./asset-contract.js";
import { scoreKitScorers } from "./kit-scorers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../../..");

function chdirRoot() {
  process.chdir(ROOT);
}

describe("maison scorers — marketplace-heavy fixture", () => {
  it("marketplace-grep fails", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scoreMarketplaceGrep(html, config);
    assert.ok(rows.some((r) => r.status === "fail"), "expected marketplace grep failures");
  });

  it("typography-accent fails on Lenue without é", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scoreTypographyAccent(html, config);
    assert.ok(rows.some((r) => r.floor_id === "typography_accent" && r.status === "fail"));
  });

  it("i18n-key-parity fails missing en/ru", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scoreI18nKeyParity(html, config);
    assert.ok(rows.some((r) => r.status === "fail"));
  });

  it("layout-metrics fails card-in-card and grid density", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scoreLayoutMetrics(html, config);
    assert.ok(rows.filter((r) => r.status === "fail").length >= 2);
  });

  it("palette-chroma fails sale-red tokens", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scorePaletteChroma(html, config);
    assert.ok(rows.some((r) => r.status === "fail"));
  });

  it("asset-contract fails inline base64", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows } = scoreAssetContract(html, config);
    assert.ok(rows.some((r) => r.status === "fail"));
  });

  it("aggregate gate fails with llm_calls 0", () => {
    chdirRoot();
    const html = loadFixtureHtml("marketplace-heavy");
    const config = loadQualityConfig();
    const { rows, llm_calls } = runMaisonScorers(html, config, { fixtureMode: true });
    assert.equal(llm_calls, 0);
    assert.equal(evaluateRows(rows, true), false);
    assert.ok(rows.filter((r) => r.status === "fail").length >= 3);
  });
});

describe("maison scorers — maison-pass fixture", () => {
  it("aggregate gate passes deterministic floors in fixture mode", () => {
    chdirRoot();
    const html = loadFixtureHtml("maison-pass");
    const config = loadQualityConfig();
    const { rows, llm_calls } = runMaisonScorers(html, config, { fixtureMode: true });
    assert.equal(llm_calls, 0);
    const fails = rows.filter((r) => r.status === "fail");
    if (fails.length) {
      console.error("unexpected failures:", fails);
    }
    assert.equal(evaluateRows(rows, true), true);
  });

  it("individual scorers pass", () => {
    chdirRoot();
    const html = loadFixtureHtml("maison-pass");
    const config = loadQualityConfig();
    for (const scorer of [
      scoreMarketplaceGrep,
      scoreTypographyAccent,
      scoreI18nKeyParity,
      scoreLayoutMetrics,
      scorePaletteChroma,
      scoreAssetContract,
      scoreKitScorers,
    ]) {
      const { rows } = scorer(html, config);
      const fails = rows.filter((r) => r.status === "fail");
      assert.equal(fails.length, 0, `${scorer.name} should pass maison-pass`);
    }
  });
});

describe("luxury-brand-gate.ts has zero LLM imports", () => {
  it("no CURSOR_API_KEY or subagent spawn in gate script", () => {
    chdirRoot();
    const gate = fs.readFileSync(
      path.join(ROOT, ".github/scripts/core/luxury-brand-gate.ts"),
      "utf8",
    );
    assert.doesNotMatch(gate, /CURSOR_API_KEY/);
    assert.doesNotMatch(gate, /@cursor\/sdk/);
    assert.doesNotMatch(gate, /subagent|spawnReviewer/i);
  });
});
