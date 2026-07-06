import { defineRouting } from "next-intl/routing";
import {
  CONTENT_LOCALES,
  STOREFRONT_DEFAULT_LOCALE,
} from "@repo/payload-schema/i18n/content-locales";

export const routing = defineRouting({
  locales: [...CONTENT_LOCALES],
  defaultLocale: STOREFRONT_DEFAULT_LOCALE,
  localePrefix: "as-needed",
});
