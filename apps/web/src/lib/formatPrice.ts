import {
  type ContentLocale,
  NUMBER_FORMAT_LOCALE,
  STOREFRONT_DEFAULT_LOCALE,
} from "@repo/payload-schema/i18n/content-locales";

export function formatPrice(price: number, locale: ContentLocale): string {
  return new Intl.NumberFormat(
    NUMBER_FORMAT_LOCALE[locale] ?? NUMBER_FORMAT_LOCALE[STOREFRONT_DEFAULT_LOCALE],
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(price);
}
