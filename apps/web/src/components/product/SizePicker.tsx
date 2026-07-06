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
      <legend className="mb-2 text-sm font-medium text-primary">{t("sizeLabel")}</legend>
      <div className="flex flex-wrap gap-2">
        {DRESS_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`min-h-[44px] min-w-[44px] border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              selected === size
                ? "border-accent bg-accent text-accent-text"
                : "border-subtle bg-white text-secondary hover:border-muted"
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
