import { describe, expect, it } from "vitest";
import { isSupportedLocale, normalizeLocale } from "./locale";

describe("locale normalization", () => {
  it("defaults missing locale to fr", () => {
    expect(normalizeLocale(undefined)).toBe("fr");
    expect(normalizeLocale("")).toBe("fr");
  });

  it("accepts supported locales", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("ru")).toBe("ru");
  });

  it("falls back invalid locale to fr", () => {
    expect(normalizeLocale("de")).toBe("fr");
  });

  it("type-guards supported locales", () => {
    expect(isSupportedLocale("fr")).toBe(true);
    expect(isSupportedLocale("xx")).toBe(false);
  });
});
