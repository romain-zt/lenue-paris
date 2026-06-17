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
  it("PUBLIC_DRESS_SLUGS has exactly four signature robes (AC-2)", () => {
    expect(PUBLIC_DRESS_SLUGS).toEqual(["robe-camille", "robe-louise", "robe-margot", "robe-heloise"]);
    expect(PUBLIC_DRESS_SLUGS).toHaveLength(4);
  });

  it("isPublicStorefrontSlug accepts all four signature slugs (AC-2)", () => {
    expect(isPublicStorefrontSlug("robe-camille")).toBe(true);
    expect(isPublicStorefrontSlug("robe-louise")).toBe(true);
    expect(isPublicStorefrontSlug("robe-margot")).toBe(true);
    expect(isPublicStorefrontSlug("robe-heloise")).toBe(true);
  });

  it("isPublicStorefrontSlug rejects bags (AC-4)", () => {
    expect(isPublicStorefrontSlug("sac-celeste")).toBe(false);
    expect(isPublicStorefrontSlug("sac-juliette")).toBe(false);
    expect(isPublicStorefrontSlug("sac-amelie")).toBe(false);
    expect(isPublicStorefrontSlug("sac-victoire")).toBe(false);
  });

  it("isPublicStorefrontSlug rejects scarfs (AC-4)", () => {
    expect(isPublicStorefrontSlug("foulard-diane")).toBe(false);
    expect(isPublicStorefrontSlug("foulard-aurore")).toBe(false);
    expect(isPublicStorefrontSlug("foulard-claire")).toBe(false);
    expect(isPublicStorefrontSlug("foulard-iris")).toBe(false);
  });

  it("isPublicStorefrontSlug rejects non-signature dresses (AC-4)", () => {
    expect(isPublicStorefrontSlug("look-elise-edition-limitee")).toBe(false);
    expect(isPublicStorefrontSlug("robe-inconnue")).toBe(false);
  });

  it("filterStorefrontProducts drops bags (AC-1)", () => {
    const filtered = filterStorefrontProducts([dress("robe-camille"), bag]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("robe-camille");
  });

  it("filterStorefrontProducts drops scarfs (AC-1)", () => {
    const scarf: Product = { ...bag, id: "foulard", slug: "foulard-diane", category: "scarfs" };
    const filtered = filterStorefrontProducts([dress("robe-camille"), scarf]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.category).toBe("dresses");
  });

  it("filterStorefrontProducts keeps all four signature dresses (AC-2)", () => {
    const products = PUBLIC_DRESS_SLUGS.map(dress);
    const filtered = filterStorefrontProducts(products);
    expect(filtered).toHaveLength(4);
    expect(filtered.map((p) => p.slug)).toEqual([...PUBLIC_DRESS_SLUGS]);
  });
});
