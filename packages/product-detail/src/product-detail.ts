import { buildDetailHref, normalizeLocale, type SupportedLocale } from "@repo/catalog";
import { resolveGalleryImages } from "./gallery";
import type { PayloadProductDetailDoc } from "./payload-doc";
import { extractPlainTextFromRichText } from "./rich-text";
import type {
  ProductDetail,
  ProductDetailQuery,
  ProductDetailResponse,
  ProductDetailResult,
  ProductNotFoundResponse,
} from "./types";

export interface ProductDetailQueryInput {
  slug?: string;
  locale?: string;
}

export interface ProductBySlugFinder {
  findProductBySlug(args: {
    slug: string;
    locale: SupportedLocale;
  }): Promise<PayloadProductDetailDoc | null>;
}

export function normalizeProductDetailQuery(
  input: ProductDetailQueryInput,
): ProductDetailQuery | null {
  const slug = input.slug?.trim();
  if (!slug) {
    return null;
  }

  return {
    slug,
    locale: normalizeLocale(input.locale),
  };
}

export function buildOrderHref(locale: SupportedLocale, slug: string): string {
  return `/${locale}/order/${slug}`;
}

export function buildCatalogueHref(locale: SupportedLocale): string {
  return `/${locale}/catalogue`;
}

export function isProductAvailable(doc: PayloadProductDetailDoc): boolean {
  return doc.available !== false;
}

export function toProductDetail(
  doc: PayloadProductDetailDoc,
  locale: SupportedLocale,
): ProductDetail {
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    description: extractPlainTextFromRichText(doc.description),
    price: doc.price,
    currency: "EUR",
    category: doc.category,
    gallery: resolveGalleryImages(doc),
    orderHref: buildOrderHref(locale, doc.slug),
    catalogueHref: buildCatalogueHref(locale),
  };
}

export function buildProductDetailResponse(
  doc: PayloadProductDetailDoc,
  locale: SupportedLocale,
): ProductDetailResponse {
  return {
    product: toProductDetail(doc, locale),
    locale,
  };
}

export function buildProductNotFoundResponse(
  locale: SupportedLocale,
): ProductNotFoundResponse {
  return {
    error: "product_not_found",
    locale,
    catalogueHref: buildCatalogueHref(locale),
  };
}

export async function fetchProductDetail(
  input: ProductDetailQueryInput,
  deps: { findProductBySlug: ProductBySlugFinder["findProductBySlug"] },
): Promise<ProductDetailResult> {
  const query = normalizeProductDetailQuery(input);
  if (!query) {
    const locale = normalizeLocale(input.locale);
    return {
      kind: "not_found",
      response: buildProductNotFoundResponse(locale),
    };
  }

  const doc = await deps.findProductBySlug({
    slug: query.slug,
    locale: query.locale,
  });

  if (!doc || !isProductAvailable(doc)) {
    return {
      kind: "not_found",
      response: buildProductNotFoundResponse(query.locale),
    };
  }

  return {
    kind: "found",
    response: buildProductDetailResponse(doc, query.locale),
  };
}

export { buildDetailHref };
