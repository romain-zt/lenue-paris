"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CATEGORY_TO_QUERY, parseCategoryParam } from "@/lib/catalogueCategory";
import type { Product, ProductCategory } from "@/types/product";

interface CatalogueClientProps {
  initialProducts: Product[];
  initialError: string | null;
  initialCategory: ProductCategory | null;
}

export function CatalogueClient({
  initialProducts,
  initialError,
  initialCategory,
}: CatalogueClientProps) {
  const t = useTranslations("catalogue");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(initialCategory);

  useEffect(() => {
    setSelectedCategory(parseCategoryParam(searchParams.get("categorie")));
  }, [searchParams]);

  const handleSelect = (category: ProductCategory | null) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("categorie", CATEGORY_TO_QUERY[category]);
    } else {
      params.delete("categorie");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

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
      <CategoryFilter selected={selectedCategory} onSelect={handleSelect} />
      <ProductGrid products={filteredProducts} error={initialError} emptyMessage={emptyMessage} />
    </div>
  );
}
