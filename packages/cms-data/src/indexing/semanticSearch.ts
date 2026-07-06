import type { ContentLocale, SemanticSearchParams, SemanticSearchResult } from "../types";
import { createEmbedding, isEmbeddingConfigured, toVectorLiteral } from "./embeddings";

interface ChunkRow {
  collection: string;
  doc_id: string;
  locale: string;
  field_path: string;
  text: string;
  similarity: number;
}

export async function semanticSearch(
  params: SemanticSearchParams,
): Promise<{ results: SemanticSearchResult[]; skipped: boolean; reason?: string }> {
  const query = params.query.trim();
  if (!query) {
    return { results: [], skipped: false };
  }

  if (!isEmbeddingConfigured()) {
    return {
      results: [],
      skipped: true,
      reason: "OPENAI_API_KEY not set — utilise search_content à la place",
    };
  }

  const locale: ContentLocale = params.locale ?? "fr";
  const limit = params.limit ?? 10;
  const queryEmbedding = await createEmbedding(query);
  const vector = toVectorLiteral(queryEmbedding);

  const pool = getPgPool();
  const collections = params.collections;

  let sql = `
    SELECT
      collection,
      doc_id,
      locale,
      field_path,
      text,
      1 - (embedding <=> $1::vector) AS similarity
    FROM content_chunks
    WHERE locale = $2
      AND embedding IS NOT NULL
  `;

  const values: Array<string | number> = [vector, locale];

  if (collections && collections.length > 0) {
    const placeholders = collections.map((_, index) => `$${index + 3}`).join(", ");
    sql += ` AND collection IN (${placeholders})`;
    values.push(...collections);
  }

  sql += ` ORDER BY embedding <=> $1::vector LIMIT $${values.length + 1}`;
  values.push(limit);

  const response = await pool.query<ChunkRow>(sql, values);

  const results: SemanticSearchResult[] = response.rows.map((row) => ({
    collection: row.collection as SemanticSearchResult["collection"],
    docId: row.doc_id,
    locale: row.locale as ContentLocale,
    fieldPath: row.field_path,
    text: row.text,
    similarity: Number(row.similarity),
  }));

  return { results, skipped: false };
}
