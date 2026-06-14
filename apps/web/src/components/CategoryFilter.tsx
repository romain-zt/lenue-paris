"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProductCategory } from "../lib/products";

const CATEGORIES: { label: string; value: ProductCategory | null }[] = [
  { label: "Tout", value: null },
  { label: "Robes", value: "dresses" },
  { label: "Sacs", value: "bags" },
  { label: "Foulards", value: "scarfs" },
];

export function CategoryFilter({
  activeCategory,
}: {
  activeCategory: ProductCategory | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(value: ProductCategory | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <nav
      aria-label="Filtrer par catégorie"
      style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}
    >
      {CATEGORIES.map(({ label, value }) => {
        const isActive = value === activeCategory;
        return (
          <button
            key={value ?? "all"}
            onClick={() => handleSelect(value)}
            aria-pressed={isActive}
            style={{
              padding: "0.625rem 1.25rem",
              minHeight: 44,
              border: "1px solid #333",
              background: isActive ? "#333" : "transparent",
              color: isActive ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: "0.875rem",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
