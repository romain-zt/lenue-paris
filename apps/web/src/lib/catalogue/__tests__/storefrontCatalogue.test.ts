import { describe, expect, it } from "vitest";
import {
  PUBLIC_DRESS_SLUGS,
  filterStorefrontProducts,
  isPublicStorefrontSlug,
} from "../storefrontCatalogue";
import type { Product } from "@/types/product";

const dress = (slug: string): Product => ({
  id: slug,
  slug,
  title: slug,
  category: "dresses",
  price: 100,
  inStock: true,
  mainImage: { id: "1", url: "/x.jpg", alt: "x" },
});

const bag: Product = {
  id: "sac",
  slug: "sac-celeste",
  title: "Sac",
  category: "bags",
  price: 100,
  inStock: true,
  mainImage: { id: "2", url: "/y.jpg", alt: "y" },
};

describe("storefrontCatalogue", () => {
  it("PUBLIC_DRESS_SLUGS has three signature robes", () => {
    expect(PUBLIC_DRESS_SLUGS).toEqual(["robe-camille", "robe-louise", "robe-margot"]);
  });

  it("isPublicStorefrontSlug accepts signature slugs only", () => {
    expect(isPublicStorefrontSlug("robe-camille")).toBe(true);
    expect(isPublicStorefrontSlug("sac-celeste")).toBe(false);
  });

  it("filterStorefrontProducts drops non-dress categories", () => {
    const filtered = filterStorefrontProducts([dress("robe-camille"), bag]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("robe-camille");
  });
});
