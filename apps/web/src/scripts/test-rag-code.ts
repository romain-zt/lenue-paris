import { closePgPool, isEmbeddingConfigured, searchCode } from "@repo/cms-data/indexing";

const SAMPLE_QUERIES = [
  { query: "collection users Payload", pathPrefix: "packages/payload-schema/src" },
  { query: "s3Storage media upload configuration", pathPrefix: "apps/web/src" },
  { query: "route chat IA streamText", pathPrefix: "apps/web/src" },
] as const;

async function main() {
  console.log("[test-rag-code] Vérification de la recherche sémantique code…\n");

  if (!isEmbeddingConfigured()) {
    console.error("[test-rag-code] Échec : OPENAI_API_KEY manquant dans .env");
    process.exitCode = 1;
    return;
  }

  let totalHits = 0;

  for (const { query, pathPrefix } of SAMPLE_QUERIES) {
    console.log(`→ "${query}" (prefix: ${pathPrefix})`);
    const result = await searchCode({ query, pathPrefix, limit: 3 });

    if (result.skipped) {
      console.error(`  skipped: ${result.reason ?? "unknown"}`);
      process.exitCode = 1;
      return;
    }

    if (result.results.length === 0) {
      console.log("  (aucun résultat — lance pnpm reindex-code)");
      continue;
    }

    for (const hit of result.results) {
      totalHits += 1;
      const preview = hit.text.replace(/\s+/g, " ").slice(0, 100);
      console.log(
        `  [${hit.similarity.toFixed(3)}] ${hit.filePath}:${hit.startLine}-${hit.endLine}`,
      );
      console.log(`      ${preview}${hit.text.length > 100 ? "…" : ""}`);
    }

    console.log("");
  }

  if (totalHits === 0) {
    console.error("[test-rag-code] Aucun chunk trouvé — index vide ou reindex requis");
    process.exitCode = 1;
    return;
  }

  console.log(
    `[test-rag-code] OK — ${totalHits} passage(s) sur ${SAMPLE_QUERIES.length} requêtes`,
  );
}

main()
  .catch((err) => {
    console.error("[test-rag-code] Erreur:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
    process.exit(process.exitCode ?? 0);
  });
