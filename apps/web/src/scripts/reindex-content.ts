import config from "@payload-config";
import { setPayloadConfig } from "@repo/cms-data";
import { closePgPool, reindexAllContent } from "@repo/cms-data/indexing";

setPayloadConfig(config);

async function main() {
  console.log("[reindex-content] Starting full content reindex…");
  const result = await reindexAllContent();

  if (result.skipped) {
    console.warn(`[reindex-content] Skipped: ${result.reason ?? "unknown"}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `[reindex-content] Done — ${result.totalChunks} chunks across ${result.documents} documents`,
  );
}

main()
  .catch((err) => {
    console.error("[reindex-content] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
    process.exit(process.exitCode ?? 0);
  });
