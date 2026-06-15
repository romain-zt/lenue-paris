import { NextRequest, NextResponse } from "next/server";
import type { CreateOrderRequest } from "@/types/order";
import { getPayload } from "payload";
import config from "@payload-config";

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

  const payload = await getPayload({ config });

  const { docs: productDocs } = await payload.find({
    collection: "products",
    where: { slug: { equals: productSlug } },
    draft: false,
    limit: 1,
  });

  const product = productDocs[0];
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let order: { id: string | number };
  try {
    order = await payload.create({
      collection: "orders",
      data: {
        product: product.id,
        productTitle: product.title as string,
        category: product.category as "dresses" | "bags" | "scarfs",
        price: product.price,
        length: (body.length ?? null) as "longer" | "shorter" | null | undefined,
        size: (body.size ?? null) as "XS" | "S" | "M" | "L" | "XL" | null | undefined,
        buyerName,
        buyerContact,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  return NextResponse.json({ id: order.id }, { status: 201 });
}
