import { cmsCategoryForFilter, normalizeCategoryFilter } from "./category";
import { normalizeLocale } from "./locale";
import { toProductCard, type PayloadProductDoc } from "./product-card";
import type {
  CatalogListQuery,
  CatalogListResponse,
  ProductCategoryCms,
  ProductCategoryFilter,
  SupportedLocale,
} from "./types";

export interface CatalogListQueryInput {
  category?: string;
  locale?: string;
}

export interface PayloadProductsWhere {
  category?: { equals: ProductCategoryCms };
}

export interface CatalogProductFinder {
  findProducts(args: {
    where?: PayloadProductsWhere;
    locale: SupportedLocale;
  }): Promise<PayloadProductDoc[]>;
}

export function normalizeCatalogListQuery(
  input: CatalogListQueryInput,
): Required<CatalogListQuery> {
  return {
    category: normalizeCategoryFilter(input.category),
    locale: normalizeLocale(input.locale),
  };
}

export function buildPayloadProductsWhere(
  categoryFilter: ProductCategoryFilter,
): PayloadProductsWhere | undefined {
  const cmsCategory = cmsCategoryForFilter(categoryFilter);
  if (!cmsCategory) {
    return undefined;
  }
  return { category: { equals: cmsCategory } };
}

export function buildCatalogListResponse(
  docs: PayloadProductDoc[],
  query: Required<CatalogListQuery>,
): CatalogListResponse {
  return {
    products: docs.map((doc) => toProductCard(doc, query.locale)),
    category: query.category,
    locale: query.locale,
  };
}

export async function fetchCatalogList(
  input: CatalogListQueryInput,
  deps: { findProducts: CatalogProductFinder["findProducts"] },
): Promise<CatalogListResponse> {
  const query = normalizeCatalogListQuery(input);
  const where = buildPayloadProductsWhere(query.category);

  const docs = await deps.findProducts({
    where,
    locale: query.locale,
  });

  return buildCatalogListResponse(docs, query);
}
