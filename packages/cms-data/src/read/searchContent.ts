import { assertReadableTarget } from "../allowlists";
import { getCmsClient } from "../client";
import type {
  ContentLocale,
  SearchableCollection,
  SearchContentParams,
  SearchContentResult,
  SearchResultItem,
} from "../types";
import { buildWhereClause } from "./getDocument";

const COLLECTION_TEXT_FIELDS: Record<SearchableCollection, string[]> = {
  products: ["title", "slug", "description"],
  pages: ["title", "slug", "body"],
  collections: ["title", "slug"],
};

const DEFAULT_COLLECTIONS: SearchableCollection[] = [
  "products",
  "pages",
  "collections",
];

function mapProductDoc(doc: Record<string, unknown>): SearchResultItem {
  return {
    collection: "products",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    category: (doc.category as string | null) ?? null,
    price: (doc.price as number | null) ?? null,
    inStock: (doc.inStock as boolean | null) ?? null,
    status: (doc._status as string | null) ?? null,
  };
}

function mapPageDoc(doc: Record<string, unknown>): SearchResultItem {
  return {
    collection: "pages",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    status: (doc._status as string | null) ?? null,
  };
}

function mapCollectionDoc(doc: Record<string, unknown>): SearchResultItem {
  return {
    collection: "collections",
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? null,
    title: (doc.title as string | null) ?? null,
    status: (doc._status as string | null) ?? null,
  };
}

export async function searchContent(
  params: SearchContentParams,
): Promise<SearchContentResult> {
  const payload = await getCmsClient();
  const locale: ContentLocale = params.locale ?? "fr";
  const limit = params.limit ?? 20;
  const targets = params.collections ?? DEFAULT_COLLECTIONS;

  const results: SearchResultItem[] = [];
  const byCollection: Partial<Record<SearchableCollection, number>> = {};
  let totalDocs = 0;

  for (const collection of targets) {
    const access = assertReadableTarget(collection);
    if (!access.ok) continue;

    const where = buildWhereClause(
      params.query,
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
      draft: params.filters?.status === "draft",
    });

    byCollection[collection] = response.totalDocs;
    totalDocs += response.totalDocs;

    for (const doc of response.docs) {
      const record = doc as unknown as Record<string, unknown>;
      switch (collection) {
        case "products":
          results.push(mapProductDoc(record));
          break;
        case "pages":
          results.push(mapPageDoc(record));
          break;
        case "collections":
          results.push(mapCollectionDoc(record));
          break;
      }
    }
  }

  return { results, totalDocs, byCollection };
}
