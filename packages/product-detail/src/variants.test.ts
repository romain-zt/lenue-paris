import { describe, expect, it } from "vitest";
import {
  PRODUCT_LENGTH_VARIANTS,
  PRODUCT_SIZE_CODES,
  type ProductVariantPickers,
} from "./variants";

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
