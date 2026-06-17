import { describe, it, expect } from "vitest";
import { parseCategoryParam, CATEGORY_TO_QUERY } from "../catalogueCategory";

describe("parseCategoryParam", () => {
  it("maps robes query to dresses category", () => {
    expect(parseCategoryParam("robes")).toBe("dresses");
  });

  it("retires legacy sac/foulard query params (dress-only storefront)", () => {
    expect(parseCategoryParam("sacs")).toBeNull();
    expect(parseCategoryParam("foulards")).toBeNull();
    expect(parseCategoryParam("bags")).toBeNull();
    expect(parseCategoryParam("scarfs")).toBeNull();
  });

  it("returns null for unknown or empty values", () => {
    expect(parseCategoryParam(null)).toBeNull();
    expect(parseCategoryParam("")).toBeNull();
    expect(parseCategoryParam("unknown")).toBeNull();
  });
});

describe("CATEGORY_TO_QUERY", () => {
  it("round-trips dresses with parseCategoryParam", () => {
    expect(parseCategoryParam(CATEGORY_TO_QUERY.dresses)).toBe("dresses");
  });
});
