"use client";

import Link from "next/link";
import { useState } from "react";
import type { SupportedLocale } from "@repo/catalog";
import {
  buildOrderHrefWithVariants,
  isVariantSelectionComplete,
  type ProductLengthVariant,
  type ProductSizeCode,
  type ProductVariantPickers,
  type ProductVariantSelection,
} from "@repo/product-detail";
import type { PdpCopy } from "@/lib/pdp-copy";
import styles from "./pdp.module.css";

interface ProductOrderSectionProps {
  locale: SupportedLocale;
  slug: string;
  orderHref: string;
  variantPickers: ProductVariantPickers | null;
  copy: PdpCopy;
}

function getLengthLabel(option: ProductLengthVariant, copy: PdpCopy): string {
  return option === "longer" ? copy.lengthLonger : copy.lengthShorter;
}

export function ProductOrderSection({
  locale,
  slug,
  orderHref,
  variantPickers,
  copy,
}: ProductOrderSectionProps) {
  const [selection, setSelection] = useState<ProductVariantSelection>({});

  if (!variantPickers) {
    return (
      <Link href={orderHref} className={styles.orderCta}>
        {copy.orderCta}
      </Link>
    );
  }

  const complete = isVariantSelectionComplete(variantPickers, selection);
  const hasPartialSelection = Boolean(selection.length || selection.size);
  const missingLength = hasPartialSelection && !selection.length;
  const missingSize = hasPartialSelection && !selection.size;
  const resolvedHref = buildOrderHrefWithVariants(locale, slug, selection);

  function selectLength(length: ProductLengthVariant) {
    setSelection((current) => ({ ...current, length }));
  }

  function selectSize(size: ProductSizeCode) {
    setSelection((current) => ({ ...current, size }));
  }

  return (
    <div className={styles.orderSection}>
      <div className={styles.variantPickers}>
        <fieldset
          className={`${styles.pickerGroup} ${
            missingLength ? styles.pickerGroupMissing : ""
          }`}
        >
          <legend className={styles.pickerLegend}>{copy.lengthGroupLabel}</legend>
          <div className={styles.pickerOptions} role="group">
            {variantPickers.lengthOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.pickerOption} ${
                  selection.length === option ? styles.pickerOptionSelected : ""
                }`}
                aria-pressed={selection.length === option}
                onClick={() => selectLength(option)}
              >
                {getLengthLabel(option, copy)}
              </button>
            ))}
          </div>
          {missingLength ? (
            <p className={styles.pickerHint} role="status">
              {copy.missingLength}
            </p>
          ) : null}
        </fieldset>

        <fieldset
          className={`${styles.pickerGroup} ${
            missingSize ? styles.pickerGroupMissing : ""
          }`}
        >
          <legend className={styles.pickerLegend}>{copy.sizeGroupLabel}</legend>
          <div className={styles.pickerOptions} role="group">
            {variantPickers.sizeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.pickerOption} ${
                  selection.size === option ? styles.pickerOptionSelected : ""
                }`}
                aria-pressed={selection.size === option}
                onClick={() => selectSize(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {missingSize ? (
            <p className={styles.pickerHint} role="status">
              {copy.missingSize}
            </p>
          ) : null}
        </fieldset>
      </div>

      {!complete ? (
        <p className={styles.selectionRequired} role="status">
          {copy.selectionRequired}
        </p>
      ) : null}

      {complete ? (
        <Link href={resolvedHref} className={styles.orderCta}>
          {copy.orderCta}
        </Link>
      ) : (
        <span className={styles.orderCtaDisabled} aria-disabled="true">
          {copy.orderCta}
        </span>
      )}
    </div>
  );
}
