import type { PayloadRequest } from "payload";
import { localePath } from "@/lib/seo/metadata";

export type PreviewCollection = "pages" | "products" | "collections";

const COLLECTION_SEGMENT: Record<PreviewCollection, string | null> = {
  pages: null,
  products: "produits",
  collections: "collections",
};

/** Storefront origin for admin preview URLs — port 3001 locally, prod from env. */
export function getPreviewSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
    return "http://localhost:3001";
  }
  return "https://www.lenue.paris";
}

function buildStorefrontPath(collection: PreviewCollection, slug: string, locale: string): string {
  const contentLocale = locale || "fr";

  if (collection === "pages") {
    if (slug === "home") return localePath(contentLocale);
    return localePath(contentLocale, slug);
  }

  const segment = COLLECTION_SEGMENT[collection];
  return localePath(contentLocale, `${segment}/${encodeURIComponent(slug)}`);
}

type GeneratePreviewPathArgs = {
  collection: PreviewCollection;
  slug: string;
  req: PayloadRequest;
  siteUrl?: string;
};

/** Admin "Open preview" URL — enables draft mode then redirects to the storefront path. */
export function generatePreviewPath({
  collection,
  slug,
  req,
  siteUrl,
}: GeneratePreviewPathArgs): string | null {
  if (!slug) return null;

  const base = siteUrl || getPreviewSiteUrl();
  const locale = req.locale || "fr";
  const path = buildStorefrontPath(collection, slug, locale);

  const params = new URLSearchParams({
    slug,
    collection,
    locale,
    path,
    previewSecret: process.env.PREVIEW_SECRET || "",
  });

  return `${base}/next/preview?${params.toString()}`;
}
