export {
  buildCatalogueHref,
  buildDetailHref,
  buildOrderHref,
  buildProductDetailResponse,
  buildProductNotFoundResponse,
  fetchProductDetail,
  isProductAvailable,
  normalizeProductDetailQuery,
  toProductDetail,
} from "./product-detail";
export type {
  ProductBySlugFinder,
  ProductDetailQueryInput,
} from "./product-detail";
export { resolveGalleryImages } from "./gallery";
export { extractPlainTextFromRichText } from "./rich-text";
export type { PayloadProductDetailDoc } from "./payload-doc";
export type {
  ProductDetail,
  ProductDetailQuery,
  ProductDetailResponse,
  ProductDetailResult,
  ProductGalleryImage,
  ProductNotFoundResponse,
} from "./types";
export {
  buildOrderHrefWithVariants,
  isVariantSelectionComplete,
  PRODUCT_LENGTH_VARIANTS,
  PRODUCT_SIZE_CODES,
  resolveVariantPickers,
} from "./variants";
export type {
  ProductLengthVariant,
  ProductSizeCode,
  ProductVariantPickers,
  ProductVariantSelection,
} from "./variants";
