import { getRequestConfig } from "next-intl/server";
import { STOREFRONT_DEFAULT_LOCALE } from "@repo/payload-schema/i18n/content-locales";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const baseLocale = STOREFRONT_DEFAULT_LOCALE;
  const baseMessages = (await import(`../../messages/${baseLocale}.json`)).default;
  const localeMessages =
    locale === baseLocale
      ? baseMessages
      : { ...baseMessages, ...(await import(`../../messages/${locale}.json`)).default };

  return {
    locale,
    messages: localeMessages,
  };
});
