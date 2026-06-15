import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scoreAssetDuplicateHash } from "./asset-duplicate-hash.js";
import { scoreCatalogueFrameUniquenessFromHtml } from "./catalogue-frame-uniqueness.js";
import { computeDhash8x8, hammingDistance } from "./dhash.js";
import { collectReferencedAssets, resolvePublicImageSrc } from "./referenced-assets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../../..");

function chdirRoot() {
  process.chdir(ROOT);
}

describe("Step 2.1a — asset_duplicate_hash", () => {
  it("fails pre-dedupe tree with mannequin twin MD5 collisions", () => {
    chdirRoot();
    const { rows } = scoreAssetDuplicateHash();
    const fails = rows.filter((r) => r.floor_id === "asset_duplicate_hash" && r.status === "fail");
    assert.ok(fails.length >= 3, "expected ≥3 collision groups among referenced assets");

    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, ".project/lenue-luxury/fixtures/duplicate-assets.json"),
        "utf8",
      ),
    ) as { known_collisions: { md5_prefix: string; filenames: string[] }[] };

    for (const group of manifest.known_collisions) {
      const hit = fails.some((r) =>
        String(r.observed).includes(group.filenames[0]) &&
        String(r.observed).includes(group.filenames[1]),
      );
      assert.ok(hit, `expected collision row for ${group.filenames.join(" ↔ ")}`);
    }
  });

  it("passes synthetic unique-MD5 manifest (no cross-filename collision)", () => {
    chdirRoot();
    const assets = collectReferencedAssets();
    const byFilename = new Map(assets.map((a) => [a.filename, a.md5]));
    const uniqueRoles = ["dress-camille.jpg", "dress-louise.jpg", "PHOTO-2026-06-12-17-30-46.jpg"];
    const md5s = uniqueRoles.map((f) => byFilename.get(f)).filter(Boolean);
    assert.equal(new Set(md5s).size, md5s.length, "chosen pass roles must have distinct MD5 on disk");
  });
});

describe("Step 2.1a — catalogue_frame_uniqueness (fixture HTML)", () => {
  it("fails duplicate-frames.html with dhash-zero pairs", async () => {
    chdirRoot();
    const html = fs.readFileSync(
      path.join(ROOT, ".project/lenue-luxury/fixtures/duplicate-frames.html"),
      "utf8",
    );
    const { rows } = await scoreCatalogueFrameUniquenessFromHtml(html, [
      { id: "fixture_carousel", maisonAttr: "catalogue-grid" },
      { id: "fixture_gallery", maisonAttr: "product-gallery" },
    ]);
    const fails = rows.filter((r) => r.status === "fail");
    assert.ok(fails.length >= 2, "expected duplicate frame failures in fixture");
  });

  it("passes unique-frames.html", async () => {
    chdirRoot();
    const html = fs.readFileSync(
      path.join(ROOT, ".project/lenue-luxury/fixtures/unique-frames.html"),
      "utf8",
    );
    const { rows } = await scoreCatalogueFrameUniquenessFromHtml(html, [
      { id: "fixture_carousel", maisonAttr: "catalogue-grid" },
      { id: "fixture_gallery", maisonAttr: "product-gallery" },
    ]);
    const fails = rows.filter((r) => r.status === "fail");
    assert.equal(fails.length, 0, `unexpected failures: ${JSON.stringify(fails)}`);
  });
});

describe("Step 2.1a — dhash LANCZOS pinned", () => {
  it("identical bytes produce dhash distance 0", async () => {
    chdirRoot();
    const file = resolvePublicImageSrc("/images/lenue-complete-look.jpg");
    assert.ok(file);
    const a = await computeDhash8x8(file);
    const b = await computeDhash8x8(file);
    assert.equal(hammingDistance(a, b), 0);
  });

  it("distinct dress shots produce non-zero dhash distance", async () => {
    chdirRoot();
    const aPath = resolvePublicImageSrc("/images/dress-camille.jpg");
    const bPath = resolvePublicImageSrc("/images/dress-louise.jpg");
    assert.ok(aPath && bPath);
    const dist = hammingDistance(await computeDhash8x8(aPath), await computeDhash8x8(bPath));
    assert.ok(dist > 0, "distinct editorial frames should not hash identically");
  });
});
