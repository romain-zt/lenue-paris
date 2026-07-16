import { existsSync } from "node:fs";
import path from "node:path";

import { closePgPool, reindexAllCode } from "@repo/cms-data/indexing";

/**
 * Walk up from the current working directory until the monorepo root is found
 * (identified by pnpm-workspace.yaml). Code indexing must run where the source
 * files actually exist — never against the runtime filesystem.
 */
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        "[reindex-code] Could not locate repo root (pnpm-workspace.yaml not found)",
      );
    }
    dir = parent;
  }
}

async function main() {
  const rootDir = findRepoRoot(process.cwd());
  console.log(`[reindex-code] Scanning source under ${rootDir} …`);

  const result = await reindexAllCode(rootDir);

  if (result.skipped) {
    console.warn(`[reindex-code] Skipped: ${result.reason ?? "unknown"}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[reindex-code] Done — ${result.totalChunks} chunks across ${result.files} files`,
  );
}

main()
  .catch((err) => {
    console.error("[reindex-code] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
    process.exit(process.exitCode ?? 0);
  });
