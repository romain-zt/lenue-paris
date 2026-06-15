import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrandPageData } from "@/lib/getBrandPageData";
import { BRAND_PAGE_COPY } from "@/lib/brandPageCopy";
import { BrandPageContent } from "./BrandPageContent";

type Locale = "fr" | "en" | "ru";

interface BrandPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  const copy = BRAND_PAGE_COPY[locale as Locale] ?? BRAND_PAGE_COPY.fr;

  return {
    title: `${t("about")} — Lénue Paris`,
    description: copy.body.split("\n\n")[0],
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getBrandPageData(locale as Locale);

  return <BrandPageContent {...data} />;
}
