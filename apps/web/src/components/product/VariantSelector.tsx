"use client";

import { useTranslations } from "next-intl";
import type { DressLength } from "@/types/product";
import { DRESS_LENGTH_VALUES } from "@/types/product";

interface VariantSelectorProps {
  selected: DressLength | null;
  onChange: (value: DressLength) => void;
}

export function VariantSelector({ selected, onChange }: VariantSelectorProps) {
  const t = useTranslations("product");

  const dressLengths: { value: DressLength; label: string }[] = DRESS_LENGTH_VALUES.map(
    (value) => ({
      value,
      label: value === "longer" ? t("lengthLong") : t("lengthShort"),
    })
  );

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-primary">{t("lengthLabel")}</legend>
      <div className="flex gap-2">
        {dressLengths.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`min-h-[44px] min-w-[44px] flex-1 border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              selected === value
                ? "border-accent bg-accent text-accent-text"
                : "border-subtle bg-white text-secondary hover:border-muted"
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
