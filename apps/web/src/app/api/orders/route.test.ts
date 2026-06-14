import { DEFAULT_WHATSAPP_ORDER_NUMBER } from "@repo/checkout";
import type { PayloadProductDetailDoc } from "@repo/product-detail";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/find-payload-product", () => ({
  findPayloadProductBySlug: vi.fn(),
}));

vi.mock("@/lib/create-payload-order", () => ({
  createPayloadOrder: vi.fn(),
}));

import { createPayloadOrder } from "@/lib/create-payload-order";
import { findPayloadProductBySlug } from "@/lib/find-payload-product";
import { POST } from "./route";

const dressDoc: PayloadProductDetailDoc = {
  id: 7,
  slug: "robe-lin",
  name: "Robe en lin",
  description: "Description",
  price: 320,
  category: "robe" as const,
  available: true,
  images: [{ id: "img-1", image: { url: "https://cdn.example/robe.jpg" } }],
  lengthVariants: ["longer", "shorter"],
  sizes: ["S", "M", "L"],
};

const validDressBody = {
  customerName: "Anna",
  customerPhone: "+33612345678",
  customerEmail: "anna@example.com",
  productSlug: "robe-lin",
  locale: "fr",
  length: "longer",
  size: "M",
};

function postOrders(body: unknown) {
  return POST(
    new NextRequest("http://localhost:3001/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.mocked(findPayloadProductBySlug).mockReset();
    vi.mocked(createPayloadOrder).mockReset();
  });

  it("returns 201 with whatsappUrl for valid dress order fixture", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(dressDoc);
    vi.mocked(createPayloadOrder).mockResolvedValue({ id: "order-42" });

    const response = await postOrders(validDressBody);

    expect(response.status).toBe(201);
    const body = await response.json();

    expect(body.id).toBe("order-42");
    expect(body.whatsappUrl).toMatch(
      new RegExp(`^https://wa\\.me/${DEFAULT_WHATSAPP_ORDER_NUMBER}\\?text=`),
    );
    expect(decodeURIComponent(body.whatsappUrl)).toContain("Robe en lin");
    expect(vi.mocked(createPayloadOrder)).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Anna",
        customerPhone: "+33612345678",
        productId: "7",
        priceEur: 320,
        locale: "fr",
        length: "longer",
        size: "M",
      }),
    );
  });

  it("returns 400 when dress missing length or size", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(dressDoc);

    const response = await postOrders({
      ...validDressBody,
      length: undefined,
      size: undefined,
    });

    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body.errors.map((error: { field: string }) => error.field)).toEqual([
      "length",
      "size",
    ]);
    expect(vi.mocked(createPayloadOrder)).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown slug", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(null);

    const response = await postOrders(validDressBody);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "product_not_found" });
    expect(vi.mocked(createPayloadOrder)).not.toHaveBeenCalled();
  });

  it("returns 500 when Payload order save fails", async () => {
    vi.mocked(findPayloadProductBySlug).mockResolvedValue(dressDoc);
    vi.mocked(createPayloadOrder).mockResolvedValue(null);

    const response = await postOrders(validDressBody);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "order_save_failed" });
  });
});
