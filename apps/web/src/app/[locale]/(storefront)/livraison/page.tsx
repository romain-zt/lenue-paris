import { getTranslations, setRequestLocale } from "next-intl/server";
import { DELIVERY_PAGE_COPY } from "@/lib/editorial/deliveryPageCopy";
import { BrandPageContent } from "../a-propos/BrandPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Locale = keyof typeof DELIVERY_PAGE_COPY;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "delivery" });

  return buildPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    pathname: "/livraison",
  });
}

export default async function DeliveryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = DELIVERY_PAGE_COPY[locale as Locale] ?? DELIVERY_PAGE_COPY.fr;

  return <BrandPageContent title={copy.title} body={copy.body} cover={null} />;
}
