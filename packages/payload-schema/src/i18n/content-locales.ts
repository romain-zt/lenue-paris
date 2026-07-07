/**
 * Single source of truth for content locales.
 * Payload localization, next-intl routing, cms-data, and storefront types
 * must all import from here — never hardcode locale lists elsewhere.
 *
 * Adding a locale:
 * 1. Append to CONTENT_LOCALES below
 * 2. Run `pnpm --filter web check:locales` (scaffolds messages/{locale}.json if missing)
 * 3. Run `payload migrate:create` to extend the Postgres `_locales` enum
 * 4. Fill CMS fields for the new locale in admin — no other source edits
 */
export const CONTENT_LOCALES = ["fr", "en", "ru"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];

/** Default locale for next-intl URLs and storefront fallbacks. */
export const STOREFRONT_DEFAULT_LOCALE: ContentLocale = "fr";

/** Payload CMS defaultLocale — used when a localized field has no value. */
export const PAYLOAD_DEFAULT_LOCALE: ContentLocale = "en";

export const OPEN_GRAPH_LOCALE: Record<ContentLocale, string> = {
  fr: "fr_FR",
  en: "en_GB",
  ru: "ru_RU",
};

export const NUMBER_FORMAT_LOCALE: Record<ContentLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ru: "ru-RU",
};

export function isContentLocale(value: string): value is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(value);
}

export function parseContentLocale(value?: string): ContentLocale {
  return value && isContentLocale(value) ? value : STOREFRONT_DEFAULT_LOCALE;
}
