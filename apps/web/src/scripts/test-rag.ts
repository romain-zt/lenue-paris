import config from "@payload-config";
import { setPayloadConfig } from "@repo/cms-data";
import {
  closePgPool,
  isEmbeddingConfigured,
  semanticSearch,
} from "@repo/cms-data/indexing";

setPayloadConfig(config);

const SAMPLE_QUERIES = [
  "livraison",
  "robes en soie",
  "couleur accent du site",
] as const;

async function main() {
  console.log("[test-rag] Vérification de la recherche sémantique…\n");

  if (!isEmbeddingConfigured()) {
    console.error("[test-rag] Échec : OPENAI_API_KEY manquant dans .env");
    process.exitCode = 1;
    return;
  }

  let totalHits = 0;

  for (const query of SAMPLE_QUERIES) {
    console.log(`→ "${query}"`);
    const result = await semanticSearch({ query, locale: "fr", limit: 3 });

    if (result.skipped) {
      console.error(`  skipped: ${result.reason ?? "unknown"}`);
      process.exitCode = 1;
      return;
    }

    if (result.results.length === 0) {
      console.log("  (aucun résultat — lance pnpm --filter web reindex-content)");
      continue;
    }

    for (const hit of result.results) {
      totalHits += 1;
      const preview = hit.text.replace(/\s+/g, " ").slice(0, 90);
      console.log(
        `  [${hit.similarity.toFixed(3)}] ${hit.collection}/${hit.docId} · ${hit.fieldPath}`,
      );
      console.log(`      ${preview}${hit.text.length > 90 ? "…" : ""}`);
    }

    console.log("");
  }

  if (totalHits === 0) {
    console.error("[test-rag] Aucun chunk trouvé — index vide ou reindex requis");
    process.exitCode = 1;
    return;
  }

  console.log(`[test-rag] OK — ${totalHits} passage(s) retourné(s) sur ${SAMPLE_QUERIES.length} requêtes`);
}

main()
  .catch((err) => {
    console.error("[test-rag] Erreur:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePgPool();
    process.exit(process.exitCode ?? 0);
  });
