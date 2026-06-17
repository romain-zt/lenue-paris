/**
 * Single source of truth for product ↔ image mapping.
 * Storefront serves from /public/images (always available on Vercel).
 * Seed uploads the same files into Payload media for the CMS admin.
 */
export interface ProductImageSet {
  main: string;
  gallery?: string[];
}

export const PRODUCT_IMAGES: Record<string, ProductImageSet> = {
  "robe-camille": {
    main: "dress-camille.jpg",
    gallery: [
      "PHOTO-2026-06-12-17-30-46.jpg",
      "PHOTO-2026-06-12-23-17-33.jpg",
      "PHOTO-2026-06-12-17-30-33.jpg",
    ],
  },
  "robe-louise": {
    main: "dress-louise.jpg",
    gallery: [
      "PHOTO-2026-06-12-17-30-56.jpg",
      "PHOTO-2026-06-12-18-07-47.jpg",
      "PHOTO-2026-06-13-08-45-41.jpg",
    ],
  },
  "robe-margot": {
    main: "dress-margot.jpg",
    gallery: [
      "PHOTO-2026-06-12-18-02-57.jpg",
      "PHOTO-2026-06-12-22-37-24.jpg",
      "PHOTO-2026-06-12-23-29-2.jpg",
    ],
  },
  "robe-heloise": {
    main: "dress-heloise.jpg",
    gallery: [
      "PHOTO-2026-06-12-17-30-47.jpg",
      "PHOTO-2026-06-12-17-32-34.jpg",
      "PHOTO-2026-06-12-17-34-11.jpg",
    ],
  },
  "sac-juliette": {
    main: "PHOTO-2026-06-12-18-07-47.jpg",
    gallery: ["PHOTO-2026-06-12-22-37-24.jpg"],
  },
  "sac-amelie": {
    main: "PHOTO-2026-06-12-23-17-32.jpg",
    gallery: ["PHOTO-2026-06-12-23-17-33.jpg"],
  },
  "sac-celeste": {
    main: "PHOTO-2026-06-12-23-17-32.jpg",
  },
  "sac-victoire": {
    main: "PHOTO-2026-06-13-08-45-41.jpg",
  },
  "foulard-diane": {
    main: "PHOTO-2026-06-12-23-29-2.jpg",
  },
  "foulard-aurore": {
    main: "PHOTO-2026-06-13-08-45-41.jpg",
  },
  "foulard-claire": {
    main: "PHOTO-2026-06-12-18-02-57.jpg",
  },
  "foulard-iris": {
    main: "PHOTO-2026-06-12-22-37-24.jpg",
  },
  "look-elise-edition-limitee": {
    main: "PHOTO-2026-06-12-17-30-46.jpg",
    gallery: [
      "PHOTO-2026-06-12-17-30-56.jpg",
      "PHOTO-2026-06-12-18-02-57.jpg",
      "PHOTO-2026-06-12-22-37-24.jpg",
    ],
  },
};

export function staticImageUrl(filename: string): string {
  return `/images/${filename}`;
}

export function getProductMainImageUrl(slug: string, cmsUrl?: string | null): string | null {
  const mapped = PRODUCT_IMAGES[slug]?.main;
  if (mapped) return staticImageUrl(mapped);
  if (cmsUrl?.startsWith("/")) return cmsUrl;
  return cmsUrl ?? null;
}

export function getProductGalleryUrls(
  slug: string,
  cmsGallery?: Array<{ image?: { url?: string | null } | null }> | null,
): string[] {
  const mapped = PRODUCT_IMAGES[slug]?.gallery ?? [];
  if (mapped.length > 0) {
    return mapped.map(staticImageUrl);
  }
  return (cmsGallery ?? [])
    .map((item) => item.image?.url)
    .filter((url): url is string => Boolean(url));
}
