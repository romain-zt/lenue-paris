import { getTranslations, setRequestLocale } from "next-intl/server";
import { RenderBlocks } from "@/components/cms/RenderBlocks";
import { HomeCategoryStrip } from "@/components/cms/HomeCategoryStrip";
import { HomeEmptyState } from "@/components/cms/HomeEmptyState";
import { enrichFeaturedBlock, findHeroTagline } from "@/lib/cms/blocks";
import { getHomePage } from "@/lib/cms/queries";
import type { ContentLocale, MappedHomeBlock } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

function enrichBlocks(
  blocks: MappedHomeBlock[],
  locale: ContentLocale,
  labels: {
    season: string;
    viewFullCollectionLabel: string;
    outOfStockBadge: string;
  },
): MappedHomeBlock[] {
  return blocks.map((block) =>
    block.blockType === "featuredProducts" ? enrichFeaturedBlock(block, locale, labels) : block,
  );
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  const home = await getHomePage(locale as ContentLocale);
  const heroTagline = home ? findHeroTagline(home.blocks) : null;

  if (heroTagline) {
    return {
      title: "Lénue Paris",
      description: heroTagline,
    };
  }

  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: "Lénue Paris",
    description: t("heroTagline"),
  };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tProduct = await getTranslations("product");
  const home = await getHomePage(locale as ContentLocale);

  if (!home?.blocks.length) {
    return <HomeEmptyState />;
  }

  const blocks = enrichBlocks(home.blocks, locale as ContentLocale, {
    season: t("season"),
    viewFullCollectionLabel: t("viewFullCollection"),
    outOfStockBadge: tProduct("outOfStockBadge"),
  });

  return (
    <main>
      <RenderBlocks blocks={blocks} />
      <HomeCategoryStrip />
    </main>
  );
}
