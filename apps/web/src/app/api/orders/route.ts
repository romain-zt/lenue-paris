import {
  buildWhatsAppHandoff,
  validateOrderInput,
} from "@repo/checkout";
import { fetchProductDetail } from "@repo/product-detail";
import { NextRequest, NextResponse } from "next/server";
import { createPayloadOrder } from "@/lib/create-payload-order";
import { findPayloadProductBySlug } from "@/lib/find-payload-product";
import { parseCreateOrderBody } from "@/lib/parse-create-order-body";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const parsed = await parseCreateOrderBody(request);

  if (!parsed.ok) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const input = parsed.input;

  try {
    const productResult = await fetchProductDetail(
      { slug: input.productSlug, locale: input.locale },
      { findProductBySlug: findPayloadProductBySlug },
    );

    if (productResult.kind === "not_found") {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 });
    }

    const { product } = productResult.response;
    const validationErrors = validateOrderInput(input, {
      variantPickers: product.variantPickers,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    const customerName = input.customerName.trim();
    const customerPhone = input.customerPhone.trim();
    const customerEmail = input.customerEmail?.trim();

    const handoff = buildWhatsAppHandoff(
      {
        locale: input.locale,
        customerName,
        customerPhone,
        customerEmail,
        productName: product.name,
        productSlug: product.slug,
        priceEur: product.price,
        length: input.length,
        size: input.size,
      },
      process.env.WHATSAPP_ORDER_NUMBER ?? process.env.WHATSAPP_PHONE,
    );

    const saved = await createPayloadOrder({
      customerName,
      customerPhone,
      customerEmail,
      productId: product.id,
      length: input.length,
      size: input.size,
      priceEur: product.price,
      locale: input.locale,
      message: handoff.messageText,
    });

    if (!saved) {
      console.error("checkout.order.create.failure", { slug: input.productSlug });
      return NextResponse.json({ error: "order_save_failed" }, { status: 500 });
    }

    console.info("checkout.order.create.success", {
      orderId: saved.id,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { id: saved.id, whatsappUrl: handoff.url },
      { status: 201 },
    );
  } catch (error) {
    console.error("checkout.order.create.failure", error);
    return NextResponse.json({ error: "order_save_failed" }, { status: 500 });
  }
}
