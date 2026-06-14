import { fetchProductDetail } from "@repo/product-detail";
import { NextRequest, NextResponse } from "next/server";
import { findPayloadProductBySlug } from "@/lib/find-payload-product";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const startedAt = Date.now();
  const { slug } = await context.params;
  const locale = request.nextUrl.searchParams.get("locale") ?? undefined;

  try {
    const result = await fetchProductDetail(
      { slug, locale },
      { findProductBySlug: findPayloadProductBySlug },
    );

    const durationMs = Date.now() - startedAt;

    if (result.kind === "not_found") {
      console.info("product.detail.not_found", { slug, locale: result.response.locale });
      return NextResponse.json(result.response, { status: 404 });
    }

    console.info("product.detail.duration_ms", durationMs);
    return NextResponse.json(result.response);
  } catch (error) {
    console.error("product.detail.error", error);
    return NextResponse.json(
      { error: "product_unavailable" },
      { status: 500 },
    );
  }
}
