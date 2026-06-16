import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scoreCmsNoFallback } from "./cms-no-fallback.js";
import { scoreCmsRoutePurity } from "./cms-route-purity.js";
import { evaluateRows } from "./index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

describe("cms-no-fallback", () => {
  it("passes on current storefront routes", () => {
    process.chdir(ROOT);
    const { rows } = scoreCmsNoFallback();
    assert.ok(rows.some((r) => r.floor_id === "cms_no_hardcoded_fallback" && r.status === "pass"));
    assert.ok(evaluateRows(rows));
  });

  it("fails on PLACEHOLDER_BY_SLUG in synthetic route", () => {
    const { rows } = scoreCmsNoFallback([
      {
        path: "apps/web/src/app/[locale]/page.tsx",
        content: 'const x = PLACEHOLDER_BY_SLUG["robe"];',
      },
    ]);
    assert.ok(rows.some((r) => r.floor_id === "cms_no_hardcoded_fallback" && r.status === "fail"));
    assert.ok(!evaluateRows(rows));
  });
});

describe("cms-route-purity", () => {
  it("passes on current route files (no literal asset paths)", () => {
    process.chdir(ROOT);
    const { rows } = scoreCmsRoutePurity();
    assert.ok(rows.some((r) => r.floor_id === "cms_route_purity" && r.status === "pass"));
    assert.ok(evaluateRows(rows));
  });

  it("fails when page.tsx embeds /images/ literal", () => {
    const { rows } = scoreCmsRoutePurity([
      {
        path: "apps/web/src/app/[locale]/page.tsx",
        content: 'const hero = "/images/hero.jpg";',
      },
    ]);
    assert.ok(rows.some((r) => r.floor_id === "cms_route_purity" && r.status === "fail"));
    assert.ok(!evaluateRows(rows));
  });
});
