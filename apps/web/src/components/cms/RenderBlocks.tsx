import { Fragment } from "react";
import type { ContentLocale, MappedHomeBlock } from "@/lib/cms/types";
import type { EditableCollection } from "@/lib/cms/editable";
import { HeroBlock } from "./HeroBlock";
import { FeaturedProductsBlock } from "./FeaturedProductsBlock";
import { EditorialStripBlock } from "./EditorialStripBlock";
import { HomeQuoteSection } from "./HomeQuoteSection";
import { BlockOverlay } from "./BlockOverlay";

interface RenderBlocksProps {
  blocks: MappedHomeBlock[];
  quote: string;
  docId?: string;
  docCollection?: EditableCollection;
  locale?: ContentLocale;
}

export function RenderBlocks({ blocks, quote, docId, docCollection, locale }: RenderBlocksProps) {
  return (
    <>
      {blocks.map((block) => {
        const key = `${block.blockType}-${block.blockIndex}`;

        if (block.blockType === "hero") {
          return (
            <Fragment key={key}>
              <BlockOverlay blockType="hero" blockIndex={block.blockIndex} docId={docId} docCollection={docCollection}>
                <HeroBlock
                  {...block.props}
                  blockIndex={block.blockIndex}
                  docId={docId}
                  docCollection={docCollection}
                  locale={locale}
                />
              </BlockOverlay>
              <HomeQuoteSection quote={quote} docId={docId} locale={locale} />
            </Fragment>
          );
        }

        if (block.blockType === "featuredProducts") {
          return (
            <BlockOverlay key={key} blockType="featuredProducts" blockIndex={block.blockIndex} docId={docId} docCollection={docCollection}>
              <FeaturedProductsBlock
                {...block.props}
                blockIndex={block.blockIndex}
                docId={docId}
                docCollection={docCollection}
                locale={locale ?? block.props.locale}
              />
            </BlockOverlay>
          );
        }

        if (block.blockType === "editorialStrip") {
          return (
            <BlockOverlay key={key} blockType="editorialStrip" blockIndex={block.blockIndex} docId={docId} docCollection={docCollection}>
              <EditorialStripBlock
                {...block.props}
                blockIndex={block.blockIndex}
                docId={docId}
                docCollection={docCollection}
                locale={locale}
              />
            </BlockOverlay>
          );
        }

        return null;
      })}
    </>
  );
}
