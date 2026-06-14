/** Buyer-facing category filter keys shown in the catalogue UI. */
export const PRODUCT_CATEGORY_FILTERS = ["all", "dress", "bag", "scarf"] as const;

export type ProductCategoryFilter = (typeof PRODUCT_CATEGORY_FILTERS)[number];

/** Values stored on CMS `products.category` select field. */
export const PRODUCT_CATEGORY_CMS_VALUES = ["robe", "sac", "foulard", "autre"] as const;

export type ProductCategoryCms = (typeof PRODUCT_CATEGORY_CMS_VALUES)[number];

export const SUPPORTED_LOCALES = ["fr", "en", "ru"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type ProductCurrency = "EUR";

/** Normalized card shape for the catalogue grid (contract output). */
export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: ProductCurrency;
  category: ProductCategoryCms;
  thumbnailUrl: string | null;
  detailHref: string;
}

export interface CatalogListQuery {
  category?: ProductCategoryFilter;
  locale: SupportedLocale;
}

export interface CatalogListResponse {
  products: ProductCard[];
  category: ProductCategoryFilter;
  locale: SupportedLocale;
}
