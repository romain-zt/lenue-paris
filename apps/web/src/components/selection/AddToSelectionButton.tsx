"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSelection } from "@/lib/selection/SelectionProvider";
import type { SelectionItem } from "@/lib/selection/types";

type AddToSelectionButtonProps = {
  item: Pick<SelectionItem, "slug" | "title" | "price"> &
    Partial<Pick<SelectionItem, "size" | "length">>;
  variant?: "default" | "overlay";
  className?: string;
};

export function AddToSelectionButton({
  item,
  variant = "default",
  className = "",
}: AddToSelectionButtonProps) {
  const t = useTranslations("selection");
  const { addItem, isInSelection, isFull } = useSelection();
  const [feedback, setFeedback] = useState<"idle" | "added" | "full" | "duplicate">("idle");

  const selected = isInSelection(item.slug);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (selected) {
      setFeedback("duplicate");
      return;
    }
    if (isFull) {
      setFeedback("full");
      return;
    }

    const added = addItem({
      slug: item.slug,
      title: item.title,
      price: item.price,
      size: item.size ?? null,
      length: item.length ?? null,
    });

    if (added) {
      setFeedback("added");
      window.setTimeout(() => setFeedback("idle"), 2000);
    }
  }

  const label =
    feedback === "added"
      ? t("added")
      : feedback === "full"
        ? t("full")
        : feedback === "duplicate"
          ? t("alreadyAdded")
          : selected
            ? t("inSelection")
            : t("add");

  const isOverlay = variant === "overlay";

  return (
    <button
      type="button"
      data-testid="add-to-selection-button"
      onClick={handleClick}
      disabled={selected}
      aria-disabled={selected}
      className={`w-full font-medium uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 disabled:cursor-default ${
        isOverlay
          ? "min-h-[36px] bg-white/90 text-[9px] tracking-[0.12em]"
          : "min-h-[44px] text-[10px] tracking-[0.12em]"
      } ${
        selected
          ? "text-stone-400"
          : feedback === "full"
            ? "text-amber-700"
            : "text-stone-600 hover:text-stone-900"
      } ${className}`}
    >
      {label}
    </button>
  );
}
