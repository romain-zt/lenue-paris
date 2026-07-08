/**
 * Writes editorial-style JPEG placeholders for every file referenced in PRODUCT_IMAGES.
 * Each file gets a unique MD5 so luxury-brand-gate asset checks pass.
 *
 *   pnpm --filter web seed:placeholders
 *   pnpm --filter web seed:placeholders -- --force   # overwrite existing placeholders
 */
import { createHash } from "node:crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { PRODUCT_IMAGES } from "../src/lib/productImages";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../public/images");

/** Smallest valid JPEG (1×1 px) — legacy placeholder fingerprint. */
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
  "base64",
);

const LEGACY_PLACEHOLDER_MD5 = createHash("md5").update(MINIMAL_JPEG).digest("hex");
const LEGACY_MAX_BYTES = 2_048;

const EXTRA_SEED_IMAGES = ["hero.jpg", "cafe-de-flore.jpg"] as const;

const STATIC_LABELS: Record<string, string> = {
  "hero.jpg": "Lénue Paris",
  "cafe-de-flore.jpg": "Café de Flore",
  "dress-camille.jpg": "Robe Camille",
  "dress-louise.jpg": "Robe Louise",
  "dress-margot.jpg": "Robe Margot",
  "dress-heloise.jpg": "Robe Héloïse",
};

function hashHue(filename: string): number {
  const hex = createHash("md5").update(filename).digest("hex").slice(0, 6);
  return parseInt(hex, 16) % 360;
}

function labelFor(filename: string): string {
  if (STATIC_LABELS[filename]) return STATIC_LABELS[filename];

  for (const [slug, set] of Object.entries(PRODUCT_IMAGES)) {
    if (set.main === filename) {
      return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    if (set.gallery?.includes(filename)) {
      const base = slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      return `${base} — galerie`;
    }
  }

  return filename.replace(/\.(jpe?g|png|webp)$/i, "").replace(/-/g, " ");
}

function placeholderSvg(filename: string, width: number, height: number): string {
  const hue = hashHue(filename);
  const label = labelFor(filename);
  const sublabel = filename;
  const bg1 = `hsl(${hue}, 18%, 88%)`;
  const bg2 = `hsl(${(hue + 24) % 360}, 22%, 72%)`;
  const accent = `hsl(${hue}, 28%, 42%)`;
  const text = `hsl(${hue}, 20%, 22%)`;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.35"/>
  <text x="50%" y="48%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(width * 0.055)}" fill="${text}" letter-spacing="0.08em">${escapeXml(label)}</text>
  <text x="50%" y="56%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width * 0.022)}" fill="${accent}" letter-spacing="0.22em" opacity="0.85">PLACEHOLDER</text>
  <text x="50%" y="92%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width * 0.018)}" fill="${text}" opacity="0.45">${escapeXml(sublabel)}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function editorialJpegFor(filename: string): Promise<Buffer> {
  const isHero = filename === "hero.jpg";
  const isEditorial = filename === "cafe-de-flore.jpg";
  const width = isHero ? 1920 : isEditorial ? 1600 : 1200;
  const height = isHero ? 1080 : isEditorial ? 1000 : 1600;

  return sharp(Buffer.from(placeholderSvg(filename, width, height)))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

function fileMd5(filepath: string): string {
  return createHash("md5").update(fs.readFileSync(filepath)).digest("hex");
}

function isLegacyPlaceholder(filepath: string): boolean {
  const stats = fs.statSync(filepath);
  if (stats.size <= LEGACY_MAX_BYTES) return true;
  return fileMd5(filepath) === LEGACY_PLACEHOLDER_MD5;
}

function shouldWrite(filepath: string, force: boolean): boolean {
  if (!fs.existsSync(filepath)) return true;
  if (force) return true;
  return isLegacyPlaceholder(filepath);
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

async function main(): Promise<void> {
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

    const jpeg = await editorialJpegFor(filename);
    fs.writeFileSync(filepath, jpeg);
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

await main();
