import { describe, it, expect } from "vitest";
import { parseCategoryParam, CATEGORY_TO_QUERY } from "../catalogueCategory";

describe("parseCategoryParam", () => {
  it("maps French URL slugs to product categories", () => {
    expect(parseCategoryParam("robes")).toBe("dresses");
    expect(parseCategoryParam("sacs")).toBe("bags");
    expect(parseCategoryParam("foulards")).toBe("scarfs");
  });

  it("returns null for unknown or empty values", () => {
    expect(parseCategoryParam(null)).toBeNull();
    expect(parseCategoryParam("")).toBeNull();
    expect(parseCategoryParam("unknown")).toBeNull();
  });
});

describe("CATEGORY_TO_QUERY", () => {
  it("round-trips with parseCategoryParam", () => {
    for (const category of ["dresses", "bags", "scarfs"] as const) {
      expect(parseCategoryParam(CATEGORY_TO_QUERY[category])).toBe(category);
    }
  });
});
