import type { ProductCategoryCms } from "@repo/catalog";

/** Minimal Payload product document shape for detail mapping. */
export interface PayloadProductDetailDoc {
  id: string | number;
  slug: string;
  name: string;
  description?: unknown;
  price: number;
  currency?: string | null;
  category: ProductCategoryCms;
  available?: boolean | null;
  images?: Array<{ id?: string | number; image?: { url?: string | null } | string | null }> | null;
}
