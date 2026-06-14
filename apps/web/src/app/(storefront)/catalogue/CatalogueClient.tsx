"use client";

import { useState } from "react";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, ProductCategory } from "@/types/product";

interface CatalogueClientProps {
  initialProducts: Product[];
  initialError: string | null;
}

const CATEGORY_EMPTY_MESSAGES: Record<ProductCategory, string> = {
  dresses: "Aucune robe disponible pour l'instant.",
  bags: "Aucun sac disponible pour l'instant.",
  scarfs: "Aucun foulard disponible pour l'instant.",
};

export function CatalogueClient({
  initialProducts,
  initialError,
}: CatalogueClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const filteredProducts = selectedCategory
    ? initialProducts.filter((p) => p.category === selectedCategory)
    : initialProducts;

  const emptyMessage =
    selectedCategory
      ? CATEGORY_EMPTY_MESSAGES[selectedCategory]
      : "La collection arrive bientôt.";

  return (
    <div className="space-y-6">
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      <ProductGrid
        products={filteredProducts}
        error={initialError}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
