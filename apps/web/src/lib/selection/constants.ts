export const MAX_SELECTION_ITEMS = 3;

/** Per-site localStorage key — derived from NEXT_PUBLIC_BRAND_SLUG to avoid cross-site bleed. */
export const SELECTION_STORAGE_KEY = process.env.NEXT_PUBLIC_BRAND_SLUG
  ? `${process.env.NEXT_PUBLIC_BRAND_SLUG}-selection-v1`
  : "site-selection-v1";
