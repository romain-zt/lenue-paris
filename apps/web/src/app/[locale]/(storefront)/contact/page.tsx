import { getTranslations, setRequestLocale } from "next-intl/server";
import { CONTACT_PAGE_COPY } from "@/lib/editorial/contactPageCopy";
import { ContactPageContent } from "./ContactPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Locale = keyof typeof CONTACT_PAGE_COPY;

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
  const copy = CONTACT_PAGE_COPY[locale as Locale] ?? CONTACT_PAGE_COPY.fr;

  return <ContactPageContent title={copy.title} body={copy.body} whatsAppLabel={copy.whatsAppLabel} />;
}
