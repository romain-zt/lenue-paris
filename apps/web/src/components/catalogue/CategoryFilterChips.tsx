import Link from "next/link";
import {
  PRODUCT_CATEGORY_FILTERS,
  type ProductCategoryFilter,
  type SupportedLocale,
} from "@repo/catalog";
import { getCatalogueCopy } from "@/lib/catalogue-copy";
import styles from "./catalogue.module.css";

interface CategoryFilterChipsProps {
  locale: SupportedLocale;
  activeCategory: ProductCategoryFilter;
}

export function CategoryFilterChips({
  locale,
  activeCategory,
}: CategoryFilterChipsProps) {
  const copy = getCatalogueCopy(locale);

  return (
    <nav aria-label={copy.title} className={styles.filters}>
      {PRODUCT_CATEGORY_FILTERS.map((filter) => {
        const href =
          filter === "all"
            ? `/${locale}/catalogue`
            : `/${locale}/catalogue?category=${filter}`;
        const isActive = activeCategory === filter;

        return (
          <Link
            key={filter}
            href={href}
            className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {copy.categoryLabels[filter]}
          </Link>
        );
      })}
    </nav>
  );
}
