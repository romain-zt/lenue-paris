import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/find-payload-products", () => ({
  findPayloadProducts: vi.fn(),
}));

import { findPayloadProducts } from "@/lib/find-payload-products";
import { GET } from "./route";

const sampleDoc = {
  id: 1,
  slug: "robe-lin",
  name: "Robe en lin",
  price: 320,
  category: "robe" as const,
  images: [{ image: { url: "https://cdn.example/robe.jpg" } }],
};

describe("GET /api/catalog", () => {
  beforeEach(() => {
    vi.mocked(findPayloadProducts).mockReset();
  });

  it("returns CatalogListResponse contract shape", async () => {
    vi.mocked(findPayloadProducts).mockResolvedValue([sampleDoc]);

    const request = new NextRequest(
      "http://localhost:3001/api/catalog?category=dress&locale=en",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      products: [
        {
          id: "1",
          slug: "robe-lin",
          name: "Robe en lin",
          price: 320,
          currency: "EUR",
          category: "robe",
          thumbnailUrl: "https://cdn.example/robe.jpg",
          detailHref: "/en/products/robe-lin",
        },
      ],
      category: "dress",
      locale: "en",
    });
  });

  it("normalizes invalid query params to defaults", async () => {
    vi.mocked(findPayloadProducts).mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3001/api/catalog?category=invalid&locale=de",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(body.category).toBe("all");
    expect(body.locale).toBe("fr");
    expect(body.products).toEqual([]);
  });

  it("returns 500 when CMS fetch fails", async () => {
    vi.mocked(findPayloadProducts).mockRejectedValue(new Error("CMS down"));

    const request = new NextRequest("http://localhost:3001/api/catalog");
    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "catalogue_unavailable",
    });
  });
});
