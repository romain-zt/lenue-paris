import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts, formatPrice } from "../lib/products";

describe("getProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns docs array when fetch succeeds", async () => {
    const mockProduct = {
      id: "abc",
      title: "Robe Rouge",
      slug: "robe-rouge",
      category: "dresses",
      price: 12900,
      images: [{ image: { url: "/img.jpg", alt: "Robe", width: 800, height: 1000 } }],
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [mockProduct], totalDocs: 1 }),
    } as Response);

    const products = await getProducts("fr");
    expect(products).toHaveLength(1);
    const product = products[0]!;
    expect(product.slug).toBe("robe-rouge");
    expect(product.category).toBe("dresses");
  });

  it("returns empty array when fetch returns not-ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    const products = await getProducts("fr");
    expect(products).toEqual([]);
  });

  it("returns empty array when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    const products = await getProducts("fr");
    expect(products).toEqual([]);
  });
});

describe("formatPrice", () => {
  it("formats EUR cents as human-readable price", () => {
    expect(formatPrice(12900)).toContain("129");
    expect(formatPrice(12900)).toContain("€");
  });
});
