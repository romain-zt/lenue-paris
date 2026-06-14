import { describe, expect, it } from "vitest";
import { resolveGalleryImages } from "./gallery";
import {
  buildProductNotFoundResponse,
  fetchProductDetail,
  isProductAvailable,
  toProductDetail,
} from "./product-detail";
import { extractPlainTextFromRichText } from "./rich-text";

const sampleDoc = {
  id: 42,
  slug: "robe-lin",
  name: "Robe en lin",
  description: {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Une robe légère en lin." }],
        },
      ],
    },
  },
  price: 320,
  category: "robe" as const,
  available: true,
  images: [
    { id: "img-1", image: { url: "https://cdn.example/robe-1.jpg" } },
    { id: "img-2", image: { url: "https://cdn.example/robe-2.jpg" } },
  ],
};

describe("extractPlainTextFromRichText", () => {
  it("extracts paragraph text from Lexical JSON", () => {
    expect(extractPlainTextFromRichText(sampleDoc.description)).toBe(
      "Une robe légère en lin.",
    );
  });

  it("returns null for empty values", () => {
    expect(extractPlainTextFromRichText(null)).toBeNull();
    expect(extractPlainTextFromRichText("   ")).toBeNull();
  });
});

describe("resolveGalleryImages", () => {
  it("maps Payload images to gallery contract", () => {
    expect(resolveGalleryImages(sampleDoc)).toEqual([
      {
        id: "img-1",
        url: "https://cdn.example/robe-1.jpg",
        alt: "Robe en lin",
      },
      {
        id: "img-2",
        url: "https://cdn.example/robe-2.jpg",
        alt: "Robe en lin",
      },
    ]);
  });

  it("skips entries without a resolvable URL", () => {
    expect(
      resolveGalleryImages({
        name: "Test",
        images: [{ image: null }, { image: { url: "https://cdn.example/x.jpg" } }],
      }),
    ).toEqual([
      {
        id: "image-1",
        url: "https://cdn.example/x.jpg",
        alt: "Test",
      },
    ]);
  });
});

describe("toProductDetail", () => {
  it("maps a Payload doc to ProductDetail", () => {
    expect(toProductDetail(sampleDoc, "en")).toEqual({
      id: "42",
      slug: "robe-lin",
      name: "Robe en lin",
      description: "Une robe légère en lin.",
      price: 320,
      currency: "EUR",
      category: "robe",
      gallery: [
        {
          id: "img-1",
          url: "https://cdn.example/robe-1.jpg",
          alt: "Robe en lin",
        },
        {
          id: "img-2",
          url: "https://cdn.example/robe-2.jpg",
          alt: "Robe en lin",
        },
      ],
      variantPickers: null,
      orderHref: "/en/order/robe-lin",
      catalogueHref: "/en/catalogue",
    });
  });
});

describe("fetchProductDetail", () => {
  it("returns found when product is available", async () => {
    const result = await fetchProductDetail(
      { slug: "robe-lin", locale: "fr" },
      {
        findProductBySlug: async () => sampleDoc,
      },
    );

    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.response.locale).toBe("fr");
      expect(result.response.product.slug).toBe("robe-lin");
    }
  });

  it("returns not_found for unavailable products", async () => {
    const result = await fetchProductDetail(
      { slug: "robe-lin", locale: "fr" },
      {
        findProductBySlug: async () => ({ ...sampleDoc, available: false }),
      },
    );

    expect(result).toEqual({
      kind: "not_found",
      response: buildProductNotFoundResponse("fr"),
    });
  });

  it("returns not_found when slug is missing", async () => {
    const result = await fetchProductDetail(
      { slug: "  ", locale: "en" },
      {
        findProductBySlug: async () => sampleDoc,
      },
    );

    expect(result.kind).toBe("not_found");
  });
});

describe("isProductAvailable", () => {
  it("treats available=false as unavailable", () => {
    expect(isProductAvailable({ ...sampleDoc, available: false })).toBe(false);
    expect(isProductAvailable({ ...sampleDoc, available: true })).toBe(true);
    expect(isProductAvailable({ ...sampleDoc, available: undefined })).toBe(true);
  });
});
