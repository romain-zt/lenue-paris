export type { ContentLocale } from "@repo/payload-schema/i18n/content-locales";

import type { ContentLocale } from "@repo/payload-schema/i18n/content-locales";

export type SearchCollection = "pages" | "products" | "collections" | "media";

export interface FieldManifest {
  name: string;
  type: string;
  localized?: boolean;
  required?: boolean;
  fields?: FieldManifest[];
}

export interface GetDocumentParams {
  collection: string;
  id?: string;
  locale?: ContentLocale;
  isGlobal?: boolean;
}

export interface SearchContentParams {
  query?: string;
  collections?: SearchCollection[];
  locale?: ContentLocale;
  filters?: {
    category?: string;
    inStock?: boolean;
    status?: "published" | "draft";
  };
  limit?: number;
}

export interface SearchResult {
  id: number;
  collection: SearchCollection;
  slug?: string | null;
  title?: string | null;
  snippet?: string | null;
  category?: string | null;
  price?: number | null;
  inStock?: boolean | null;
  status?: string | null;
}

export interface SearchContentResult {
  results: SearchResult[];
  totalDocs: number;
  byCollection: Record<string, number>;
}

export interface SiteSnapshot {
  siteSettings: Record<string, unknown>;
  designTokens: Record<string, unknown>;
  counts: {
    productsPublished: number;
    productsInStock: number;
    pagesPublished: number;
    collectionsPublished: number;
    ordersPending: number;
  };
}

export interface PatchDocumentParams {
  collection: string;
  id?: string;
  data: Record<string, unknown>;
  locale?: ContentLocale;
  isGlobal?: boolean;
  userId?: number | string;
}

export interface PatchDocumentResult {
  success: boolean;
  updatedFields?: string[];
  error?: string;
}

export interface SchemaCollectionManifest {
  slug: string;
  fields: FieldManifest[];
}

export interface SchemaManifest {
  collections: SchemaCollectionManifest[];
  globals: SchemaCollectionManifest[];
}

export type SemanticSearchCollection =
  | SearchCollection
  | "site-settings"
  | "design-tokens";

export interface SemanticSearchParams {
  query: string;
  locale?: ContentLocale;
  collections?: SemanticSearchCollection[];
  limit?: number;
}

export interface SemanticSearchResult {
  collection: SemanticSearchCollection;
  docId: string;
  locale: ContentLocale;
  fieldPath: string;
  text: string;
  similarity: number;
}
