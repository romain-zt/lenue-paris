import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ScorerResult } from "./types.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

const APP_DIR = path.join(REPO_ROOT, "apps/web/src/app");

const FORBIDDEN_PATTERNS = [
  "PLACEHOLDER_BY_SLUG",
  "FEATURED_SLUGS",
  "isPlaceholder",
] as const;

function walkTsxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsxFiles(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** Fail when route files contain hybrid CMS fallback patterns. */
export function scoreCmsNoFallback(sources?: Array<{ path: string; content: string }>): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const files =
    sources ??
    walkTsxFiles(APP_DIR).map((filePath) => ({
      path: path.relative(REPO_ROOT, filePath),
      content: fs.readFileSync(filePath, "utf8"),
    }));

  for (const { path: filePath, content } of files) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.includes(pattern)) {
        rows.push({
          floor_id: "cms_no_hardcoded_fallback",
          observed: `${filePath}: ${pattern}`,
          threshold: "forbidden",
          reference_violated: "CMS-b editor-owned storefront",
          status: "fail",
        });
      }
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "cms_no_hardcoded_fallback",
      observed: "none",
      threshold: "forbidden",
      status: "pass",
    });
  }

  return { rows };
}
