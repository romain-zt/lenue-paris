import type { ProductCategory } from "@/types/product";

/** URL query values used in nav links (`?categorie=robes`). */
const QUERY_TO_CATEGORY: Record<string, ProductCategory> = {
  robes: "dresses",
  sacs: "bags",
  foulards: "scarfs",
  dresses: "dresses",
  bags: "bags",
  scarfs: "scarfs",
};

export const CATEGORY_TO_QUERY: Record<ProductCategory, string> = {
  dresses: "robes",
  bags: "sacs",
  scarfs: "foulards",
};

export function parseCategoryParam(value: string | null | undefined): ProductCategory | null {
  if (!value) return null;
  return QUERY_TO_CATEGORY[value.toLowerCase()] ?? null;
}
