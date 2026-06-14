import {
  PRODUCT_LENGTH_VARIANTS,
  PRODUCT_SIZE_CODES,
  type ProductLengthVariant,
  type ProductSizeCode,
  type ProductVariantSelection,
} from "@repo/product-detail";

const LENGTH_SET = new Set<string>(PRODUCT_LENGTH_VARIANTS);
const SIZE_SET = new Set<string>(PRODUCT_SIZE_CODES);

export function parseOrderVariantParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProductVariantSelection {
  const lengthRaw = searchParams.length;
  const sizeRaw = searchParams.size;
  const lengthValue = Array.isArray(lengthRaw) ? lengthRaw[0] : lengthRaw;
  const sizeValue = Array.isArray(sizeRaw) ? sizeRaw[0] : sizeRaw;

  const selection: ProductVariantSelection = {};

  if (lengthValue && LENGTH_SET.has(lengthValue)) {
    selection.length = lengthValue as ProductLengthVariant;
  }

  if (sizeValue && SIZE_SET.has(sizeValue)) {
    selection.size = sizeValue as ProductSizeCode;
  }

  return selection;
}
