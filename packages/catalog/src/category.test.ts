import { describe, expect, it } from "vitest";
import {
  cmsCategoryForFilter,
  FILTER_TO_CMS,
  isProductCategoryFilter,
  normalizeCategoryFilter,
} from "./category";

describe("category filter mapping", () => {
  it("maps buyer filters to CMS values", () => {
    expect(FILTER_TO_CMS.dress).toBe("robe");
    expect(FILTER_TO_CMS.bag).toBe("sac");
    expect(FILTER_TO_CMS.scarf).toBe("foulard");
  });

  it("returns null CMS category for all", () => {
    expect(cmsCategoryForFilter("all")).toBeNull();
  });

  it("resolves CMS category for each filter", () => {
    expect(cmsCategoryForFilter("dress")).toBe("robe");
    expect(cmsCategoryForFilter("bag")).toBe("sac");
    expect(cmsCategoryForFilter("scarf")).toBe("foulard");
  });

  it("normalizes invalid filters to all", () => {
    expect(normalizeCategoryFilter(undefined)).toBe("all");
    expect(normalizeCategoryFilter("")).toBe("all");
    expect(normalizeCategoryFilter("invalid")).toBe("all");
  });

  it("accepts valid filter strings", () => {
    expect(isProductCategoryFilter("dress")).toBe(true);
    expect(isProductCategoryFilter("all")).toBe(true);
    expect(isProductCategoryFilter("robe")).toBe(false);
  });
});
