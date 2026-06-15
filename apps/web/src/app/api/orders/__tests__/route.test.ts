import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@payload-config", () => ({ default: {} }));

const { mockPayload } = vi.hoisted(() => ({
  mockPayload: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("payload", () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}));

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
    vi.clearAllMocks();
  });

  it("returns 400 when productSlug is missing", async () => {
    const res = await POST(createRequest({ buyerName: "Marie", buyerContact: "+33612345678" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "productSlug is required" });
  });

  it("returns 400 when buyerName is missing", async () => {
    const res = await POST(
      createRequest({ productSlug: "robe-en-soie", buyerContact: "+33612345678" })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "buyerName is required" });
  });

  it("returns 400 when buyerContact is missing", async () => {
    const res = await POST(
      createRequest({ productSlug: "robe-en-soie", buyerName: "Marie" })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "buyerContact is required" });
  });

  it("returns 404 when product lookup returns empty docs", async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [] });

    const res = await POST(
      createRequest({ productSlug: "unknown-slug", buyerName: "Marie", buyerContact: "+33612345678" })
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Product not found" });
  });

  it("returns 201 with id when product found and order created successfully", async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [mockProduct] });
    mockPayload.create.mockResolvedValueOnce({ id: "order-123" });

    const res = await POST(
      createRequest({
        productSlug: "robe-en-soie",
        buyerName: "Marie",
        buyerContact: "+33612345678",
        length: "longer",
        size: "M",
      })
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "order-123" });

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        where: { slug: { equals: "robe-en-soie" } },
      })
    );
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          product: "prod-abc",
          productTitle: "Robe en soie",
          category: "dresses",
          price: 390,
          length: "longer",
          size: "M",
          buyerName: "Marie",
          buyerContact: "+33612345678",
        }),
      })
    );
  });

  it("returns 500 when order creation throws", async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [mockProduct] });
    mockPayload.create.mockRejectedValueOnce(new Error("DB error"));

    const res = await POST(
      createRequest({ productSlug: "robe-en-soie", buyerName: "Marie", buyerContact: "+33612345678" })
    );
    expect(res.status).toBe(500);
  });
});
