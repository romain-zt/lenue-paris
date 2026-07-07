"use client";

import { useTranslations } from "next-intl";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

const SKELETON_COUNT = 8;

export function ProductGrid({
  products,
  isLoading = false,
  error = null,
  emptyMessage,
}: ProductGridProps) {
  const t = useTranslations("catalogue");

  const gridClass =
    "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4";

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <p className="text-muted text-sm">{t("loadError")}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline text-primary min-h-[44px] min-w-[44px] px-4"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={gridClass} aria-label={t("loading")}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center py-24 text-center"
      >
        <p className="text-muted text-sm">{emptyMessage ?? t("emptyDefault")}</p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
