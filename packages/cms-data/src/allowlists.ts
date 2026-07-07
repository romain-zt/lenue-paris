import { parseContentLocale as parseSharedContentLocale } from "@repo/payload-schema/i18n/content-locales";

/** Collections the AI may read via get_document / search_content. */
export const READABLE_COLLECTIONS = new Set([
  "pages",
  "products",
  "collections",
  "media",
]);

/** Globals the AI may read via get_document / get_site_snapshot. */
export const READABLE_GLOBALS = new Set([
  "site-settings",
  "design-tokens",
]);

export function assertReadableTarget(
  collection: string,
  isGlobal = false,
): { ok: true } | { ok: false; error: string } {
  if (isGlobal) {
    if (!READABLE_GLOBALS.has(collection)) {
      return {
        ok: false,
        error: `Le global "${collection}" n'est pas accessible via l'assistant IA`,
      };
    }
    return { ok: true };
  }

  if (!READABLE_COLLECTIONS.has(collection)) {
    return {
      ok: false,
      error: `La collection "${collection}" n'est pas accessible via l'assistant IA`,
    };
  }

  return { ok: true };
}

export { parseSharedContentLocale as parseContentLocale };
