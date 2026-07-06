import type { Product } from "@/types/product";
import type { ContentLocale } from "@repo/payload-schema/i18n/content-locales";

export type { ContentLocale };

export interface HeroBlockProps {
  season: string;
  tagline: string;
  ctaLabel: string;
  ctaLink: string;
  heroImageUrl: string;
  heroImageAlt: string;
  /** Optional muted hero loop — poster always uses heroImageUrl. */
  heroVideoUrl?: string;
  /** When true, shows editorial limited-series line (i18n in component). */
  showCapsuleBadge?: boolean;
  /** Resolved on server when `showCapsuleBadge` is true. */
  capsuleBadgeLabel?: string;
}

export interface FeaturedProductsBlockProps {
  season: string;
  title: string;
  viewCollectionLabel: string;
  viewFullCollectionLabel: string;
  /** When sourced from a collection block — e.g. /collections/ete-2026 */
  collectionHref?: string;
  products: Product[];
  locale: ContentLocale;
  outOfStockBadge: string;
}

export interface EditorialStripBlockProps {
  label: string;
  headline: string;
  subline: string;
  body: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
}

export type MappedHomeBlock =
  | { blockType: "hero"; blockIndex: number; props: HeroBlockProps }
  | { blockType: "featuredProducts"; blockIndex: number; props: FeaturedProductsBlockProps }
  | { blockType: "editorialStrip"; blockIndex: number; props: EditorialStripBlockProps };

export interface HomePageDto {
  id: number;
  slug: string;
  blocks: MappedHomeBlock[];
}
