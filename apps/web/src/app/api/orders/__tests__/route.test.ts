import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

const mockProduct = {
  id: "prod-abc",
  title: "Robe en soie",
  slug: "robe-en-soie",
  category: "dresses" as const,
  price: 390,
  mainImage: { id: "img1", url: "/robe.jpg", alt: "Robe" },
};

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3001/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when productSlug is missing", async () => {
    const res = await POST(
      createRequest({
        buyerName: "Marie",
        buyerContact: "+33612345678",
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "productSlug is required" });
  });

  it("returns 400 when buyerName is missing", async () => {
    const res = await POST(
      createRequest({
        productSlug: "robe-en-soie",
        buyerContact: "+33612345678",
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "buyerName is required" });
  });

  it("returns 400 when buyerContact is missing", async () => {
    const res = await POST(
      createRequest({
        productSlug: "robe-en-soie",
        buyerName: "Marie",
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "buyerContact is required" });
  });

  it("returns 404 when product lookup returns empty docs", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [] }),
    } as Response);

    const res = await POST(
      createRequest({
        productSlug: "unknown-slug",
        buyerName: "Marie",
        buyerContact: "+33612345678",
      })
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Product not found" });
  });

  it("returns 201 with id when product found and order created successfully", async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ docs: [mockProduct] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ doc: { id: "order-123" } }),
      } as Response);

    const res = await POST(
      createRequest({
        productSlug: "robe-en-soie",
        buyerName: "Marie",
        buyerContact: "+33612345678",
        length: "longer",
        size: "M",
        price: 1,
        productTitle: "Fake Title",
        category: "bags",
      })
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "order-123" });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    const productCall = mockFetch.mock.calls[0]!;
    expect(productCall[0]).toBe(
      "http://localhost:3001/api/products?where[slug][equals]=robe-en-soie&draft=false&limit=1"
    );

    const orderCall = mockFetch.mock.calls[1]!;
    expect(orderCall[0]).toBe("http://localhost:3001/api/orders");
    const orderBody = JSON.parse((orderCall[1] as RequestInit).body as string);
    expect(orderBody).toEqual({
      product: "prod-abc",
      productTitle: "Robe en soie",
      category: "dresses",
      price: 390,
      length: "longer",
      size: "M",
      buyerName: "Marie",
      buyerContact: "+33612345678",
    });
  });

  it("returns 500 when order creation fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ docs: [mockProduct] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: [{ message: "Validation failed" }] }),
      } as Response);

    const res = await POST(
      createRequest({
        productSlug: "robe-en-soie",
        buyerName: "Marie",
        buyerContact: "+33612345678",
      })
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to save order" });
  });
});
