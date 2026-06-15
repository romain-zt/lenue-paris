import { NextRequest, NextResponse } from "next/server";
import type { CreateOrderRequest } from "@/types/order";
import type { Product } from "@/types/product";

const CMS_URL = process.env.CMS_URL ?? "http://localhost:3001";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: NextRequest) {
  let body: CreateOrderRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNonEmptyString(body.productSlug)) {
    return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
  }
  if (!isNonEmptyString(body.buyerName)) {
    return NextResponse.json({ error: "buyerName is required" }, { status: 400 });
  }
  if (!isNonEmptyString(body.buyerContact)) {
    return NextResponse.json({ error: "buyerContact is required" }, { status: 400 });
  }

  const productSlug = body.productSlug.trim();
  const buyerName = body.buyerName.trim();
  const buyerContact = body.buyerContact.trim();

  const productUrl = `${CMS_URL}/api/products?where[slug][equals]=${encodeURIComponent(productSlug)}&draft=false&limit=1`;

  let productRes: Response;
  try {
    productRes = await fetch(productUrl);
  } catch {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  if (!productRes.ok) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const productData = (await productRes.json()) as { docs: Product[] };
  const product = productData.docs?.[0];

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const orderPayload = {
    product: product.id,
    productTitle: product.title,
    category: product.category,
    price: product.price,
    length: body.length ?? null,
    size: body.size ?? null,
    buyerName,
    buyerContact,
  };

  let orderRes: Response;
  try {
    orderRes = await fetch(`${CMS_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
  } catch {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  if (!orderRes.ok) {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  const orderData = (await orderRes.json()) as { doc: { id: string } };
  const orderId = orderData.doc?.id;

  if (!orderId) {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  return NextResponse.json({ id: orderId }, { status: 201 });
}
