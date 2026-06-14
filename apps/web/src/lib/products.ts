export type ProductCategory = "dresses" | "bags" | "scarfs";

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  price: number;
  images: Array<{ image: ProductImage }>;
};

type CmsProductsResponse = {
  docs?: Product[];
  totalDocs?: number;
};

export async function getProducts(
  locale: string = "fr"
): Promise<Product[]> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/products?where[_status][equals]=published&locale=${locale}&depth=1&limit=100`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as CmsProductsResponse;
    return data.docs ?? [];
  } catch {
    return [];
  }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
