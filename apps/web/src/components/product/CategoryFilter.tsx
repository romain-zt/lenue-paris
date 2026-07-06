"use client";

import { useTranslations } from "next-intl";
import type { ProductCategory } from "@/types/product";

interface CategoryFilterProps {
  selected: ProductCategory | null;
  onSelect: (category: ProductCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const t = useTranslations();

  const categories: { value: ProductCategory | null; label: string }[] = [
    { value: null, label: t("catalogue.all") },
    { value: "dresses", label: t("nav.dresses") },
  ];

  return (
    <nav aria-label={t("nav.filterByCategory")}>
      <ul className="flex flex-wrap gap-2">
        {categories.map(({ value, label }) => {
          const isActive = selected === value;
          return (
            <li key={label}>
              <button
                onClick={() => onSelect(value)}
                aria-pressed={isActive}
                className={[
                  "min-h-[44px] min-w-[44px] px-4 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-text"
                    : "bg-transparent text-muted hover:text-primary border border-subtle",
                ].join(" ")}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
