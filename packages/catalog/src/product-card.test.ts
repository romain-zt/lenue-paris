import { describe, expect, it } from "vitest";
import { buildDetailHref, resolveThumbnailUrl, toProductCard } from "./product-card";

describe("toProductCard", () => {
  it("maps a Payload product to a catalogue card", () => {
    const card = toProductCard(
      {
        id: 1,
        slug: "robe-lin",
        name: "Robe en lin",
        price: 320,
        category: "robe",
        images: [{ image: { url: "https://cdn.example/robe.jpg" } }],
      },
      "fr",
    );

    expect(card).toEqual({
      id: "1",
      slug: "robe-lin",
      name: "Robe en lin",
      price: 320,
      currency: "EUR",
      category: "robe",
      thumbnailUrl: "https://cdn.example/robe.jpg",
      detailHref: "/fr/products/robe-lin",
    });
  });

  it("uses locale in detail href", () => {
    expect(buildDetailHref("en", "sac-cuir")).toBe("/en/products/sac-cuir");
  });

  it("returns null thumbnail when images are missing", () => {
    expect(resolveThumbnailUrl(undefined)).toBeNull();
    expect(resolveThumbnailUrl([])).toBeNull();
    expect(resolveThumbnailUrl([{ image: null }])).toBeNull();
  });
});
