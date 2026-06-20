import { getTranslations, setRequestLocale } from "next-intl/server";
import { CataloguePageContent } from "./CataloguePageContent";
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
  const contentLocale = locale as ContentLocale;
  let products: Product[] = [];
  let error: string | null = null;
  let pageTitle = t("title");
  let pageId: string | undefined;
  let gridBlockIndex: number | undefined;

  try {
    const catalogue = await getCataloguePage(contentLocale);
    products = catalogue.products;
    pageTitle = catalogue.title || pageTitle;
    pageId = catalogue.pageId;
    gridBlockIndex = catalogue.gridBlockIndex;
  } catch {
    products = [];
    error = "fetch_failed";
  }

  return (
    <CataloguePageContent
      pageTitle={pageTitle}
      products={products}
      error={error}
      pageId={pageId}
      gridBlockIndex={gridBlockIndex}
      locale={contentLocale}
    />
  );
}
