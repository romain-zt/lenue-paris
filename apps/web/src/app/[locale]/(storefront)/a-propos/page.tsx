import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrandPageData } from "@/lib/getBrandPageData";
import { BrandPageContent } from "./BrandPageContent";

interface BrandPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getBrandPageData(locale);

  return <BrandPageContent {...data} locale={locale} />;
}
