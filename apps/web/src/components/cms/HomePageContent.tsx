"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import { RenderBlocks } from "@/components/cms/RenderBlocks";
import { HomeCategoryStrip } from "@/components/cms/HomeCategoryStrip";
import { enrichFeaturedBlock, mapHomePageBlocks } from "@/lib/cms/blocks";
import { getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";
import type { Page as PayloadPage } from "@/payload-types";
import type { ContentLocale } from "@/lib/cms/types";

type HomePageContentProps = {
  initialPage: PayloadPage;
  locale: ContentLocale;
  labels: {
    season: string;
    viewFullCollectionLabel: string;
    outOfStockBadge: string;
    exploreLabel: string;
    quote: string;
    categoryLinks: { href: string; label: string }[];
  };
};

export function HomePageContent({ initialPage, locale, labels }: HomePageContentProps) {
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || getPreviewSiteUrl();

  const { data: page } = useLivePreview<PayloadPage>({
    initialData: initialPage,
    serverURL,
    depth: 2,
  });

  const mapped = mapHomePageBlocks(page.blocks);
  const blocks = mapped.map((block) =>
    block.blockType === "featuredProducts"
      ? enrichFeaturedBlock(block, locale, labels)
      : block,
  );

  return (
    <main>
      <RenderBlocks blocks={blocks} quote={labels.quote} />
      <HomeCategoryStrip exploreLabel={labels.exploreLabel} categoryLinks={labels.categoryLinks} />
    </main>
  );
}
