export type ProductCategory = "dresses" | "bags" | "scarfs";

export interface ProductMedia {
  id: string;
  url?: string | null;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  price: number;
  mainImage: ProductMedia;
  _status?: "draft" | "published";
}

export interface ProductsResponse {
  docs: Product[];
  totalDocs: number;
  hasNextPage: boolean;
}
