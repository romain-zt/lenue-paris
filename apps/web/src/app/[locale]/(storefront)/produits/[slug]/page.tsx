import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductPageContent } from "@/components/cms/ProductPageContent";
import { isPublicStorefrontSlug } from "@/lib/catalogue/storefrontCatalogue";
import { getProductBySlug, getProductDocumentBySlug } from "@/lib/cms/queries";
import type { ContentLocale } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const { isEnabled: isDraft } = await draftMode();
  const product = await getProductBySlug(slug, locale as ContentLocale, { draft: isDraft });
  if (!product) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: `${product.title} — Lénue Paris`,
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

  if (!isDraft && !isPublicStorefrontSlug(slug)) {
    notFound();
  }

  return (
    <ProductPageContent
      initialProduct={JSON.parse(JSON.stringify(productDoc))}
      locale={contentLocale}
    />
  );
}
