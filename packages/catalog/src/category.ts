import type { ProductCategoryCms, ProductCategoryFilter } from "./types";

/** Maps buyer filter keys to CMS select values. */
export const FILTER_TO_CMS: Record<Exclude<ProductCategoryFilter, "all">, ProductCategoryCms> = {
  dress: "robe",
  bag: "sac",
  scarf: "foulard",
};

export function isProductCategoryFilter(value: string): value is ProductCategoryFilter {
  return value === "all" || value === "dress" || value === "bag" || value === "scarf";
}

export function normalizeCategoryFilter(value: string | undefined): ProductCategoryFilter {
  if (value === undefined || value === "") {
    return "all";
  }
  return isProductCategoryFilter(value) ? value : "all";
}

export function cmsCategoryForFilter(
  filter: ProductCategoryFilter,
): ProductCategoryCms | null {
  if (filter === "all") {
    return null;
  }
  return FILTER_TO_CMS[filter];
}
