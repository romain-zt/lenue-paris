import type { CatalogSummary, ContentLocale } from "../types";
import { searchContent } from "./searchContent";

export async function getCatalogSummary(
  locale: ContentLocale = "fr",
): Promise<CatalogSummary> {
  const [inStock, published] = await Promise.all([
    searchContent({
      collections: ["products"],
      locale,
      filters: { status: "published", inStock: true },
      limit: 100,
    }),
    searchContent({
      collections: ["products"],
      locale,
      filters: { status: "published" },
      limit: 1,
    }),
  ]);

  const publishedInStockByCategory: Record<string, number> = {};
  for (const product of inStock.results) {
    const category = product.category ?? "unknown";
    publishedInStockByCategory[category] =
      (publishedInStockByCategory[category] ?? 0) + 1;
  }

  const inStockDresses = inStock.results.filter(
    (product) => product.category === "dresses",
  );

  return {
    counts: {
      published: published.totalDocs,
      inStock: inStock.totalDocs,
      publishedInStockByCategory,
    },
    inStockProducts: inStock.results.map((product) => ({
      id: product.id,
      title: product.title ?? null,
      slug: product.slug ?? null,
      category: product.category ?? null,
      price: product.price ?? null,
      inStock: product.inStock ?? null,
      status: product.status ?? null,
    })),
    inStockDresses: inStockDresses.map((product) => ({
      id: product.id,
      title: product.title ?? null,
      slug: product.slug ?? null,
      category: product.category ?? null,
      price: product.price ?? null,
      inStock: product.inStock ?? null,
      status: product.status ?? null,
    })),
  };
}
