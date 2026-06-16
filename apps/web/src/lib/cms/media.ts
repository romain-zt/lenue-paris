import type { Media } from "@/payload-types";

/** Default hero when Payload media is missing or storage is unavailable (e.g. Vercel without S3). */
export const HERO_PUBLIC_FALLBACK = "/images/hero.jpg";

/**
 * Payload serves uploads at `/api/media/file/{filename}`; on Vercel without a storage
 * adapter those URLs 404 while the same files exist under `public/images/`.
 */
export function rewritePayloadMediaUrl(url: string): string {
  const match = url.match(/^\/api\/media\/file\/(.+)$/);
  if (!match?.[1]) return url;
  const filename = decodeURIComponent(match[1]);
  if (/\.(mp4|webm|mov)$/i.test(filename)) {
    return `/videos/${filename}`;
  }
  return `/images/${filename}`;
}

/** Resolve a storefront-safe image URL from a populated Payload media doc. */
export function resolveMediaUrl(media: number | Media | null | undefined): string | null {
  if (media == null || typeof media === "number") return null;

  if (media.url) {
    return rewritePayloadMediaUrl(media.url);
  }

  if (media.filename) {
    if (/\.(mp4|webm|mov)$/i.test(media.filename)) {
      return `/videos/${media.filename}`;
    }
    return `/images/${media.filename}`;
  }

  return null;
}

/** Hero image URL with a guaranteed public fallback for the home block. */
export function resolveHeroImageUrl(media: number | Media | null | undefined): string {
  return resolveMediaUrl(media) ?? HERO_PUBLIC_FALLBACK;
}

/** Resolve optional hero loop video from Payload media (no fallback — image poster covers absence). */
export function resolveHeroVideoUrl(media: number | Media | null | undefined): string | undefined {
  const url = resolveMediaUrl(media);
  return url ?? undefined;
}

export function resolveMediaAlt(media: number | Media | null | undefined, fallback: string): string {
  if (media == null || typeof media === "number") return fallback;
  return media.alt?.trim() || fallback;
}
