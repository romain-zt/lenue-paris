import { describe, expect, it } from "vitest";
import { CATALOGUE_TITLE_FALLBACK } from "@/lib/cms/queries";
import type { ContentLocale } from "@/lib/cms/types";

const LOCALES: ContentLocale[] = ["fr", "en", "ru"];

describe("CATALOGUE_TITLE_FALLBACK", () => {
  it("covers every ContentLocale", () => {
    for (const locale of LOCALES) {
      expect(CATALOGUE_TITLE_FALLBACK[locale]).toBeDefined();
    }
  });

  it("returns a non-empty string for each locale", () => {
    for (const locale of LOCALES) {
      expect(typeof CATALOGUE_TITLE_FALLBACK[locale]).toBe("string");
      expect(CATALOGUE_TITLE_FALLBACK[locale].length).toBeGreaterThan(0);
    }
  });

  it("matches the catalogue.title values from the i18n message files", () => {
    expect(CATALOGUE_TITLE_FALLBACK.fr).toBe("Collection");
    expect(CATALOGUE_TITLE_FALLBACK.en).toBe("Collection");
    expect(CATALOGUE_TITLE_FALLBACK.ru).toBe("Коллекция");
  });
});
