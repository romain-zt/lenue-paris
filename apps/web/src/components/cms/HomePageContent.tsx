"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import { RenderBlocks } from "@/components/cms/RenderBlocks";
import { HomeCategoryStrip } from "@/components/cms/HomeCategoryStrip";
import { enrichFeaturedBlock, mapHomePageBlocks } from "@/lib/cms/blocks";
import { getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";
import { useLivePreviewFieldBridge } from "@/hooks/useLivePreviewFieldBridge";
import { InlineEditor } from "@/components/cms/InlineEditor";
import type { Page as PayloadPage } from "@/payload-types";
import type { ContentLocale } from "@/lib/cms/types";

type HomePageContentProps = {
  initialPage: PayloadPage;
  locale: ContentLocale;
    labels: {
    season: string;
    viewFullCollectionLabel: string;
    outOfStockBadge: string;
    capsuleBadgeLabel: string;
    exploreLabel: string;
    quote: string;
    categoryLinks: { href: string; label: string }[];
  };
};

export function HomePageContent({ initialPage, locale, labels }: HomePageContentProps) {
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || getPreviewSiteUrl();

  useLivePreviewFieldBridge();

  const { data: page } = useLivePreview<PayloadPage>({
    initialData: initialPage,
    serverURL,
    depth: 2,
  });

  const mapped = mapHomePageBlocks(page.blocks);
  const pageExtras = page as PayloadPage & { philosophyQuote?: string | null; exploreLabel?: string | null };
  const philosophyQuote = pageExtras.philosophyQuote?.trim() || labels.quote;
  const exploreLabel = pageExtras.exploreLabel?.trim() || labels.exploreLabel;
  const docId = String(page.id);

  const blocks = mapped.map((block) => {
    if (block.blockType === "featuredProducts") {
      return enrichFeaturedBlock(block, locale, labels);
    }
    if (block.blockType === "hero" && block.props.showCapsuleBadge) {
      return {
        ...block,
        props: { ...block.props, capsuleBadgeLabel: labels.capsuleBadgeLabel },
      };
    }
    return block;
  });

  return (
    <main>
      <RenderBlocks
        blocks={blocks}
        quote={philosophyQuote}
        docId={docId}
        docCollection="pages"
        locale={locale}
      />
      <HomeCategoryStrip
        exploreLabel={exploreLabel}
        categoryLinks={labels.categoryLinks}
        docId={docId}
        locale={locale}
      />
      <InlineEditor />
    </main>
  );
}
