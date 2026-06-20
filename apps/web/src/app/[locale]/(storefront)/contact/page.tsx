import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContactPageData } from "@/lib/getContactPageData";
import { ContactPageContent } from "./ContactPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/cms/siteSettings";

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
  const [data, siteSettings] = await Promise.all([
    getContactPageData(locale),
    getSiteSettings(),
  ]);

  return (
    <ContactPageContent
      title={data.title}
      body={data.body}
      docId={data.docId}
      locale={locale as "fr" | "en" | "ru"}
      whatsAppLabel={t("whatsAppLabel")}
      whatsAppMessage={t("whatsAppMessage")}
      instagramUrl={siteSettings.instagramUrl ?? "https://www.instagram.com"}
    />
  );
}
