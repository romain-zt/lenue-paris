import { describe, expect, it } from "vitest";
import {
  CONTENT_LOCALES,
  PAYLOAD_DEFAULT_LOCALE,
  STOREFRONT_DEFAULT_LOCALE,
  isContentLocale,
  parseContentLocale,
} from "./content-locales";

describe("content-locales", () => {
  it("defines the canonical locale list", () => {
    expect(CONTENT_LOCALES).toEqual(["fr", "en", "ru"]);
  });

  it("parses known locales and falls back to storefront default", () => {
    expect(parseContentLocale("en")).toBe("en");
    expect(parseContentLocale("de")).toBe(STOREFRONT_DEFAULT_LOCALE);
    expect(parseContentLocale(undefined)).toBe(STOREFRONT_DEFAULT_LOCALE);
  });

  it("type-guards content locales", () => {
    expect(isContentLocale("fr")).toBe(true);
    expect(isContentLocale("de")).toBe(false);
  });

  it("keeps storefront and payload defaults explicit", () => {
    expect(STOREFRONT_DEFAULT_LOCALE).toBe("fr");
    expect(PAYLOAD_DEFAULT_LOCALE).toBe("en");
    expect(CONTENT_LOCALES).toContain(STOREFRONT_DEFAULT_LOCALE);
    expect(CONTENT_LOCALES).toContain(PAYLOAD_DEFAULT_LOCALE);
  });
});
