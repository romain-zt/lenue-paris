import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ScorerResult } from "./types.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

const APP_DIR = path.join(REPO_ROOT, "apps/web/src/app");

const FORBIDDEN_PATH_LITERALS = ["/images/", "/media/", "/api/media/"] as const;

function walkPageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkPageFiles(full));
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

/** Route files must not embed buyer-facing asset paths — URLs belong in lib/cms and components. */
export function scoreCmsRoutePurity(sources?: Array<{ path: string; content: string }>): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const files =
    sources ??
    walkPageFiles(APP_DIR).map((filePath) => ({
      path: path.relative(REPO_ROOT, filePath),
      content: fs.readFileSync(filePath, "utf8"),
    }));

  for (const { path: filePath, content } of files) {
    for (const literal of FORBIDDEN_PATH_LITERALS) {
      if (content.includes(`"${literal}`) || content.includes(`'${literal}`) || content.includes(`\`${literal}`)) {
        rows.push({
          floor_id: "cms_route_purity",
          observed: `${filePath}: ${literal}`,
          threshold: "forbidden_in_routes",
          reference_violated: "lib/cms separation",
          status: "fail",
        });
      }
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "cms_route_purity",
      observed: "none",
      threshold: "forbidden_in_routes",
      status: "pass",
    });
  }

  return { rows };
}
