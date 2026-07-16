import { existsSync } from "node:fs";
import path from "node:path";

import config from "@payload-config";
import { setPayloadConfig } from "@repo/cms-data";
import {
  closePgPool,
  reindexAllCode,
  reindexAllContent,
} from "@repo/cms-data/indexing";

setPayloadConfig(config);

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        "[reindex-all] Could not locate repo root (pnpm-workspace.yaml not found)",
      );
    }
    dir = parent;
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[reindex-all] Skipped — OPENAI_API_KEY not set");
    return;
  }

  const force = process.env.AI_AUTO_REINDEX === "1";
  const isCi = process.env.CI === "true";
  const isVercel = process.env.VERCEL === "1";

  if (!force && !isCi && !isVercel) {
    console.log(
      "[reindex-all] Skipped — set AI_AUTO_REINDEX=1 to run locally, or deploy on Vercel / CI",
    );
    return;
  }

  console.log("[reindex-all] Reindexing content…");
  const content = await reindexAllContent();
  if (content.skipped) {
    console.warn(`[reindex-all] Content skipped: ${content.reason ?? "unknown"}`);
  } else {
    console.log(
      `[reindex-all] Content — ${content.totalChunks} chunks, ${content.documents} documents`,
    );
  }

  const rootDir = findRepoRoot(process.cwd());
  console.log(`[reindex-all] Reindexing code under ${rootDir}…`);
  const code = await reindexAllCode(rootDir);
  if (code.skipped) {
    console.warn(`[reindex-all] Code skipped: ${code.reason ?? "unknown"}`);
  } else {
    console.log(
      `[reindex-all] Code — ${code.totalChunks} chunks, ${code.files} files`,
    );
  }

  if (content.skipped && code.skipped) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("[reindex-all] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
    process.exit(process.exitCode ?? 0);
  });
