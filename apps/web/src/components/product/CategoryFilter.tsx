"use client";

import type { ProductCategory } from "@/types/product";

const CATEGORIES: { value: ProductCategory | null; label: string }[] = [
  { value: null, label: "Tout" },
  { value: "dresses", label: "Robes" },
  { value: "bags", label: "Sacs" },
  { value: "scarfs", label: "Foulards" },
];

interface CategoryFilterProps {
  selected: ProductCategory | null;
  onSelect: (category: ProductCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <nav aria-label="Filtrer par catégorie">
      <ul className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => {
          const isActive = selected === value;
          return (
            <li key={label}>
              <button
                onClick={() => onSelect(value)}
                aria-pressed={isActive}
                className={[
                  "min-h-[44px] min-w-[44px] px-4 text-sm transition-colors",
                  isActive
                    ? "bg-stone-900 text-white"
                    : "bg-transparent text-stone-600 hover:text-stone-900 border border-stone-200",
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
