import { CONTENT_LOCALES } from "@repo/payload-schema/i18n/content-locales";
import { getPgPool } from "../db/pool";
import { getCmsClient } from "../client";
import { getDocument } from "../read/getDocument";
import type { SearchableSource } from "../read/extractSearchableText";
import type { ContentLocale } from "../types";
import { extractDocumentChunks } from "./chunkDocument";
import {
  createEmbeddings,
  isEmbeddingConfigured,
  toVectorLiteral,
} from "./embeddings";

const INDEXABLE_COLLECTIONS = [
  "pages",
  "products",
  "collections",
  "media",
] as const satisfies readonly SearchableSource[];

const INDEXABLE_GLOBALS = [
  "site-settings",
  "design-tokens",
] as const satisfies readonly SearchableSource[];

type IndexableCollection = (typeof INDEXABLE_COLLECTIONS)[number];
type IndexableGlobal = (typeof INDEXABLE_GLOBALS)[number];

export interface IndexDocumentResult {
  indexed: number;
  skipped: boolean;
  reason?: string;
}

async function deleteChunks(
  collection: string,
  docId: string,
  locale: ContentLocale,
): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `DELETE FROM content_chunks WHERE collection = $1 AND doc_id = $2 AND locale = $3`,
    [collection, docId, locale],
  );
}

async function upsertChunksForDocument(
  collection: SearchableSource,
  docId: string,
  locale: ContentLocale,
  doc: Record<string, unknown>,
): Promise<number> {
  const chunks = extractDocumentChunks(collection, doc);
  await deleteChunks(collection, docId, locale);

  if (chunks.length === 0) return 0;

  const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.text));
  const pool = getPgPool();

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    if (!chunk || !embedding) continue;

    await pool.query(
      `INSERT INTO content_chunks
        (collection, doc_id, locale, field_path, chunk_index, text, embedding, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, now())`,
      [
        collection,
        docId,
        locale,
        chunk.fieldPath,
        chunk.chunkIndex,
        chunk.text,
        toVectorLiteral(embedding),
      ],
    );
  }

  return chunks.length;
}

export async function indexDocument(params: {
  collection: IndexableCollection;
  docId: string;
  locales?: readonly ContentLocale[];
}): Promise<IndexDocumentResult> {
  if (!isEmbeddingConfigured()) {
    return { indexed: 0, skipped: true, reason: "OPENAI_API_KEY not set" };
  }

  const locales = params.locales ?? CONTENT_LOCALES;
  let indexed = 0;

  for (const locale of locales) {
    const doc = await getDocument({
      collection: params.collection,
      id: params.docId,
      locale,
      depth: 1,
    });
    if ("error" in doc) continue;
    indexed += await upsertChunksForDocument(
      params.collection,
      params.docId,
      locale,
      doc,
    );
  }

  return { indexed, skipped: false };
}

export async function indexGlobal(params: {
  slug: IndexableGlobal;
  locales?: readonly ContentLocale[];
}): Promise<IndexDocumentResult> {
  if (!isEmbeddingConfigured()) {
    return { indexed: 0, skipped: true, reason: "OPENAI_API_KEY not set" };
  }

  const locales = params.locales ?? CONTENT_LOCALES;
  let indexed = 0;

  for (const locale of locales) {
    const doc = await getDocument({
      collection: params.slug,
      isGlobal: true,
      locale,
      depth: 0,
    });
    if ("error" in doc) continue;
    indexed += await upsertChunksForDocument(params.slug, params.slug, locale, doc);
  }

  return { indexed, skipped: false };
}

export async function deleteDocumentIndex(
  collection: string,
  docId: string,
): Promise<void> {
  const pool = getPgPool();
  await pool.query(`DELETE FROM content_chunks WHERE collection = $1 AND doc_id = $2`, [
    collection,
    docId,
  ]);
}

export interface ReindexAllResult {
  totalChunks: number;
  documents: number;
  skipped: boolean;
  reason?: string;
}

export async function reindexAllContent(): Promise<ReindexAllResult> {
  if (!isEmbeddingConfigured()) {
    return { totalChunks: 0, documents: 0, skipped: true, reason: "OPENAI_API_KEY not set" };
  }

  const payload = await getCmsClient();
  let totalChunks = 0;
  let documents = 0;

  for (const collection of INDEXABLE_COLLECTIONS) {
    const response = await payload.find({
      collection,
      limit: 500,
      depth: 0,
      overrideAccess: true,
      pagination: false,
    });

    for (const doc of response.docs) {
      const id = String((doc as { id: number }).id);
      const result = await indexDocument({ collection, docId: id });
      totalChunks += result.indexed;
      documents += 1;
    }
  }

  for (const slug of INDEXABLE_GLOBALS) {
    const result = await indexGlobal({ slug });
    totalChunks += result.indexed;
    documents += 1;
  }

  return { totalChunks, documents, skipped: false };
}
