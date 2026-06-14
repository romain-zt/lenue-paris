import type { PayloadProductDetailDoc } from "./payload-doc";

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

const LENGTH_VARIANT_SET = new Set<string>(PRODUCT_LENGTH_VARIANTS);
const SIZE_CODE_SET = new Set<string>(PRODUCT_SIZE_CODES);

function normalizeLengthVariants(
  values: ProductLengthVariant[] | null | undefined,
): ProductLengthVariant[] {
  if (!values?.length) {
    return [];
  }

  return values.filter((value): value is ProductLengthVariant => LENGTH_VARIANT_SET.has(value));
}

function normalizeSizeCodes(
  values: ProductSizeCode[] | null | undefined,
): ProductSizeCode[] {
  if (values == null) {
    return [...PRODUCT_SIZE_CODES];
  }

  if (values.length === 0) {
    return [];
  }

  return values.filter((value): value is ProductSizeCode => SIZE_CODE_SET.has(value));
}

export function resolveVariantPickers(
  doc: Pick<PayloadProductDetailDoc, "category" | "lengthVariants" | "sizes">,
): ProductVariantPickers | null {
  if (doc.category !== "robe") {
    return null;
  }

  const lengthOptions = normalizeLengthVariants(doc.lengthVariants);
  const sizeOptions = normalizeSizeCodes(doc.sizes);

  if (lengthOptions.length === 0 || sizeOptions.length === 0) {
    return null;
  }

  return { lengthOptions, sizeOptions };
}

export function buildOrderHrefWithVariants(
  locale: string,
  slug: string,
  selection?: ProductVariantSelection,
): string {
  const baseHref = `/${locale}/order/${slug}`;

  if (!selection?.length || !selection.size) {
    return baseHref;
  }

  const params = new URLSearchParams({
    length: selection.length,
    size: selection.size,
  });

  return `${baseHref}?${params.toString()}`;
}

export function isVariantSelectionComplete(
  variantPickers: ProductVariantPickers | null,
  selection: ProductVariantSelection = {},
): boolean {
  if (!variantPickers) {
    return true;
  }

  const { length, size } = selection;
  if (!length || !size) {
    return false;
  }

  return (
    variantPickers.lengthOptions.includes(length) &&
    variantPickers.sizeOptions.includes(size)
  );
}
