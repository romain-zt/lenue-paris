/** Dress length options — mirrors CMS `products.lengthVariants`. */
export const PRODUCT_LENGTH_VARIANTS = ["longer", "shorter"] as const;

export type ProductLengthVariant = (typeof PRODUCT_LENGTH_VARIANTS)[number];

/** Fixed dress size set per Q-005 — mirrors CMS `products.sizes`. */
export const PRODUCT_SIZE_CODES = ["XS", "S", "M", "L", "XL"] as const;

export type ProductSizeCode = (typeof PRODUCT_SIZE_CODES)[number];

export interface ProductVariantPickers {
  lengthOptions: ProductLengthVariant[];
  sizeOptions: ProductSizeCode[];
}

export interface ProductVariantSelection {
  length?: ProductLengthVariant;
  size?: ProductSizeCode;
}
