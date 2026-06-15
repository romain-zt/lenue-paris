import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { CatalogueClient } from "./CatalogueClient";
import type { Product } from "@/types/product";

type Locale = "fr" | "en" | "ru";

async function getProducts(locale: Locale): Promise<{ products: Product[]; error: string | null }> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "products",
      where: { _status: { equals: "published" } },
      locale,
      limit: 100,
    });

    // Payload 3 tracks published status per locale context. If products were
    // published from the French admin, the ru/en locale query may return empty.
    // Fall back to French to ensure products always show across all locales.
    if (docs.length === 0 && locale !== "fr") {
      const { docs: frDocs } = await payload.find({
        collection: "products",
        where: { _status: { equals: "published" } },
        locale: "fr",
        limit: 100,
      });
      return { products: frDocs as unknown as Product[], error: null };
    }

    return { products: docs as unknown as Product[], error: null };
  } catch {
    return { products: [], error: "fetch_failed" };
  }
}

interface CataloguePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CataloguePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CataloguePage({ params }: CataloguePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("catalogue");
  const { products, error } = await getProducts(locale as Locale);

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
      <Suspense fallback={null}>
        <CatalogueClient initialProducts={products} initialError={error} />
      </Suspense>
    </main>
  );
}
