import { describe, expect, it } from "vitest";
import type { ProductVariantPickers } from "@repo/product-detail";
import type { CreateOrderInput } from "./types";
import { validateOrderInput } from "./validation";

const dressPickers: ProductVariantPickers = {
  lengthOptions: ["longer", "shorter"],
  sizeOptions: ["XS", "S", "M", "L", "XL"],
};

const validDressInput: CreateOrderInput = {
  customerName: "Anna",
  customerPhone: "+33612345678",
  customerEmail: "anna@example.com",
  productSlug: "robe-lin",
  locale: "fr",
  length: "longer",
  size: "M",
};

describe("validateOrderInput", () => {
  it("accepts a complete dress order (spec AC-6 happy path)", () => {
    expect(validateOrderInput(validDressInput, { variantPickers: dressPickers })).toEqual([]);
  });

  it("requires customerName and customerPhone", () => {
    const errors = validateOrderInput(
      { ...validDressInput, customerName: "  ", customerPhone: "" },
      { variantPickers: dressPickers },
    );

    expect(errors.map((error) => error.field)).toEqual(["customerName", "customerPhone"]);
  });

  it("requires length and size for dress orders", () => {
    const errors = validateOrderInput(
      { ...validDressInput, length: undefined, size: undefined },
      { variantPickers: dressPickers },
    );

    expect(errors.map((error) => error.field)).toEqual(["length", "size"]);
  });

  it("rejects invalid dress variant values", () => {
    const errors = validateOrderInput(
      { ...validDressInput, length: "longer", size: "XXL" },
      { variantPickers: dressPickers },
    );

    expect(errors).toEqual([{ field: "size", message: expect.stringContaining("Taille") }]);
  });

  it("rejects invalid email when provided", () => {
    const errors = validateOrderInput(
      { ...validDressInput, customerEmail: "not-an-email" },
      { variantPickers: dressPickers },
    );

    expect(errors).toEqual([{ field: "customerEmail", message: expect.any(String) }]);
  });

  it("does not require length or size for non-dress products", () => {
    const bagInput: CreateOrderInput = {
      customerName: "Anna",
      customerPhone: "+33612345678",
      productSlug: "sac-cuir",
      locale: "en",
    };

    expect(validateOrderInput(bagInput, { variantPickers: null })).toEqual([]);
  });

  it("returns localized validation messages", () => {
    const errors = validateOrderInput(
      { ...validDressInput, customerName: "", locale: "ru" },
      { variantPickers: dressPickers },
    );

    expect(errors[0]?.message).toBe("Укажите ваше имя");
  });
});
