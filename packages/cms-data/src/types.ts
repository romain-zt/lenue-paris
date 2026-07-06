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
  query: string;
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
  slug?: string;
  title?: string;
  snippet?: string;
}

export interface SearchContentResult {
  results: SearchResult[];
  totalDocs: number;
  byCollection: Record<string, number>;
}

export interface SiteSnapshot {
  brandName: string;
  instagramUrl?: string | null;
  whatsappPhone?: string | null;
  designTokens: Record<string, unknown>;
  counts: {
    pages: number;
    products: number;
    collections: number;
    productsByCategory: Record<string, number>;
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
