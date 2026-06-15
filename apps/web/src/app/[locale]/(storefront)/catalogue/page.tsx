import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { CatalogueClient } from "./CatalogueClient";
import { parseCategoryParam } from "@/lib/catalogueCategory";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

type Locale = "fr" | "en" | "ru";

async function getProducts(locale: Locale): Promise<{ products: Product[]; error: string | null }> {
  try {
    const payload = await getPayload({ config });
    const query = {
      collection: "products" as const,
      where: { _status: { equals: "published" as const } },
      locale,
      limit: 100,
      depth: 1,
    };

    const { docs } = await payload.find(query);

    // Payload tracks published status per locale. Fall back to French content
    // so the catalogue is never empty when products exist in the primary locale.
    if (docs.length === 0 && locale !== "fr") {
      const { docs: frDocs } = await payload.find({ ...query, locale: "fr" });
      return { products: frDocs as unknown as Product[], error: null };
    }

    return { products: docs as unknown as Product[], error: null };
  } catch {
    return { products: [], error: "fetch_failed" };
  }
}

interface CataloguePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categorie?: string }>;
}

export async function generateMetadata({ params }: CataloguePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CataloguePage({ params, searchParams }: CataloguePageProps) {
  const { locale } = await params;
  const { categorie } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("catalogue");
  const { products, error } = await getProducts(locale as Locale);
  const initialCategory = parseCategoryParam(categorie);

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
      <Suspense fallback={null}>
        <CatalogueClient
          initialProducts={products}
          initialError={error}
          initialCategory={initialCategory}
        />
      </Suspense>
    </main>
  );
}
