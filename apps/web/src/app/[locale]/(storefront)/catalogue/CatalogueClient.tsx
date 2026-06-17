"use client";

import { useTranslations } from "next-intl";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

interface CatalogueClientProps {
  initialProducts: Product[];
  initialError: string | null;
}

export function CatalogueClient({ initialProducts, initialError }: CatalogueClientProps) {
  const t = useTranslations("catalogue");

  const sortedProducts = [...initialProducts].sort((a, b) => {
    if (a.inStock === false && b.inStock !== false) return -1;
    if (b.inStock === false && a.inStock !== false) return 1;
    return 0;
  });

  return (
    <div>
      <ProductGrid products={sortedProducts} error={initialError} emptyMessage={t("emptyDefault")} />
    </div>
  );
}
