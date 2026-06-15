type StorefrontLocale = "fr" | "en" | "ru";

const NUMBER_FORMAT_LOCALE: Record<StorefrontLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ru: "ru-RU",
};

export function formatPrice(price: number, locale: StorefrontLocale): string {
  return new Intl.NumberFormat(NUMBER_FORMAT_LOCALE[locale] ?? "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
