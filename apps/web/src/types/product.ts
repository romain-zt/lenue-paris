export type ProductCategory = "dresses" | "bags" | "scarfs";

export type DressLength = "longer" | "shorter";
export type DressSize = "XS" | "S" | "M" | "L" | "XL";

export const DRESS_SIZES: DressSize[] = ["XS", "S", "M", "L", "XL"];
// Lengths are now keyed by value only; labels come from i18n translations
export const DRESS_LENGTH_VALUES: DressLength[] = ["longer", "shorter"];

export interface ProductMedia {
  id: string;
  url?: string | null;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface ProductGalleryItem {
  id?: string | null;
  image: ProductMedia;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  price: number;
  inStock?: boolean | null;
  mainImage: ProductMedia;
  gallery?: ProductGalleryItem[] | null;
  description?: string | null;
  _status?: "draft" | "published";
  availableLengths?: DressLength[] | null;
  availableSizes?: DressSize[] | null;
  pairings?: Array<{ id: string; title: string }> | null;
  /** Editorial small-series flag — not fake scarcity. */
  limitedSeries?: boolean | null;
}

export interface ProductsResponse {
  docs: Product[];
  totalDocs: number;
  hasNextPage: boolean;
}
