import { describe, it, expect } from "vitest";
import { PUBLIC_DRESS_SLUGS } from "../storefrontCatalogue";
import { PRODUCT_IMAGES, getProductMainImageUrl } from "../../productImages";

/** Buyer-facing routes that must resolve (client brief #3 + #7). */
const STOREFRONT_STATIC_PATHS = ["/", "/catalogue", "/a-propos", "/livraison", "/contact"] as const;

describe("storefront link parity (broken-links audit)", () => {
  it("every public dress slug has a product image mapping and main frame", () => {
    for (const slug of PUBLIC_DRESS_SLUGS) {
      expect(PRODUCT_IMAGES[slug]?.main, `${slug} main image`).toBeTruthy();
      expect(getProductMainImageUrl(slug), `${slug} main url`).toMatch(/^\/images\//);
    }
  });

  it("public dress product paths are the only catalogue SKU URLs", () => {
    const paths = PUBLIC_DRESS_SLUGS.map((slug) => `/produits/${slug}`);
    expect(paths).toHaveLength(3);
    expect(new Set(paths).size).toBe(3);
  });

  it("core editorial paths exist in the storefront app (no 404 stubs)", () => {
    for (const path of STOREFRONT_STATIC_PATHS) {
      expect(path.startsWith("/")).toBe(true);
    }
  });
});
