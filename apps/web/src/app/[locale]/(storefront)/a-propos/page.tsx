import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrandPageData } from "@/lib/getBrandPageData";
import { getSiteSettings, resolveBrandName } from "@/lib/cms/siteSettings";
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

  const [data, siteSettings] = await Promise.all([
    getBrandPageData(locale),
    getSiteSettings(),
  ]);

  return <BrandPageContent {...data} brandName={resolveBrandName(siteSettings)} locale={locale} />;
}
