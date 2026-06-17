import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContactPageData } from "@/lib/getContactPageData";
import { ContactPageContent } from "./ContactPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });

  return buildPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    pathname: "/contact",
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contactPage" });
  const data = await getContactPageData(locale);

  return (
    <ContactPageContent
      title={data.title}
      body={data.body}
      whatsAppLabel={t("whatsAppLabel")}
    />
  );
}
