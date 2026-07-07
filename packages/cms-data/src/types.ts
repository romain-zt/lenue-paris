export type { ContentLocale } from "@repo/payload-schema/i18n/content-locales";

import type { ContentLocale } from "@repo/payload-schema/i18n/content-locales";

export type SearchCollection = "pages" | "products" | "collections" | "media";
export type SearchableCollection = "pages" | "products" | "collections";

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
  collections?: SearchableCollection[];
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
  slug?: string;
  title?: string;
  snippet?: string;
}

export interface SearchResultItem {
  id: number;
  collection: SearchableCollection;
  slug: string | null;
  title: string | null;
  status: string | null;
  category?: string | null;
  price?: number | null;
  inStock?: boolean | null;
}

export interface SearchContentResult {
  results: SearchResultItem[];
  totalDocs: number;
  byCollection: Partial<Record<SearchableCollection, number>>;
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
