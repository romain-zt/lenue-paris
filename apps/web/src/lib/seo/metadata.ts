import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { OPEN_GRAPH_LOCALE } from "@repo/payload-schema/i18n/content-locales";
import { HERO_PUBLIC_FALLBACK } from "@/lib/cms/media";

export const DEFAULT_OG_IMAGE_PATH = HERO_PUBLIC_FALLBACK;

/** Canonical site origin for absolute OG/Twitter URLs (WhatsApp, iMessage, etc.). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3001";
  return "";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: string, pathname = ""): string {
  const normalized = pathname.startsWith("/") ? pathname : pathname ? `/${pathname}` : "";
  if (locale === routing.defaultLocale) return normalized || "/";
  return `/${locale}${normalized}`;
}

export type PageMetadataInput = {
  title: string;
  description: string;
  locale: string;
  /** Path after locale, e.g. `/catalogue` or `/produits/robe-camille`. */
  pathname?: string;
  /** Relative path under `public/` or absolute URL for share preview image. */
  imagePath?: string;
  /** Site name for OG tags — pass from getSiteSettings().brandName at call site. */
  siteName?: string;
};

/** Shared Open Graph + Twitter card metadata for maison-grade link previews. */
export function buildPageMetadata({
  title,
  description,
  locale,
  pathname = "",
  imagePath = DEFAULT_OG_IMAGE_PATH,
  siteName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "",
}: PageMetadataInput): Metadata {
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const pageUrl = absoluteUrl(localePath(safeLocale, pathname));
  const ogImage = absoluteUrl(imagePath);

  const languages = Object.fromEntries(
    routing.locales.map((loc) => [loc, absoluteUrl(localePath(loc, pathname))]),
  );

  return {
    title,
    description,
    ...(getSiteUrl() ? { metadataBase: new URL(getSiteUrl()) } : {}),
    alternates: {
      canonical: pageUrl,
      languages,
    },
    openGraph: {
      type: "website",
      siteName: siteName,
      title,
      description,
      url: pageUrl,
      locale: OPEN_GRAPH_LOCALE[safeLocale],
      alternateLocale: routing.locales
        .filter((l) => l !== safeLocale)
        .map((l) => OPEN_GRAPH_LOCALE[l]),
      images: [
        {
          url: ogImage,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
