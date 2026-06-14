import type { ProductCategoryCms, ProductCard, SupportedLocale } from "./types";

/** Minimal Payload product document shape for catalogue mapping. */
export interface PayloadProductDoc {
  id: string | number;
  slug: string;
  name: string;
  price: number;
  currency?: string | null;
  category: ProductCategoryCms;
  images?: Array<{ image?: { url?: string | null } | string | null }> | null;
}

export function buildDetailHref(locale: SupportedLocale, slug: string): string {
  return `/${locale}/products/${slug}`;
}

export function resolveThumbnailUrl(
  images: PayloadProductDoc["images"],
): string | null {
  const first = images?.[0]?.image;
  if (!first) {
    return null;
  }
  if (typeof first === "string") {
    return first;
  }
  return first.url ?? null;
}

export function toProductCard(
  doc: PayloadProductDoc,
  locale: SupportedLocale,
): ProductCard {
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    price: doc.price,
    currency: "EUR",
    category: doc.category,
    thumbnailUrl: resolveThumbnailUrl(doc.images),
    detailHref: buildDetailHref(locale, doc.slug),
  };
}
