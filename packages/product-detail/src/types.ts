import type { ProductCategoryCms, SupportedLocale } from "@repo/catalog";

export type ProductCurrency = "EUR";

export interface ProductGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: ProductCurrency;
  category: ProductCategoryCms;
  gallery: ProductGalleryImage[];
  orderHref: string;
  catalogueHref: string;
}

export interface ProductDetailQuery {
  slug: string;
  locale: SupportedLocale;
}

export interface ProductDetailResponse {
  product: ProductDetail;
  locale: SupportedLocale;
}

export interface ProductNotFoundResponse {
  error: "product_not_found";
  locale: SupportedLocale;
  catalogueHref: string;
}

export type ProductDetailResult =
  | { kind: "found"; response: ProductDetailResponse }
  | { kind: "not_found"; response: ProductNotFoundResponse };
