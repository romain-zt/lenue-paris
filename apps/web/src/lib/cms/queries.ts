import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Page as PayloadPage, Collection as PayloadCollection, Product as PayloadProduct } from "@/payload-types";
import type { Product } from "@/types/product";
import {
  mapHomePageBlocks,
  mapPayloadProductToStorefront,
  mapPayloadProductDetail,
  findProductGridBlock,
  mapProductGridBlock,
} from "./blocks";
import type { ContentLocale, HomePageDto } from "./types";
import { STOREFRONT_PRODUCT_CATEGORY, filterStorefrontProducts } from "@/lib/catalogue/storefrontCatalogue";
import { resolveMediaAlt, resolveMediaUrl } from "./media";

const HOME_SLUG = "home";
const CATALOGUE_SLUG = "catalogue";

async function getPayloadClient() {
  return getPayload({ config });
}

type QueryOptions = {
  draft?: boolean;
};

export async function getHomePageDocument(
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<PayloadPage | null> {
  const payload = await getPayloadClient();
  const draft = options?.draft ?? false;

  const where: Where = draft
    ? { and: [{ slug: { equals: HOME_SLUG } }] }
    : { and: [{ slug: { equals: HOME_SLUG } }, { _status: { equals: "published" } }] };

  const result = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    where,
    depth: 3,
    limit: 1,
    draft,
  });

  return (result.docs[0] as PayloadPage | undefined) ?? null;
}

export async function getHomePage(
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<HomePageDto | null> {
  const doc = await getHomePageDocument(locale, options);
  if (!doc?.blocks?.length) return null;

  const mapped = mapHomePageBlocks(doc.blocks);

  return {
    id: doc.id,
    slug: doc.slug ?? HOME_SLUG,
    blocks: mapped,
  };
}

export async function getProductBySlug(
  slug: string,
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<Product | null> {
  const doc = await getProductDocumentBySlug(slug, locale, options);
  if (!doc) return null;
  return mapPayloadProductDetail(doc, locale);
}

export async function getProductDocumentBySlug(
  slug: string,
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<PayloadProduct | null> {
  const payload = await getPayloadClient();
  const draft = options?.draft ?? false;

  const where: Where = draft
    ? { and: [{ slug: { equals: slug } }] }
    : { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] };

  const query = {
    collection: "products" as const,
    where,
    locale,
    fallbackLocale: "fr" as const,
    limit: 1,
    depth: 2,
    draft,
  };

  const { docs } = await payload.find(query);
  const doc = docs[0] as PayloadProduct | undefined;
  if (doc) return doc;

  if (locale !== "fr") {
    const { docs: frDocs } = await payload.find({ ...query, locale: "fr" });
    return (frDocs[0] as PayloadProduct | undefined) ?? null;
  }

  return null;
}

export interface CollectionPageDto {
  id: number;
  slug: string;
  title: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  products: Product[];
}

export async function getCollectionDocumentBySlug(
  slug: string,
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<PayloadCollection | null> {
  const payload = await getPayloadClient();
  const draft = options?.draft ?? false;

  const where: Where = draft
    ? { and: [{ slug: { equals: slug } }] }
    : { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] };

  const query = {
    collection: "collections" as const,
    where,
    locale,
    fallbackLocale: "fr" as const,
    limit: 1,
    depth: 2,
    draft,
  };

  const { docs } = await payload.find(query);
  const doc = docs[0] as PayloadCollection | undefined;
  if (doc) return doc;

  if (locale !== "fr") {
    const { docs: frDocs } = await payload.find({ ...query, locale: "fr" });
    return (frDocs[0] as PayloadCollection | undefined) ?? null;
  }

  return null;
}

export async function getCollectionBySlug(
  slug: string,
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<CollectionPageDto | null> {
  const doc = await getCollectionDocumentBySlug(slug, locale, options);
  if (!doc) return null;

  const products = filterStorefrontProducts(
    (doc.products ?? [])
      .map((entry) => (typeof entry === "number" ? null : mapPayloadProductToStorefront(entry)))
      .filter((p): p is Product => p != null),
  );

  let heroImageUrl: string | undefined;
  let heroImageAlt: string | undefined;
  if (doc.hero && typeof doc.hero !== "number") {
    heroImageUrl = resolveMediaUrl(doc.hero) ?? undefined;
    heroImageAlt = resolveMediaAlt(doc.hero, doc.title);
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
    where: {
      and: [
        { _status: { equals: "published" } },
        { category: { equals: STOREFRONT_PRODUCT_CATEGORY } },
      ],
    },
    depth: 1,
    limit: 100,
    sort: "title",
  });

  const products = filterStorefrontProducts(
    productsResult.docs
      .map((doc) => mapPayloadProductToStorefront(doc))
      .filter((p): p is Product => p != null),
  );

  const title =
    gridBlock?.title ??
    (locale === "fr" ? "Catalogue" : locale === "en" ? "Catalogue" : "Каталог");

  return { title, products, sourceType: "all" };
}

export async function getPageDocument(
  slug: string,
  locale: ContentLocale,
  options?: QueryOptions,
): Promise<PayloadPage | null> {
  const payload = await getPayloadClient();
  const draft = options?.draft ?? false;

  const where: Where = draft
    ? { and: [{ slug: { equals: slug } }] }
    : { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] };

  const result = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    where,
    depth: 3,
    limit: 1,
    draft,
  });

  return (result.docs[0] as PayloadPage | undefined) ?? null;
}

