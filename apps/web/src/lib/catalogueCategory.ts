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

/** Legacy bag/scarf query values from pre dress-only catalogue — treated as "all robes". */
const RETIRED_CATEGORY_QUERIES = new Set(["sacs", "foulards", "bags", "scarfs"]);

export function parseCategoryParam(value: string | null | undefined): ProductCategory | null {
  if (!value) return null;
  const key = value.toLowerCase();
  if (RETIRED_CATEGORY_QUERIES.has(key)) return null;
  return QUERY_TO_CATEGORY[key] ?? null;
}
