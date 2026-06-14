import { fetchCatalogList } from "@repo/catalog";
import { NextRequest, NextResponse } from "next/server";
import { findPayloadProducts } from "@/lib/find-payload-products";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const { searchParams } = request.nextUrl;

  try {
    const response = await fetchCatalogList(
      {
        category: searchParams.get("category") ?? undefined,
        locale: searchParams.get("locale") ?? undefined,
      },
      { findProducts: findPayloadProducts },
    );

    const durationMs = Date.now() - startedAt;
    console.info("catalog.list.duration_ms", durationMs);

    return NextResponse.json(response);
  } catch (error) {
    console.error("catalog.list.error", error);
    return NextResponse.json(
      { error: "catalogue_unavailable" },
      { status: 500 },
    );
  }
}
