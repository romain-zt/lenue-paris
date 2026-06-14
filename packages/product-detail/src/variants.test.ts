import { describe, expect, it } from "vitest";
import type { PayloadProductDetailDoc } from "./payload-doc";
import {
  buildOrderHrefWithVariants,
  isVariantSelectionComplete,
  PRODUCT_LENGTH_VARIANTS,
  PRODUCT_SIZE_CODES,
  resolveVariantPickers,
  type ProductVariantPickers,
} from "./variants";

const dressDoc = (
  overrides: Partial<PayloadProductDetailDoc> = {},
): PayloadProductDetailDoc => ({
  id: 1,
  slug: "robe-lin",
  name: "Robe en lin",
  price: 320,
  category: "robe",
  ...overrides,
});

describe("variant picker contracts", () => {
  it("defines fixed length and size code unions aligned with CMS", () => {
    expect([...PRODUCT_LENGTH_VARIANTS]).toEqual(["longer", "shorter"]);
    expect([...PRODUCT_SIZE_CODES]).toEqual(["XS", "S", "M", "L", "XL"]);
  });

  it("accepts a ProductVariantPickers shape", () => {
    const pickers: ProductVariantPickers = {
      lengthOptions: ["longer", "shorter"],
      sizeOptions: ["XS", "S", "M", "L", "XL"],
    };

    expect(pickers.lengthOptions).toHaveLength(2);
    expect(pickers.sizeOptions).toHaveLength(5);
  });
});

describe("resolveVariantPickers", () => {
  it("returns options for dress docs with CMS variant fields", () => {
    expect(
      resolveVariantPickers(
        dressDoc({
          lengthVariants: ["longer", "shorter"],
          sizes: ["S", "M", "L"],
        }),
      ),
    ).toEqual({
      lengthOptions: ["longer", "shorter"],
      sizeOptions: ["S", "M", "L"],
    });
  });

  it("defaults dress sizes to XS–XL when CMS sizes are unset", () => {
    expect(
      resolveVariantPickers(
        dressDoc({
          lengthVariants: ["longer"],
        }),
      ),
    ).toEqual({
      lengthOptions: ["longer"],
      sizeOptions: ["XS", "S", "M", "L", "XL"],
    });
  });

  it("returns null when dress length variants are empty", () => {
    expect(resolveVariantPickers(dressDoc({ lengthVariants: [] }))).toBeNull();
    expect(resolveVariantPickers(dressDoc({ lengthVariants: null }))).toBeNull();
  });

  it("returns null when dress size list resolves empty", () => {
    expect(resolveVariantPickers(dressDoc({ lengthVariants: ["shorter"], sizes: [] }))).toBeNull();
  });

  it("returns null for bag and scarf categories", () => {
    expect(
      resolveVariantPickers(
        dressDoc({
          category: "sac",
          lengthVariants: ["longer"],
          sizes: ["M"],
        }),
      ),
    ).toBeNull();

    expect(
      resolveVariantPickers(
        dressDoc({
          category: "foulard",
          lengthVariants: ["longer"],
          sizes: ["M"],
        }),
      ),
    ).toBeNull();
  });
});

describe("buildOrderHrefWithVariants", () => {
  it("appends length and size query params when selection is complete", () => {
    expect(
      buildOrderHrefWithVariants("fr", "robe-lin", {
        length: "longer",
        size: "M",
      }),
    ).toBe("/fr/order/robe-lin?length=longer&size=M");
  });

  it("returns base order href without params for partial selection", () => {
    expect(
      buildOrderHrefWithVariants("en", "robe-lin", {
        length: "shorter",
      }),
    ).toBe("/en/order/robe-lin");
  });

  it("returns base order href when no selection is provided", () => {
    expect(buildOrderHrefWithVariants("fr", "sac-cuir")).toBe("/fr/order/sac-cuir");
  });
});

describe("isVariantSelectionComplete", () => {
  const pickers: ProductVariantPickers = {
    lengthOptions: ["longer", "shorter"],
    sizeOptions: ["XS", "S", "M", "L", "XL"],
  };

  it("requires both length and size for dress pickers", () => {
    expect(isVariantSelectionComplete(pickers, { length: "longer", size: "M" })).toBe(true);
    expect(isVariantSelectionComplete(pickers, { length: "longer" })).toBe(false);
    expect(isVariantSelectionComplete(pickers, { size: "S" })).toBe(false);
    expect(isVariantSelectionComplete(pickers, {})).toBe(false);
  });

  it("rejects selections outside configured options", () => {
    expect(
      isVariantSelectionComplete(pickers, {
        length: "longer",
        size: "XXL" as "XL",
      }),
    ).toBe(false);
  });

  it("treats null pickers as complete for non-dress products", () => {
    expect(isVariantSelectionComplete(null, {})).toBe(true);
    expect(isVariantSelectionComplete(null)).toBe(true);
  });
});
