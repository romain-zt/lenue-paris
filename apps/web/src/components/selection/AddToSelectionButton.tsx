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

  const isOverlay = variant === "overlay";

  if (isOverlay) {
    const iconFilled = selected || feedback === "added";
    return (
      <button
        type="button"
        data-testid="add-to-selection-button"
        onClick={handleClick}
        disabled={selected}
        aria-disabled={selected}
        aria-label={selected ? t("inSelection") : t("add")}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-opacity focus-visible:outline-none disabled:cursor-default ${
          selected ? "opacity-100" : "opacity-70 hover:opacity-100"
        } ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          strokeWidth={1.4}
          stroke="white"
          fill={iconFilled ? "white" : "none"}
          className="h-5 w-5 drop-shadow-sm"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
          />
        </svg>
      </button>
    );
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

  return (
    <button
      type="button"
      data-testid="add-to-selection-button"
      onClick={handleClick}
      disabled={selected}
      aria-disabled={selected}
      className={`w-full min-h-[44px] text-[10px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 disabled:cursor-default ${
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
