export type DressLengthVariant = "longer" | "shorter";
export type DressSizeVariant = "XS" | "S" | "M" | "L" | "XL";

export interface CreateOrderRequest {
  productSlug: string;
  length?: DressLengthVariant;
  size?: DressSizeVariant;
  buyerName: string;
  buyerContact: string;
}

export interface CreateOrderResponse {
  id: string;
}

export interface CreateOrderError {
  error: string;
}
