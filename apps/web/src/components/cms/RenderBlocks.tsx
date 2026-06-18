import { Fragment } from "react";
import type { MappedHomeBlock } from "@/lib/cms/types";
import { HeroBlock } from "./HeroBlock";
import { FeaturedProductsBlock } from "./FeaturedProductsBlock";
import { EditorialStripBlock } from "./EditorialStripBlock";
import { HomeQuoteSection } from "./HomeQuoteSection";
import { BlockOverlay } from "./BlockOverlay";

interface RenderBlocksProps {
  blocks: MappedHomeBlock[];
  quote: string;
}

export function RenderBlocks({ blocks, quote }: RenderBlocksProps) {
  return (
    <>
      {blocks.map((block) => {
        const key = `${block.blockType}-${block.blockIndex}`;

        if (block.blockType === "hero") {
          return (
            <Fragment key={key}>
              <BlockOverlay blockType="hero" blockIndex={block.blockIndex}>
                <HeroBlock {...block.props} blockIndex={block.blockIndex} />
              </BlockOverlay>
              <HomeQuoteSection quote={quote} />
            </Fragment>
          );
        }

        if (block.blockType === "featuredProducts") {
          return (
            <BlockOverlay key={key} blockType="featuredProducts" blockIndex={block.blockIndex}>
              <FeaturedProductsBlock {...block.props} blockIndex={block.blockIndex} />
            </BlockOverlay>
          );
        }

        if (block.blockType === "editorialStrip") {
          return (
            <BlockOverlay key={key} blockType="editorialStrip" blockIndex={block.blockIndex}>
              <EditorialStripBlock {...block.props} blockIndex={block.blockIndex} />
            </BlockOverlay>
          );
        }

        return null;
      })}
    </>
  );
}
