"use client";

import type { DressLength } from "@/types/product";
import { DRESS_LENGTHS } from "@/types/product";

interface VariantSelectorProps {
  selected: DressLength | null;
  onChange: (value: DressLength) => void;
}

export function VariantSelector({ selected, onChange }: VariantSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-stone-900">Longueur</legend>
      <div className="flex gap-2">
        {DRESS_LENGTHS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`min-h-[44px] min-w-[44px] flex-1 border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              selected === value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-600"
            }`}
            aria-pressed={selected === value}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
