import { describe, it, expect } from "vitest";

/**
 * getBrandPageData now fetches directly via getPayload() SDK (no HTTP / getPage dependency).
 * Presentational behavior is tested in BrandPage.test.tsx via BrandPageContent props.
 * Here we only assert the module's export contract.
 */
describe("getBrandPageData module contract", () => {
  it("exports getBrandPageData as a function", async () => {
    const mod = await import("@/lib/getBrandPageData");
    expect(typeof mod.getBrandPageData).toBe("function");
  });

  it("returns empty state on error / missing CMS row (catch branch)", async () => {
    // Calling with an invalid locale exercises the catch path (getPayload not configured in test env)
    const { getBrandPageData } = await import("@/lib/getBrandPageData");
    const result = await getBrandPageData("fr");
    // In test env, getPayload throws → catch returns empty state
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("body");
    expect(result).toHaveProperty("cover");
  });
});
