import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

const WEB_ROOT = path.join(REPO_ROOT, "apps/web");
const PRODUCT_IMAGES_TS = path.join(WEB_ROOT, "src/lib/productImages.ts");
const HOME_PAGE_TS = path.join(WEB_ROOT, "src/app/[locale]/page.tsx");
const IMAGE_DIRS = [
  path.join(WEB_ROOT, "public/images"),
  path.join(WEB_ROOT, "media"),
] as const;

export interface ReferencedAsset {
  source: string;
  filename: string;
  resolvedPath: string | null;
  md5: string | null;
}

function resolveImagePath(filename: string): string | null {
  for (const dir of IMAGE_DIRS) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function md5File(filePath: string): string {
  return createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

export function collectReferencedAssets(): ReferencedAsset[] {
  const entries = new Map<string, ReferencedAsset>();

  function add(source: string, filename: string) {
    if (!filename || entries.has(`${source}::${filename}`)) return;
    const resolvedPath = resolveImagePath(filename);
    entries.set(`${source}::${filename}`, {
      source,
      filename,
      resolvedPath,
      md5: resolvedPath ? md5File(resolvedPath) : null,
    });
  }

  const productImages = fs.readFileSync(PRODUCT_IMAGES_TS, "utf8");
  for (const m of productImages.matchAll(/^\s+"([^"]+)":\s*\{/gm)) {
    const slug = m[1];
    const blockStart = m.index ?? 0;
    const nextSlug = productImages.indexOf('\n  "', blockStart + 1);
    const block =
      nextSlug >= 0
        ? productImages.slice(blockStart, nextSlug)
        : productImages.slice(blockStart);

    const main = block.match(/main:\s*"([^"]+)"/)?.[1];
    if (main) add(`productImages:${slug}:main`, main);

    const gallery = block.match(/gallery:\s*\[([^\]]*)\]/s)?.[1];
    if (gallery) {
      for (const g of gallery.matchAll(/"([^"]+)"/g)) {
        add(`productImages:${slug}:gallery`, g[1]);
      }
    }
  }

  const homePage = fs.readFileSync(HOME_PAGE_TS, "utf8");
  for (const m of homePage.matchAll(/url:\s*"\/images\/([^"]+)"/g)) {
    add(`page.tsx:featured`, m[1]);
  }

  return [...entries.values()];
}

export function resolvePublicImageSrc(src: string): string | null {
  const normalized = src.replace(/^\/images\//, "").split("?")[0];
  if (!normalized) return null;
  return resolveImagePath(normalized);
}

export { REPO_ROOT, WEB_ROOT, IMAGE_DIRS };
