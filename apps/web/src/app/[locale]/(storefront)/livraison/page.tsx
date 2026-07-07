import { draftMode } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandPageContent } from "../a-propos/BrandPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPageDocument } from "@/lib/cms/queries";
import { resolveMediaAlt, resolveMediaUrl } from "@/lib/cms/media";
import type { ContentLocale } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

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

  const { isEnabled: isDraft } = await draftMode();
  const page = await getPageDocument("livraison", locale as ContentLocale, { draft: isDraft });

  if (page) {
    const cover =
      page.cover && typeof page.cover !== "number"
        ? {
            url: resolveMediaUrl(page.cover) ?? "",
            alt: resolveMediaAlt(page.cover, page.title ?? "") ?? "",
          }
        : null;

    return (
      <BrandPageContent
        title={page.title ?? ""}
        body={(page.body as string | null | undefined) ?? ""}
        cover={cover?.url ? cover : null}
        docId={String(page.id)}
        locale={locale as ContentLocale}
      />
    );
  }

  // Fallback when page not yet seeded
  const t = await getTranslations({ locale, namespace: "delivery" });
  return <BrandPageContent title={t("title")} body={t("body")} cover={null} />;
}
