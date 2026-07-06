import { assertReadableTarget } from "../allowlists";
import { getCmsClient } from "../client";
import type {
  ContentLocale,
  SearchCollection,
  SearchContentParams,
  SearchContentResult,
  SearchResult,
} from "../types";
import {
  buildTextSnippet,
  extractDocumentText,
  extractPageText,
  textMatchesQuery,
} from "./extractSearchableText";
import { buildWhereClause } from "./getDocument";

const COLLECTION_TEXT_FIELDS: Record<SearchCollection, string[]> = {
  products: ["title", "slug", "description"],
  pages: ["title", "slug", "body"],
  collections: ["title", "slug"],
  media: ["alt", "filename"],
};

const DEFAULT_COLLECTIONS: SearchCollection[] = [
  "products",
  "pages",
  "collections",
];

/** Max pages scanned for in-memory block text search (admin-scale sites). */
const PAGE_BLOCK_SCAN_LIMIT = 100;

function mapProductDoc(
  doc: Record<string, unknown>,
  query?: string,
): SearchResult {
  const text = extractDocumentText("products", doc);
  return {
    collection: "products",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    category: (doc.category as string | null) ?? null,
    price: (doc.price as number | null) ?? null,
    inStock: (doc.inStock as boolean | null) ?? null,
    status: (doc._status as string | null) ?? null,
    snippet: query ? buildTextSnippet(text, query) : null,
  };
}

function mapPageDoc(
  doc: Record<string, unknown>,
  query?: string,
): SearchResult {
  const text = extractPageText(doc);
  return {
    collection: "pages",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    status: (doc._status as string | null) ?? null,
    snippet: query ? buildTextSnippet(text, query) : null,
  };
}

function mapCollectionDoc(
  doc: Record<string, unknown>,
  query?: string,
): SearchResult {
  const text = extractDocumentText("collections", doc);
  return {
    collection: "collections",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    status: (doc._status as string | null) ?? null,
    snippet: query ? buildTextSnippet(text, query) : null,
  };
}

function mapMediaDoc(
  doc: Record<string, unknown>,
  query?: string,
): SearchResult {
  const text = extractDocumentText("media", doc);
  const alt = (doc.alt as string | null) ?? null;
  const filename = (doc.filename as string | null) ?? null;
  return {
    collection: "media",
    id: doc.id as number,
    slug: filename,
    title: alt ?? filename,
    snippet: query ? buildTextSnippet(text, query) : null,
  };
}

function mapDoc(
  collection: SearchCollection,
  doc: Record<string, unknown>,
  query?: string,
): SearchResult {
  switch (collection) {
    case "products":
      return mapProductDoc(doc, query);
    case "pages":
      return mapPageDoc(doc, query);
    case "collections":
      return mapCollectionDoc(doc, query);
    case "media":
      return mapMediaDoc(doc, query);
  }
}

async function searchPagesWithBlocks(
  locale: ContentLocale,
  query: string | undefined,
  filters: SearchContentParams["filters"],
  limit: number,
  draft: boolean,
): Promise<{ results: SearchResult[]; totalDocs: number }> {
  const payload = await getCmsClient();
  const trimmedQuery = query?.trim();

  const sqlWhere = buildWhereClause(
    trimmedQuery,
    COLLECTION_TEXT_FIELDS.pages,
    filters,
  );

  const sqlResponse = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    where: sqlWhere,
    limit,
    depth: 0,
    overrideAccess: true,
    draft,
  });

  const seenIds = new Set<number>();
  const results: SearchResult[] = [];

  for (const doc of sqlResponse.docs) {
    const record = doc as unknown as Record<string, unknown>;
    const id = record.id as number;
    seenIds.add(id);
    results.push(mapPageDoc(record, trimmedQuery));
  }

  if (trimmedQuery) {
    const filterOnlyWhere = buildWhereClause(undefined, [], filters);
    const blockScan = await payload.find({
      collection: "pages",
      locale,
      fallbackLocale: "fr",
      where: filterOnlyWhere,
      limit: PAGE_BLOCK_SCAN_LIMIT,
      depth: 0,
      overrideAccess: true,
      draft,
    });

    for (const doc of blockScan.docs) {
      const record = doc as unknown as Record<string, unknown>;
      const id = record.id as number;
      if (seenIds.has(id)) continue;

      const text = extractPageText(record);
      if (!textMatchesQuery(text, trimmedQuery)) continue;

      seenIds.add(id);
      results.push(mapPageDoc(record, trimmedQuery));
      if (results.length >= limit) break;
    }
  }

  return { results, totalDocs: Math.max(sqlResponse.totalDocs, results.length) };
}

export async function searchContent(
  params: SearchContentParams,
): Promise<SearchContentResult> {
  const payload = await getCmsClient();
  const locale: ContentLocale = params.locale ?? "fr";
  const limit = params.limit ?? 20;
  const targets = params.collections ?? DEFAULT_COLLECTIONS;
  const draft = params.filters?.status === "draft";
  const trimmedQuery = params.query?.trim();

  const results: SearchResult[] = [];
  const byCollection: Record<string, number> = {};
  let totalDocs = 0;

  for (const collection of targets) {
    const access = assertReadableTarget(collection);
    if (!access.ok) continue;

    if (collection === "pages") {
      const pageSearch = await searchPagesWithBlocks(
        locale,
        trimmedQuery,
        params.filters,
        limit,
        draft,
      );
      byCollection.pages = pageSearch.totalDocs;
      totalDocs += pageSearch.totalDocs;
      results.push(...pageSearch.results);
      continue;
    }

    const where = buildWhereClause(
      trimmedQuery,
      COLLECTION_TEXT_FIELDS[collection],
      params.filters,
    );

    const response = await payload.find({
      collection,
      locale,
      fallbackLocale: "fr",
      where,
      limit,
      depth: 0,
      overrideAccess: true,
      draft,
    });

    byCollection[collection] = response.totalDocs;
    totalDocs += response.totalDocs;

    for (const doc of response.docs) {
      const record = doc as unknown as Record<string, unknown>;
      results.push(mapDoc(collection, record, trimmedQuery));
    }
  }

  return { results, totalDocs, byCollection };
}
