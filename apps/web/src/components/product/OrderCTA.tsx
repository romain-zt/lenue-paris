"use client";

import type { Product, DressLength, DressSize } from "@/types/product";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSelection } from "@/lib/selection/SelectionProvider";
import { VariantSelector } from "./VariantSelector";
import { SizePicker } from "./SizePicker";
import { buildWhatsAppUrl as toWhatsAppUrl } from "@/lib/whatsapp/config";

interface OrderCTAProps {
  product: Product;
}

export function OrderCTA({ product }: OrderCTAProps) {
  const t = useTranslations("order");
  const tProduct = useTranslations("product");
  const tSelection = useTranslations("selection");
  const { addItem, isInSelection, openPanel } = useSelection();
  const isOutOfStock = product.inStock === false;
  const isDress = product.category === "dresses";
  const [length, setLength] = useState<DressLength | null>(null);
  const [size, setSize] = useState<DressSize | null>(null);

  const alreadyInSelection = isInSelection(product.slug);
  const variantsComplete = !isDress || (length !== null && size !== null);
  const variantsMissing = isDress && !variantsComplete;
  const canAdd = variantsComplete && !alreadyInSelection;

  function handleAdd() {
    if (!canAdd) return;
    addItem({
      slug: product.slug,
      title: product.title,
      price: product.price,
      length: isDress ? length : null,
      size: isDress ? size : null,
    });
    openPanel();
  }

  if (isOutOfStock) {
    const interestUrl = toWhatsAppUrl(t("whatsappInterest", { title: product.title }));

    return (
      <div className="space-y-4 rounded-sm border border-subtle bg-surface p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          {tProduct("outOfStock")}
        </p>
        <p className="text-sm leading-relaxed text-muted">{tProduct("outOfStockMessage")}</p>
        <a
          href={interestUrl}
          data-maison="cta-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] w-full items-center justify-center bg-accent px-6 py-3 text-sm font-semibold tracking-wide text-accent-text transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {tProduct("outOfStockCta")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isDress && (
        <>
          <VariantSelector selected={length} onChange={setLength} />
          <SizePicker selected={size} onChange={setSize} />
        </>
      )}
      {variantsMissing && (
        <p className="text-xs text-amber-700" role="alert">
          {t("selectionRequired")}
        </p>
      )}
      <button
        type="button"
        data-maison="cta-add-selection"
        onClick={handleAdd}
        disabled={!canAdd}
        aria-disabled={!canAdd}
        className={`flex min-h-[44px] w-full items-center justify-center px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
          canAdd
            ? "bg-accent text-accent-text hover:bg-accent-hover"
            : "bg-skeleton text-subtle"
        }`}
      >
        {alreadyInSelection ? tSelection("added") : tSelection("add")}
      </button>
    </div>
  );
}
