"use client";

import { useTranslations } from "next-intl";
import type { DressSize } from "@/types/product";
import { DRESS_SIZES } from "@/types/product";

interface SizePickerProps {
  selected: DressSize | null;
  onChange: (size: DressSize) => void;
}

export function SizePicker({ selected, onChange }: SizePickerProps) {
  const t = useTranslations("product");

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-stone-900">{t("sizeLabel")}</legend>
      <div className="flex flex-wrap gap-2">
        {DRESS_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`min-h-[44px] min-w-[44px] border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              selected === size
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-600"
            }`}
            aria-pressed={selected === size}
          >
            {size}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
