import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  canPrReady,
  compileManagerAllowlist,
  getOpenLuxuryFloors,
  PRD_REL,
} from "../orchestrator-allowlist.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const SCOPE_SLICE = "docs/product/scope-slices/storefront-shell--global-chrome.md";

const SEEDED_MARKETPLACE_FAILURE = {
  floor_id: "marketplace_grep",
  observed: "Buy now",
  threshold: "zero marketplace patterns",
  reference_violated: "CTA tone → marketplace",
  status: "fail" as const,
};

function buildSeedLog(): string {
  const report = {
    gate: "luxury-brand-gate",
    pass: false,
    llm_calls: 0,
    failures: [SEEDED_MARKETPLACE_FAILURE],
    rows: [SEEDED_MARKETPLACE_FAILURE],
  };
  return `${JSON.stringify(report)}\n`;
}

describe("orchestrator allowlist — Step 3c dry-run", () => {
  it("PRD injection fails compile", () => {
    const result = compileManagerAllowlist({
      repoRoot: ROOT,
      scopeSliceFile: SCOPE_SLICE,
      basePrompt: "Manager worker base",
      prdInjection: "full PRD body would go here",
    });
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /PRD\.md injection blocked/i);
  });

  it("scope-slice-only passes without PRD.md body", () => {
    const result = compileManagerAllowlist({
      repoRoot: ROOT,
      scopeSliceFile: SCOPE_SLICE,
      featureAreaFile: "docs/product/feature-areas/storefront-shell.md",
      basePrompt: "Manager worker base",
      luxuryLogRel: ".project/lenue-luxury/fixtures/empty-luxury-log.ndjson",
    });
    assert.equal(result.ok, true, result.reason);
    assert.match(result.prompt, new RegExp(SCOPE_SLICE.replace(/\//g, "\\/")));
    assert.match(result.prompt, /Luxury review log tail/i);
    assert.doesNotMatch(result.prompt, /```markdown\n# Feature Area: Storefront Shell/);
    const prdBody = fs.readFileSync(path.join(ROOT, PRD_REL), "utf8");
    assert.ok(prdBody.length > 500, "PRD fixture should be substantial");
    assert.doesNotMatch(result.prompt, new RegExp(prdBody.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("open floor_id sets can_pr_ready false", () => {
    const open = getOpenLuxuryFloors(buildSeedLog());
    assert.equal(open.length, 1);
    assert.equal(open[0]?.floor_id, "marketplace_grep");
    assert.equal(canPrReady(open), false);
  });

  it("seeded Step 2 failure JSON re-enters remediation prompt verbatim", () => {
    const tmpLog = path.join(ROOT, ".project/lenue-luxury/fixtures/step3c-seed-log.ndjson");
    fs.writeFileSync(tmpLog, buildSeedLog(), "utf8");
    try {
      const result = compileManagerAllowlist({
        repoRoot: ROOT,
        scopeSliceFile: SCOPE_SLICE,
        basePrompt: "Remediation worker",
        luxuryLogRel: path.relative(ROOT, tmpLog),
        remediation: true,
      });
      assert.equal(result.ok, true, result.reason);
      assert.equal(result.can_pr_ready, false);
      assert.match(result.prompt, /"floor_id":"marketplace_grep"/);
      assert.match(result.prompt, /"observed":"Buy now"/);
      assert.match(result.prompt, /Maison floor remediation/i);
    } finally {
      fs.unlinkSync(tmpLog);
    }
  });
});
