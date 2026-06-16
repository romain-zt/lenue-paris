import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadQualityConfig } from "./load-config.js";
import { scoreLayoutMetricsLive } from "./layout-metrics.js";
import {
  extractImgSrcs,
  scoreCatalogueFrameUniquenessFromHtml,
  scoreCatalogueFrameUniquenessFromSrcs,
} from "./catalogue-frame-uniqueness.js";
import { resolvePublicImageSrc } from "./referenced-assets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../../..");

describe("diff mode — layout-metrics live HTML parsing", () => {
  it("passes maison-like hero + featured carousel markup with globals.css", () => {
    process.chdir(ROOT);
    const css = fs.readFileSync(
      path.join(ROOT, "apps/web/src/app/globals.css"),
      "utf8",
    );
    const html = `
      <section data-maison="hero" class="relative h-[100svh] min-h-[100dvh]">
        <div data-maison="hero-image"><img src="/images/hero.jpg" alt="Hero" sizes="100vw" /></div>
      </section>
      <section data-maison="catalogue-grid" class="bg-white">
        <div class="flex gap-8 overflow-x-auto">
          <img src="/images/a.jpg" alt="A" />
          <img src="/images/b.jpg" alt="B" />
        </div>
      </section>
    `;
    const config = loadQualityConfig();
    const { rows } = scoreLayoutMetricsLive(html, css, config);
    assert.equal(rows.some((r) => r.status === "fail"), false, JSON.stringify(rows));
    assert.ok(rows.some((r) => r.floor_id === "layout_metrics" && r.status === "pass"));
  });
});

describe("diff mode — catalogue_frame_uniqueness srcSet parser", () => {
  it("extractImgSrcs resolves /_next/image?url= from srcSet", () => {
    process.chdir(ROOT);
    const html = `
      <section data-maison="catalogue-grid">
        <img srcset="/_next/image?url=%2Fimages%2Fdress-camille.jpg&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fdress-louise.jpg&amp;w=640&amp;q=75 2x"
             alt="Camille" />
      </section>
    `;
    const srcs = extractImgSrcs(html, "catalogue-grid");
    assert.equal(srcs.length, 1);
    assert.ok(srcs[0].includes("dress-camille.jpg"));
    assert.ok(resolvePublicImageSrc(srcs[0]));
  });

  it("emits blocked when zero resolvable frames (never vacuous pass)", async () => {
    process.chdir(ROOT);
    const rows = await scoreCatalogueFrameUniquenessFromSrcs("fixture_empty", [
      "/images/missing-file-xyz.jpg",
    ]);
    assert.equal(rows[0]?.status, "blocked");
    assert.match(String(rows[0]?.observed), /frames=0/);
  });

  it("fails duplicate frames via srcSet parser path", async () => {
    process.chdir(ROOT);
    const html = `
      <section data-maison="catalogue-grid">
        <img src="/_next/image?url=%2Fimages%2Fdress-camille.jpg&amp;w=640&amp;q=75"
             srcset="/_next/image?url=%2Fimages%2Fdress-camille.jpg&amp;w=640&amp;q=75 1x"
             alt="Look 1" />
        <img src="/_next/image?url=%2Fimages%2Fdress-camille.jpg&amp;w=640&amp;q=75"
             srcset="/_next/image?url=%2Fimages%2Fdress-camille.jpg&amp;w=640&amp;q=75 1x"
             alt="Look 2" />
      </section>
    `;
    const { rows } = await scoreCatalogueFrameUniquenessFromHtml(html, [
      { id: "fixture_carousel", maisonAttr: "catalogue-grid" },
    ]);
    assert.ok(rows.some((r) => r.status === "fail"), JSON.stringify(rows));
  });
});

describe("luxury-brand-gate.ts — diff flag wired", () => {
  it("documents --diff in gate script", () => {
    process.chdir(ROOT);
    const gate = fs.readFileSync(
      path.join(ROOT, ".github/scripts/core/luxury-brand-gate.ts"),
      "utf8",
    );
    assert.match(gate, /--diff/);
    assert.match(gate, /runDiffMode/);
    assert.doesNotMatch(gate, /CURSOR_API_KEY/);
  });
});
