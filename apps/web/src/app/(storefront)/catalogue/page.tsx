import { Suspense } from "react";
import { CatalogueClient } from "./CatalogueClient";
import type { Product, ProductsResponse } from "@/types/product";

async function getProducts(): Promise<{ products: Product[]; error: string | null }> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/products?where[_status][equals]=published&limit=100&locale=fr`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      return { products: [], error: "fetch_failed" };
    }
    const data = (await res.json()) as ProductsResponse;
    return { products: data.docs ?? [], error: null };
  } catch {
    return { products: [], error: "fetch_failed" };
  }
}

export const metadata = {
  title: "Catalogue — Lénue Paris",
  description: "Parcourez notre collection de robes, sacs et foulards de luxe.",
};

export default async function CataloguePage() {
  const { products, error } = await getProducts();

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
        Collection
      </h1>
      <Suspense fallback={null}>
        <CatalogueClient initialProducts={products} initialError={error} />
      </Suspense>
    </main>
  );
}
