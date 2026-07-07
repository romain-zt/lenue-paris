import { describe, expect, it } from "vitest";
import { getSchemaManifest, formatSchemaManifest } from "./getSchemaManifest";
import { buildWhereClause } from "./getDocument";

describe("getSchemaManifest", () => {
  it("includes design-tokens and site-settings globals", () => {
    const manifest = getSchemaManifest();
    const slugs = manifest.globals.map((g) => g.slug);
    expect(slugs).toContain("design-tokens");
    expect(slugs).toContain("site-settings");
  });

  it("includes products with inStock and localized title", () => {
    const manifest = getSchemaManifest();
    const products = manifest.collections.find((c) => c.slug === "products");
    expect(products).toBeDefined();

    const title = products!.fields.find((f) => f.name === "title");
    const inStock = products!.fields.find((f) => f.name === "inStock");
    expect(title?.localized).toBe(true);
    expect(inStock?.type).toBe("checkbox");
  });

  it("includes page blocks with localized hero fields", () => {
    const manifest = getSchemaManifest();
    const pages = manifest.collections.find((c) => c.slug === "pages");
    const blocks = pages?.fields.find((f) => f.name === "blocks");
    const hero = blocks?.fields?.find((f) => f.name === "hero");
    const tagline = hero?.fields?.find((f) => f.name === "tagline");
    expect(tagline?.localized).toBe(true);
  });

  it("formats manifest without hardcoded stale collection names", () => {
    const formatted = formatSchemaManifest(getSchemaManifest());
    expect(formatted).toContain("design-tokens");
    expect(formatted).toContain("colorPrimary");
    expect(formatted).not.toContain("seo (group)");
  });
});

describe("buildWhereClause", () => {
  it("combines text search and product filters", () => {
    const where = buildWhereClause("robe", ["title", "slug"], {
      category: "dresses",
      inStock: true,
      status: "published",
    });
    expect(where).toEqual({
      and: [
        { or: [{ title: { contains: "robe" } }, { slug: { contains: "robe" } }] },
        { category: { equals: "dresses" } },
        { inStock: { equals: true } },
        { _status: { equals: "published" } },
      ],
    });
  });

  it("supports filter-only queries without text", () => {
    const where = buildWhereClause(undefined, ["title"], {
      category: "dresses",
      inStock: true,
      status: "published",
    });
    expect(where).toEqual({
      and: [
        { category: { equals: "dresses" } },
        { inStock: { equals: true } },
        { _status: { equals: "published" } },
      ],
    });
  });
});
