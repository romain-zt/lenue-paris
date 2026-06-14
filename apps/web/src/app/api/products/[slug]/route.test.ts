import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/find-payload-product", () => ({
  findPayloadProductBySlug: vi.fn(),
}));

import { findPayloadProductBySlug } from "@/lib/find-payload-product";
import { GET } from "./route";

const sampleDoc = {
  id: 7,
  slug: "robe-lin",
  name: "Robe en lin",
  description: "Description",
  price: 320,
  category: "robe" as const,
  available: true,
  images: [{ id: "img-1", image: { url: "https://cdn.example/robe.jpg" } }],
};

describe("GET /api/products/[slug]", () => {
  beforeEach(() => {
    vi.mocked(findPayloadProductBySlug).mockReset();
  });

  it("returns ProductDetailResponse contract shape", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(sampleDoc);

    const request = new NextRequest(
      "http://localhost:3001/api/products/robe-lin?locale=en",
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "robe-lin" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({
      product: {
        id: "7",
        slug: "robe-lin",
        name: "Robe en lin",
        description: "Description",
        price: 320,
        currency: "EUR",
        category: "robe",
        gallery: [
          {
            id: "img-1",
            url: "https://cdn.example/robe.jpg",
            alt: "Robe en lin",
          },
        ],
        orderHref: "/en/order/robe-lin",
        catalogueHref: "/en/catalogue",
      },
      locale: "en",
    });
  });

  it("returns 404 contract for missing slug", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3001/api/products/missing?locale=fr",
    );
    const response = await GET(request, {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "product_not_found",
      locale: "fr",
      catalogueHref: "/fr/catalogue",
    });
  });

  it("returns 500 when CMS fetch fails", async () => {
    vi.mocked(findPayloadProductBySlug).mockRejectedValue(new Error("CMS down"));

    const request = new NextRequest("http://localhost:3001/api/products/robe-lin");
    const response = await GET(request, {
      params: Promise.resolve({ slug: "robe-lin" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "product_unavailable",
    });
  });
});
