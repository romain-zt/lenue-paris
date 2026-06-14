#!/usr/bin/env tsx
/**
 * validate-framework-paths.ts
 *
 * Walks every .md, .mdc, .ts, .yml, .sh file tracked by git and checks that
 * every .cursor/... and .github/scripts/... reference resolves to an existing
 * file on disk. Run before and after the M1 core/project split to catch stray
 * references. Also wired into CI on every PR.
 *
 * Exit code 0 = all good. Exit code 1 = broken references detected.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, relative, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Handles both original location (.github/scripts/) and new location (.github/scripts/core/)
// by walking up until we find the .cursor directory
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, ".cursor")) || existsSync(join(dir, ".git"))) {
      return dir;
    }
    dir = dirname(dir);
  }
  return resolve(start, "../../..");
}
const ROOT = findRepoRoot(__dirname);

// --- Get git-tracked files only ---
function getTrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files", { cwd: ROOT, encoding: "utf-8" });
    return out
      .trim()
      .split("\n")
      .filter((f) => {
        const ext = f.split(".").pop() ?? "";
        return ["md", "mdc", "ts", "yml", "yaml", "sh"].includes(ext);
      })
      .map((f) => resolve(ROOT, f));
  } catch {
    return [];
  }
}

interface BrokenRef {
  file: string;
  line: number;
  ref: string;
  resolvedPath: string;
}

const broken: BrokenRef[] = [];
let totalRefs = 0;

/**
 * Extract framework path references from a single line.
 * We strip trailing punctuation (: . ` \ ) ] >) before checking.
 */
function extractFrameworkRefs(line: string): string[] {
  const refs: string[] = [];

  // .cursor/core/<section>/<subpath> — must have at least a filename after the section
  const cursorRe =
    /\.cursor\/core\/(rules|skills|commands|agents|templates|checkers|hooks)\/([^\s"'`)\]>\\,]*)/g;
  for (const m of line.matchAll(cursorRe)) {
    const subpath = m[2];
    if (!subpath || subpath.length === 0) continue;
    const cleaned = m[0].replace(/[:.,'`\\]+$/, "");
    if (cleaned.endsWith("/")) continue;
    if (cleaned.includes("*") || cleaned.includes("{")) continue;
    refs.push(cleaned);
  }

  // .github/scripts/core/<filename>.<ext>
  const scriptsRe = /\.github\/scripts\/core\/([a-zA-Z0-9_.-]+\.(ts|sh))/g;
  for (const m of line.matchAll(scriptsRe)) {
    refs.push(m[0]);
  }

  // Catch old-style .github/scripts/<name>.<ext> without /core/ — flag as stale
  const oldScriptsRe = /\.github\/scripts\/(?!core\/)([a-zA-Z0-9_-]+\.(ts|sh))/g;
  for (const m of line.matchAll(oldScriptsRe)) {
    refs.push(m[0]); // will resolve to non-existent path → reported as broken
  }

  return refs;
}

function checkFile(filePath: string) {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    const refs = extractFrameworkRefs(line);
    for (const ref of refs) {
      totalRefs++;
      const resolved = resolve(ROOT, ref);
      if (!existsSync(resolved)) {
        broken.push({
          file: relative(ROOT, filePath),
          line: idx + 1,
          ref,
          resolvedPath: resolved,
        });
      }
    }
  });
}

// --- Main ---

const files = getTrackedFiles();
for (const f of files) {
  checkFile(f);
}

console.log(`\nFramework Path Validator`);
console.log(`========================`);
console.log(
  `Scanned ${files.length} git-tracked files, found ${totalRefs} framework path references.\n`
);

if (broken.length === 0) {
  console.log(`✅  All framework path references resolve correctly.`);
  process.exit(0);
} else {
  console.error(`❌  ${broken.length} broken framework path reference(s):\n`);
  const byFile = new Map<string, BrokenRef[]>();
  for (const b of broken) {
    if (!byFile.has(b.file)) byFile.set(b.file, []);
    byFile.get(b.file)!.push(b);
  }
  for (const [file, refs] of byFile) {
    console.error(`  ${file}`);
    for (const r of refs) {
      console.error(`    line ${r.line}: ${r.ref}`);
    }
  }
  console.error(
    `\nRun the path rewrite step or update the references above to fix.`
  );
  process.exit(1);
}
