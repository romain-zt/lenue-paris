"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, ProductCategory } from "@/types/product";

interface CatalogueClientProps {
  initialProducts: Product[];
  initialError: string | null;
}

export function CatalogueClient({ initialProducts, initialError }: CatalogueClientProps) {
  const t = useTranslations("catalogue");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const filteredProducts = selectedCategory
    ? initialProducts.filter((p) => p.category === selectedCategory)
    : initialProducts;

  const emptyMessage = selectedCategory
    ? selectedCategory === "dresses"
      ? t("emptyDresses")
      : selectedCategory === "bags"
        ? t("emptyBags")
        : t("emptyScarfs")
    : t("emptyDefault");

  return (
    <div className="space-y-6">
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      <ProductGrid products={filteredProducts} error={initialError} emptyMessage={emptyMessage} />
    </div>
  );
}
