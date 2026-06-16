import { getPayload } from "payload";
import config from "@payload-config";
import type { Page as PayloadPage, Collection as PayloadCollection } from "@/payload-types";
import type { Product } from "@/types/product";
import {
  mapHomePageBlocks,
  enrichFeaturedBlock,
  mapPayloadProductToStorefront,
  findProductGridBlock,
  mapProductGridBlock,
} from "./blocks";
import type { ContentLocale, HomePageDto } from "./types";

const HOME_SLUG = "home";
const CATALOGUE_SLUG = "catalogue";

async function getPayloadClient() {
  return getPayload({ config });
}

export async function getHomePage(locale: ContentLocale): Promise<HomePageDto | null> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    where: {
      and: [{ slug: { equals: HOME_SLUG } }, { _status: { equals: "published" } }],
    },
    depth: 3,
    limit: 1,
  });

  const doc = result.docs[0] as PayloadPage | undefined;
  if (!doc?.blocks?.length) return null;

  const mapped = mapHomePageBlocks(doc.blocks);
  const enriched = mapped.map((block) => {
    if (block.blockType !== "featuredProducts") return block;
    return enrichFeaturedBlock(block, locale, featuredLabels(locale));
  });

  return {
    id: doc.id,
    slug: doc.slug ?? HOME_SLUG,
    blocks: enriched,
  };
}

export interface CollectionPageDto {
  id: number;
  slug: string;
  title: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  products: Product[];
}

export async function getCollectionBySlug(
  slug: string,
  locale: ContentLocale,
): Promise<CollectionPageDto | null> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "collections",
    locale,
    fallbackLocale: "fr",
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
    },
    depth: 2,
    limit: 1,
  });

  const doc = result.docs[0] as PayloadCollection | undefined;
  if (!doc) return null;

  const products = (doc.products ?? [])
    .map((entry) => (typeof entry === "number" ? null : mapPayloadProductToStorefront(entry)))
    .filter((p): p is Product => p != null);

  let heroImageUrl: string | undefined;
  let heroImageAlt: string | undefined;
  if (doc.hero && typeof doc.hero !== "number") {
    heroImageUrl = doc.hero.url ?? undefined;
    heroImageAlt = doc.hero.alt ?? doc.title;
  }

  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    heroImageUrl,
    heroImageAlt,
    products,
  };
}

export interface CataloguePageDto {
  title: string;
  products: Product[];
  sourceType: "all" | "collection";
}

export async function getCataloguePage(locale: ContentLocale): Promise<CataloguePageDto> {
  const payload = await getPayloadClient();

  const pageResult = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    where: {
      and: [{ slug: { equals: CATALOGUE_SLUG } }, { _status: { equals: "published" } }],
    },
    depth: 3,
    limit: 1,
  });

  const page = pageResult.docs[0] as PayloadPage | undefined;
  const gridBlock = findProductGridBlock(page?.blocks);

  if (gridBlock?.sourceType === "collection" && gridBlock.collection) {
    const mapped = mapProductGridBlock(gridBlock);
    if (mapped && mapped.products.length > 0) {
      return { title: mapped.title, products: mapped.products, sourceType: "collection" };
    }
  }

  const productsResult = await payload.find({
    collection: "products",
    locale,
    fallbackLocale: "fr",
    where: { _status: { equals: "published" } },
    depth: 1,
    limit: 100,
    sort: "title",
  });

  const products = productsResult.docs
    .map((doc) => mapPayloadProductToStorefront(doc))
    .filter((p): p is Product => p != null);

  const title =
    gridBlock?.title ??
    (locale === "fr" ? "Catalogue" : locale === "en" ? "Catalogue" : "Каталог");

  return { title, products, sourceType: "all" };
}

function featuredLabels(locale: ContentLocale) {
  if (locale === "en") {
    return {
      season: "Spring · Summer 2026",
      viewFullCollectionLabel: "View full collection →",
      outOfStockBadge: "Out of stock",
    };
  }
  if (locale === "ru") {
    return {
      season: "Весна · Лето 2026",
      viewFullCollectionLabel: "Смотреть коллекцию →",
      outOfStockBadge: "Нет в наличии",
    };
  }
  return {
    season: "Printemps · Été 2026",
    viewFullCollectionLabel: "Voir toute la collection →",
    outOfStockBadge: "Épuisé",
  };
}
