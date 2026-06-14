import { describe, expect, it, vi } from "vitest";
import type { PayloadProductDoc } from "./product-card";
import {
  buildCatalogListResponse,
  buildPayloadProductsWhere,
  fetchCatalogList,
  normalizeCatalogListQuery,
} from "./catalog-list";

const sampleDocs: PayloadProductDoc[] = [
  {
    id: 1,
    slug: "robe-lin",
    name: "Robe en lin",
    price: 320,
    category: "robe",
    images: [{ image: { url: "https://cdn.example/robe.jpg" } }],
  },
  {
    id: 2,
    slug: "sac-cuir",
    name: "Sac en cuir",
    price: 890,
    category: "sac",
  },
  {
    id: 3,
    slug: "foulard-soie",
    name: "Foulard en soie",
    price: 120,
    category: "foulard",
  },
];

describe("normalizeCatalogListQuery", () => {
  it("defaults category to all and locale to fr", () => {
    expect(normalizeCatalogListQuery({})).toEqual({
      category: "all",
      locale: "fr",
    });
  });

  it("normalizes invalid category and locale to defaults", () => {
    expect(
      normalizeCatalogListQuery({ category: "invalid", locale: "de" }),
    ).toEqual({
      category: "all",
      locale: "fr",
    });
  });

  it("preserves valid category and locale", () => {
    expect(
      normalizeCatalogListQuery({ category: "dress", locale: "en" }),
    ).toEqual({
      category: "dress",
      locale: "en",
    });
  });
});

describe("buildPayloadProductsWhere", () => {
  it("returns undefined for all categories", () => {
    expect(buildPayloadProductsWhere("all")).toBeUndefined();
  });

  it("maps dress filter to robe CMS value", () => {
    expect(buildPayloadProductsWhere("dress")).toEqual({
      category: { equals: "robe" },
    });
  });

  it("maps bag and scarf filters to CMS values", () => {
    expect(buildPayloadProductsWhere("bag")).toEqual({
      category: { equals: "sac" },
    });
    expect(buildPayloadProductsWhere("scarf")).toEqual({
      category: { equals: "foulard" },
    });
  });
});

describe("buildCatalogListResponse", () => {
  it("maps docs to product cards with query metadata", () => {
    const response = buildCatalogListResponse(sampleDocs, {
      category: "all",
      locale: "fr",
    });

    expect(response.category).toBe("all");
    expect(response.locale).toBe("fr");
    expect(response.products).toHaveLength(3);
    expect(response.products[0]?.detailHref).toBe("/fr/products/robe-lin");
  });
});

describe("fetchCatalogList", () => {
  it("queries Payload with category where clause and maps results", async () => {
    const findProducts = vi.fn().mockResolvedValue([sampleDocs[0]]);

    const response = await fetchCatalogList(
      { category: "dress", locale: "en" },
      { findProducts },
    );

    expect(findProducts).toHaveBeenCalledWith({
      where: { category: { equals: "robe" } },
      locale: "en",
    });
    expect(response.products).toHaveLength(1);
    expect(response.products[0]?.slug).toBe("robe-lin");
    expect(response.category).toBe("dress");
    expect(response.locale).toBe("en");
  });

  it("omits where clause when category is all", async () => {
    const findProducts = vi.fn().mockResolvedValue(sampleDocs);

    await fetchCatalogList({ category: "all", locale: "fr" }, { findProducts });

    expect(findProducts).toHaveBeenCalledWith({
      where: undefined,
      locale: "fr",
    });
  });

  it("returns empty products when finder returns no matches", async () => {
    const findProducts = vi.fn().mockResolvedValue([]);

    const response = await fetchCatalogList(
      { category: "scarf", locale: "fr" },
      { findProducts },
    );

    expect(response.products).toEqual([]);
    expect(response.category).toBe("scarf");
  });
});
