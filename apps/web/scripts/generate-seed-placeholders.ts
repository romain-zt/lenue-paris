/**
 * Writes minimal JPEG placeholders for every file referenced in PRODUCT_IMAGES.
 * Use when brand photos are not available locally (they are not committed to git).
 *
 *   pnpm --filter web seed:placeholders
 *   pnpm seed
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PRODUCT_IMAGES } from "../src/lib/productImages";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../public/images");

/** Smallest valid JPEG (1×1 px) — enough for Payload media upload during seed. */
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
  "base64",
);

const EXTRA_SEED_IMAGES = ["hero.jpg", "cafe-de-flore.jpg"] as const;

function collectFilenames(): string[] {
  const names = new Set<string>(EXTRA_SEED_IMAGES);
  for (const set of Object.values(PRODUCT_IMAGES)) {
    names.add(set.main);
    for (const galleryFile of set.gallery ?? []) {
      names.add(galleryFile);
    }
  }
  return [...names].sort();
}

function main(): void {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;

  for (const filename of collectFilenames()) {
    const filepath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filepath)) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(filepath, MINIMAL_JPEG);
    created += 1;
    console.log(`  created ${filename}`);
  }

  console.log(
    `\n[seed:placeholders] ${created} created, ${skipped} already present → ${IMAGES_DIR}`,
  );
}

main();
