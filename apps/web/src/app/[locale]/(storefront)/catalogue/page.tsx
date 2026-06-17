import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogueGridSkeleton } from "@/components/skeletons/CatalogueGridSkeleton";
import { CatalogueClient } from "./CatalogueClient";
import { getCataloguePage } from "@/lib/cms/queries";
import type { ContentLocale } from "@/lib/cms/types";
import type { Product } from "@/types/product";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

interface CataloguePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CataloguePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue" });
  return buildPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    pathname: "/catalogue",
  });
}

export default async function CataloguePage({ params }: CataloguePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("catalogue");
  let products: Product[] = [];
  let error: string | null = null;
  let pageTitle = t("title");

  try {
    const catalogue = await getCataloguePage(locale as ContentLocale);
    products = catalogue.products;
    pageTitle = catalogue.title || pageTitle;
  } catch {
    products = [];
    error = "fetch_failed";
  }

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">{pageTitle}</h1>
      <Suspense fallback={<CatalogueGridSkeleton />}>
        <CatalogueClient
          initialProducts={products}
          initialError={error}
        />
      </Suspense>
    </main>
  );
}
