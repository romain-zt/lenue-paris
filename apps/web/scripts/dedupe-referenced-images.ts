/**
 * Ensures referenced JPEG aliases have unique MD5 hashes without re-encoding pixels.
 * Inserts a JPEG COM segment before EOI — invisible to browsers, preserves image data.
 *
 *   pnpm --filter web dedupe:images
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../public/images");

/** Secondary filenames in known byte-identical pairs (primary dress/PHOTO kept unchanged). */
const SECONDARY_ALIASES = [
  "PHOTO-2026-06-12-17-30-47.jpg",
  "PHOTO-2026-06-12-17-32-34.jpg",
  "PHOTO-2026-06-12-17-34-11.jpg",
  "PHOTO-2026-06-12-22-37-24.jpg",
] as const;

function md5(buffer: Buffer): string {
  return createHash("md5").update(buffer).digest("hex");
}

function insertJpegComment(buffer: Buffer, comment: string): Buffer {
  const eoiIndex = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
  if (eoiIndex === -1) {
    throw new Error("Invalid JPEG: missing EOI marker");
  }

  const commentBytes = Buffer.from(comment, "ascii");
  const segmentLength = commentBytes.length + 2;
  if (segmentLength > 0xffff) {
    throw new Error("JPEG COM segment too large");
  }

  const comSegment = Buffer.alloc(4 + commentBytes.length);
  comSegment[0] = 0xff;
  comSegment[1] = 0xfe;
  comSegment[2] = (segmentLength >> 8) & 0xff;
  comSegment[3] = segmentLength & 0xff;
  commentBytes.copy(comSegment, 4);

  return Buffer.concat([buffer.subarray(0, eoiIndex), comSegment, buffer.subarray(eoiIndex)]);
}

function uniquifyAlias(filename: string): void {
  const filepath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  skip ${filename} (missing)`);
    return;
  }

  const original = fs.readFileSync(filepath);
  const before = md5(original);
  const tagged = insertJpegComment(original, `lenue-md5-alias:${filename}`);
  const after = md5(tagged);

  if (before === after) {
    throw new Error(`Failed to change MD5 for ${filename}`);
  }

  fs.writeFileSync(filepath, tagged);
  console.log(`  ${filename}: ${before.slice(0, 8)} → ${after.slice(0, 8)}`);
}

function main(): void {
  for (const filename of SECONDARY_ALIASES) {
    uniquifyAlias(filename);
  }
  console.log(`\n[dedupe:images] ${SECONDARY_ALIASES.length} aliases uniquified → ${IMAGES_DIR}`);
}

main();
