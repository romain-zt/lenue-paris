import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductPageContent } from "@/components/cms/ProductPageContent";
import { getProductBySlug, getProductDocumentBySlug } from "@/lib/cms/queries";
import { getSiteSettings, resolveBrandName } from "@/lib/cms/siteSettings";
import type { ContentLocale } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const [t, product, siteSettings] = await Promise.all([
    getTranslations({ locale, namespace: "product" }),
    getProductBySlug(slug, locale as ContentLocale, { draft: isDraft }),
    getSiteSettings(),
  ]);
  const brandName = resolveBrandName(siteSettings);
  if (!product) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: `${product.title} — ${brandName}`,
    description: product.description ?? t("metaDescriptionFallback", { title: product.title }),
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const contentLocale = locale as ContentLocale;
  const { isEnabled: isDraft } = await draftMode();
  const productDoc = await getProductDocumentBySlug(slug, contentLocale, { draft: isDraft });

  if (!productDoc) {
    notFound();
  }

  return (
    <ProductPageContent
      initialProduct={JSON.parse(JSON.stringify(productDoc))}
      locale={contentLocale}
    />
  );
}
