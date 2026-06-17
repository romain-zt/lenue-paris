import type { Product } from "@/types/product";

/** Signature robe slugs visible on the public storefront (client brief P1). */
export const PUBLIC_DRESS_SLUGS = ["robe-camille", "robe-louise", "robe-margot"] as const;

export type PublicDressSlug = (typeof PUBLIC_DRESS_SLUGS)[number];

export const STOREFRONT_PRODUCT_CATEGORY = "dresses" as const;

export function isPublicStorefrontSlug(slug: string): slug is PublicDressSlug {
  return (PUBLIC_DRESS_SLUGS as readonly string[]).includes(slug);
}

/** Buyer-facing catalogue: robes only, published signature trio (+ any other published dresses if seeded). */
export function filterStorefrontProducts(products: Product[]): Product[] {
  return products.filter((p) => p.category === STOREFRONT_PRODUCT_CATEGORY);
}
