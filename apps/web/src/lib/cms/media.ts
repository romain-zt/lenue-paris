import type { Media } from "@/payload-types";

/** Resolve a storefront-safe image URL from a populated Payload media doc. */
export function resolveMediaUrl(media: number | Media | null | undefined): string | null {
  if (media == null || typeof media === "number") return null;
  if (media.url) return media.url;
  if (media.filename) {
    return `/images/${media.filename}`;
  }
  return null;
}

export function resolveMediaAlt(media: number | Media | null | undefined, fallback: string): string {
  if (media == null || typeof media === "number") return fallback;
  return media.alt?.trim() || fallback;
}
