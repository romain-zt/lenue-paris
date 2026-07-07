import { describe, expect, it } from "vitest";
import { loadBrandFixture, parseBrandArg } from "./loadBrandFixture";

describe("loadBrandFixture", () => {
  it("loads lenue fixture with wordmarks", () => {
    const brand = loadBrandFixture("lenue");
    expect(brand.brandName).toBe("Lénue Paris");
    expect(brand.brandWordmarkPrimary).toBe("LÉNUE");
    expect(brand.brandWordmarkSecondary).toBe("PARIS");
  });

  it("loads template fixture", () => {
    const brand = loadBrandFixture("template");
    expect(brand.slug).toBe("template");
    expect(brand.brandName).toBe("Maison Template");
  });
});

describe("parseBrandArg", () => {
  it("defaults to lenue when no flag", () => {
    expect(parseBrandArg(["node", "seed.ts"])).toBe("lenue");
  });

  it("parses --brand=template", () => {
    expect(parseBrandArg(["node", "seed.ts", "--brand=template"])).toBe("template");
  });
});
