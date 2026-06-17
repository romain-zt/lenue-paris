import type { Page as PayloadPage, Product as PayloadProduct, Collection as PayloadCollection } from "@/payload-types";
import type { Product } from "@/types/product";
import { filterStorefrontProducts } from "@/lib/catalogue/storefrontCatalogue";
import { getProductMainImageUrl } from "@/lib/productImages";
import { resolveHeroImageUrl, resolveMediaAlt, resolveMediaUrl, resolveHeroVideoUrl } from "./media";
import type { ContentLocale, MappedHomeBlock } from "./types";

type PayloadBlock = NonNullable<PayloadPage["blocks"]>[number];

function mapPayloadProduct(product: PayloadProduct): Product | null {
  if (typeof product === "number") return null;
  const mainImageUrl = resolveMediaUrl(product.mainImage);
  return {
    id: String(product.id),
    title: product.title,
    slug: product.slug,
    category: product.category,
    price: product.price,
    inStock: product.inStock,
    limitedSeries: product.limitedSeries ?? false,
    mainImage: {
      id: String(typeof product.mainImage === "number" ? product.mainImage : product.mainImage.id),
      alt: resolveMediaAlt(product.mainImage, product.title),
      url: mainImageUrl ?? getProductMainImageUrl(product.slug),
    },
    _status: product._status ?? undefined,
  };
}

export function mapPayloadProductToStorefront(product: PayloadProduct): Product | null {
  return mapPayloadProduct(product);
}

/** Full product detail for the storefront template (gallery, description, sizes). */
export function mapPayloadProductDetail(
  product: PayloadProduct | number,
  _locale: ContentLocale,
): Product | null {
  if (typeof product === "number") return null;
  const base = mapPayloadProduct(product);
  if (!base) return null;

  const gallery =
    product.gallery?.map((item) => {
      if (!item?.image) return null;
      const image = item.image;
      if (typeof image === "number") return null;
      return {
        id: item.id ?? undefined,
        image: {
          id: String(image.id),
          url: resolveMediaUrl(image),
          alt: resolveMediaAlt(image, product.title),
          width: image.width ?? null,
          height: image.height ?? null,
        },
      };
    }).filter((entry): entry is NonNullable<typeof entry> => entry != null) ?? null;

  return {
    ...base,
    gallery,
    description: product.description ?? null,
    availableLengths: product.availableLengths ?? null,
    availableSizes: product.availableSizes ?? null,
  };
}

function resolveProductsFromCollection(collection: PayloadCollection | number | null | undefined): Product[] {
  if (!collection || typeof collection === "number") return [];
  if (!collection.products?.length) return [];
  return filterStorefrontProducts(
    collection.products
      .map((entry) => (typeof entry === "number" ? null : mapPayloadProduct(entry)))
      .filter((p): p is Product => p != null),
  );
}

function resolveFeaturedProducts(block: Extract<PayloadBlock, { blockType: "featuredProducts" }>): {
  products: Product[];
  collectionHref?: string;
} {
  if (block.sourceType === "collection" && block.collection) {
    const collection = typeof block.collection === "number" ? null : block.collection;
    const products = resolveProductsFromCollection(collection);
    const collectionHref = collection?.slug ? `/collections/${collection.slug}` : undefined;
    return { products, collectionHref };
  }

  const products = filterStorefrontProducts(
    (block.products ?? [])
      .map((entry) => (typeof entry === "number" ? null : mapPayloadProduct(entry)))
      .filter((p): p is Product => p != null),
  );
  return { products };
}

export function mapHomePageBlocks(blocks: PayloadPage["blocks"]): MappedHomeBlock[] {
  if (!blocks?.length) return [];

  const mapped: MappedHomeBlock[] = [];

  for (const block of blocks) {
    if (block.blockType === "hero") {
      const heroImageUrl = resolveHeroImageUrl(block.heroImage);
      const heroVideoUrl = resolveHeroVideoUrl(block.heroVideo);
      mapped.push({
        blockType: "hero",
        props: {
          season: block.season,
          tagline: block.tagline,
          ctaLabel: block.ctaLabel,
          ctaLink: block.ctaLink,
          heroImageUrl,
          heroImageAlt: resolveMediaAlt(block.heroImage, "Lénue Paris"),
          showCapsuleBadge: Boolean(block.showCapsuleBadge),
          ...(heroVideoUrl ? { heroVideoUrl } : {}),
        },
      });
      continue;
    }

    if (block.blockType === "featuredProducts") {
      const { products, collectionHref } = resolveFeaturedProducts(block);
      if (products.length === 0) continue;
      mapped.push({
        blockType: "featuredProducts",
        props: {
          season: "",
          title: block.title,
          viewCollectionLabel: block.viewCollectionLabel ?? "",
          viewFullCollectionLabel: "",
          collectionHref,
          products,
          locale: "fr",
          outOfStockBadge: "",
        },
      });
      continue;
    }

    if (block.blockType === "editorialStrip") {
      const imageUrl = resolveMediaUrl(block.image);
      if (!imageUrl) continue;
      mapped.push({
        blockType: "editorialStrip",
        props: {
          label: block.label,
          headline: block.headline,
          subline: block.subline,
          body: block.body,
          ctaLabel: block.ctaLabel,
          ctaLink: block.ctaLink,
          imageUrl,
          imageAlt: resolveMediaAlt(block.image, block.headline),
        },
      });
    }
  }

  return mapped;
}

/** Inject locale-specific chrome labels into featured block props after mapping. */
export function enrichFeaturedBlock(
  block: Extract<MappedHomeBlock, { blockType: "featuredProducts" }>,
  locale: ContentLocale,
  labels: {
    season: string;
    viewFullCollectionLabel: string;
    outOfStockBadge: string;
  },
): Extract<MappedHomeBlock, { blockType: "featuredProducts" }> {
  return {
    blockType: "featuredProducts",
    props: {
      ...block.props,
      season: labels.season,
      viewFullCollectionLabel: labels.viewFullCollectionLabel,
      outOfStockBadge: labels.outOfStockBadge,
      locale,
    },
  };
}

export function mapProductGridBlock(
  block: Extract<PayloadBlock, { blockType: "productGrid" }>,
): { title: string; products: Product[] } | null {
  if (block.sourceType === "collection" && block.collection) {
    const collection = typeof block.collection === "number" ? null : block.collection;
    const products = resolveProductsFromCollection(collection);
    if (products.length === 0) return null;
    return { title: block.title, products };
  }

  return { title: block.title, products: [] };
}

export function findProductGridBlock(blocks: PayloadPage["blocks"]): Extract<PayloadBlock, { blockType: "productGrid" }> | null {
  const block = blocks?.find((b) => b.blockType === "productGrid");
  return block?.blockType === "productGrid" ? block : null;
}

export function findHeroTagline(blocks: MappedHomeBlock[]): string | null {
  const hero = blocks.find((b) => b.blockType === "hero");
  return hero?.blockType === "hero" ? hero.props.tagline : null;
}

/** @internal test helper */
export function mapPayloadBlockForTest(block: PayloadBlock): MappedHomeBlock | null {
  return mapHomePageBlocks([block])[0] ?? null;
}
