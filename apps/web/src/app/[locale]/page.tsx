import { draftMode } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomePageContent } from "@/components/cms/HomePageContent";
import { HomeEmptyState } from "@/components/cms/HomeEmptyState";
import { findHeroTagline } from "@/lib/cms/blocks";
import { getHomePage, getHomePageDocument } from "@/lib/cms/queries";
import { getSiteSettings, resolveBrandName } from "@/lib/cms/siteSettings";
import type { ContentLocale } from "@/lib/cms/types";
import { buildPageMetadata, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const [home, siteSettings] = await Promise.all([
    getHomePage(locale as ContentLocale, { draft: isDraft }),
    getSiteSettings(),
  ]);
  const heroTagline = home ? findHeroTagline(home.blocks) : null;
  const t = await getTranslations({ locale, namespace: "home" });
  const description = heroTagline ?? t("heroTagline");

  const heroBlock = home?.blocks.find((b) => b.blockType === "hero");
  const heroImagePath =
    heroBlock?.blockType === "hero" ? heroBlock.props.heroImageUrl : DEFAULT_OG_IMAGE_PATH;

  return buildPageMetadata({
    title: resolveBrandName(siteSettings),
    description,
    locale,
    pathname: "",
    imagePath: heroImagePath,
    siteName: resolveBrandName(siteSettings),
  });
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tProduct = await getTranslations("product");
  const contentLocale = locale as ContentLocale;
  const { isEnabled: isDraft } = await draftMode();

  const [homeDoc, siteSettings] = await Promise.all([
    getHomePageDocument(contentLocale, { draft: isDraft }),
    getSiteSettings(),
  ]);
  if (!homeDoc?.blocks?.length) {
    return <HomeEmptyState brandName={resolveBrandName(siteSettings)} />;
  }

  const labels = {
    season: t("season"),
    viewFullCollectionLabel: t("viewFullCollection"),
    outOfStockBadge: tProduct("outOfStockBadge"),
    capsuleBadgeLabel: t("capsuleBadge"),
    exploreLabel: t("exploreLabel"),
    quote: t("quote"),
    categoryLinks: [{ href: "/catalogue", label: t("allCollection") }],
  };

  return (
    <HomePageContent
      initialPage={JSON.parse(JSON.stringify(homeDoc))}
      locale={contentLocale}
      brandName={resolveBrandName(siteSettings)}
      labels={labels}
    />
  );
}
