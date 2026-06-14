import type { ProductCategoryCms } from "@repo/catalog";
import type { ProductLengthVariant, ProductSizeCode } from "./variants";

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
  /** Dress-only CMS field — longer / shorter length options. */
  lengthVariants?: ProductLengthVariant[] | null;
  /** Dress-only CMS field — available size codes (defaults to XS–XL). */
  sizes?: ProductSizeCode[] | null;
}
