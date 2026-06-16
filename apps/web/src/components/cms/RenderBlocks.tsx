import { Fragment } from "react";
import type { MappedHomeBlock } from "@/lib/cms/types";
import { HeroBlock } from "./HeroBlock";
import { FeaturedProductsBlock } from "./FeaturedProductsBlock";
import { EditorialStripBlock } from "./EditorialStripBlock";
import { HomeQuoteSection } from "./HomeQuoteSection";

interface RenderBlocksProps {
  blocks: MappedHomeBlock[];
  quote: string;
}

export function RenderBlocks({ blocks, quote }: RenderBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.blockType}-${index}`;

        if (block.blockType === "hero") {
          return (
            <Fragment key={key}>
              <HeroBlock {...block.props} />
              <HomeQuoteSection quote={quote} />
            </Fragment>
          );
        }

        if (block.blockType === "featuredProducts") {
          return <FeaturedProductsBlock key={key} {...block.props} />;
        }

        if (block.blockType === "editorialStrip") {
          return <EditorialStripBlock key={key} {...block.props} />;
        }

        return null;
      })}
    </>
  );
}
