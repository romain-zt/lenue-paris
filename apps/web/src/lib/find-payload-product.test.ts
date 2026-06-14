import { describe, expect, it } from "vitest";
import { buildProductBySlugUrl } from "./find-payload-product";

describe("buildProductBySlugUrl", () => {
  it("builds a Payload products query filtered by slug and locale", () => {
    const url = buildProductBySlugUrl("https://cms.example/", {
      slug: "robe-lin",
      locale: "fr",
    });

    expect(url).toBe(
      "https://cms.example/api/products?locale=fr&limit=1&where%5Bslug%5D%5Bequals%5D=robe-lin",
    );
  });
});
