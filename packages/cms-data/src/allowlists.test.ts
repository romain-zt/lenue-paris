import { describe, expect, it } from "vitest";
import {
  assertReadableTarget,
  parseContentLocale,
  READABLE_COLLECTIONS,
  READABLE_GLOBALS,
} from "./allowlists";

describe("assertReadableTarget", () => {
  it("allows content collections and globals", () => {
    for (const slug of READABLE_COLLECTIONS) {
      expect(assertReadableTarget(slug).ok).toBe(true);
    }
    for (const slug of READABLE_GLOBALS) {
      expect(assertReadableTarget(slug, true).ok).toBe(true);
    }
  });

  it("blocks users and orders reads", () => {
    expect(assertReadableTarget("users").ok).toBe(false);
    expect(assertReadableTarget("orders").ok).toBe(false);
  });

  it("blocks unknown globals", () => {
    const result = assertReadableTarget("secret-global", true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("secret-global");
    }
  });
});

describe("parseContentLocale", () => {
  it("parses supported locales", () => {
    expect(parseContentLocale("en")).toBe("en");
    expect(parseContentLocale("ru")).toBe("ru");
  });

  it("falls back to fr for invalid values", () => {
    expect(parseContentLocale("de")).toBe("fr");
    expect(parseContentLocale(undefined)).toBe("fr");
  });
});
