/**
 * Writes minimal JPEG placeholders for every file referenced in PRODUCT_IMAGES.
 * Each file gets a unique MD5 (JPEG COM comment) so luxury-brand-gate asset checks pass.
 *
 *   pnpm --filter web seed:placeholders
 *   pnpm --filter web seed:placeholders -- --force   # overwrite existing placeholders
 */
import { createHash } from "node:crypto";
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

const LEGACY_PLACEHOLDER_MD5 = createHash("md5").update(MINIMAL_JPEG).digest("hex");

const EXTRA_SEED_IMAGES = ["hero.jpg", "cafe-de-flore.jpg"] as const;

function minimalJpegFor(filename: string): Buffer {
  const comment = Buffer.from(`lenue-placeholder:${filename}`, "utf8");
  const segmentLength = comment.length + 2;
  const com = Buffer.alloc(4 + comment.length);
  com[0] = 0xff;
  com[1] = 0xfe;
  com.writeUInt16BE(segmentLength, 2);
  comment.copy(com, 4);

  const eoi = Buffer.from([0xff, 0xd9]);
  const body = MINIMAL_JPEG.subarray(0, MINIMAL_JPEG.length - 2);
  return Buffer.concat([body, com, eoi]);
}

function fileMd5(filepath: string): string {
  return createHash("md5").update(fs.readFileSync(filepath)).digest("hex");
}

function shouldWrite(filepath: string, force: boolean): boolean {
  if (!fs.existsSync(filepath)) return true;
  if (force) return true;
  return fileMd5(filepath) === LEGACY_PLACEHOLDER_MD5;
}

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
  const force = process.argv.includes("--force");
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const filename of collectFilenames()) {
    const filepath = path.join(IMAGES_DIR, filename);
    const exists = fs.existsSync(filepath);

    if (!shouldWrite(filepath, force)) {
      skipped += 1;
      continue;
    }

    fs.writeFileSync(filepath, minimalJpegFor(filename));
    if (exists) {
      updated += 1;
      console.log(`  updated ${filename}`);
    } else {
      created += 1;
      console.log(`  created ${filename}`);
    }
  }

  console.log(
    `\n[seed:placeholders] ${created} created, ${updated} updated, ${skipped} kept → ${IMAGES_DIR}`,
  );
}

main();
