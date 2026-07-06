import { describe, expect, it } from "vitest";
import { CONTENT_LOCALES, STOREFRONT_DEFAULT_LOCALE } from "@repo/payload-schema/i18n/content-locales";
import { routing } from "../routing";

describe("routing locale sync", () => {
  it("matches CONTENT_LOCALES from payload-schema", () => {
    expect([...routing.locales]).toEqual([...CONTENT_LOCALES]);
  });

  it("uses the shared storefront default locale", () => {
    expect(routing.defaultLocale).toBe(STOREFRONT_DEFAULT_LOCALE);
  });
});
