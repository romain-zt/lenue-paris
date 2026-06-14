import { describe, expect, it } from "vitest";
import { buildProductsListUrl } from "./find-payload-products";

describe("buildProductsListUrl", () => {
  it("builds locale-only query when no category filter", () => {
    const url = buildProductsListUrl("http://localhost:3000", {
      locale: "fr",
    });

    expect(url).toBe("http://localhost:3000/api/products?locale=fr&limit=100");
  });

  it("adds Payload where clause for category filter", () => {
    const url = buildProductsListUrl("http://localhost:3000/", {
      locale: "en",
      where: { category: { equals: "robe" } },
    });

    expect(url).toBe(
      "http://localhost:3000/api/products?locale=en&limit=100&where%5Bcategory%5D%5Bequals%5D=robe",
    );
  });
});
