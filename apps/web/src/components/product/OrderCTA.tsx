"use client";

import type { Product, DressLength, DressSize } from "@/types/product";
import { useState } from "react";
import { VariantSelector } from "./VariantSelector";
import { SizePicker } from "./SizePicker";

interface OrderCTAProps {
  product: Product;
}

export function OrderCTA({ product }: OrderCTAProps) {
  const isDress = product.category === "dresses";
  const [length, setLength] = useState<DressLength | null>(null);
  const [size, setSize] = useState<DressSize | null>(null);

  const selectionComplete = !isDress || (length !== null && size !== null);
  const selectionMissing = isDress && !selectionComplete;

  function buildWhatsAppUrl(): string {
    const lines: string[] = [`Bonjour, je souhaite commander : ${product.title}`];
    if (isDress && length) {
      const label = length === "longer" ? "version longue" : "version courte";
      lines.push(`Longueur : ${label}`);
    }
    if (isDress && size) {
      lines.push(`Taille : ${size}`);
    }
    const text = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/?text=${text}`;
  }

  return (
    <div className="space-y-5">
      {isDress && (
        <>
          <VariantSelector selected={length} onChange={setLength} />
          <SizePicker selected={size} onChange={setSize} />
        </>
      )}

      {selectionMissing && (
        <p className="text-xs text-amber-700" role="alert">
          Veuillez choisir une longueur et une taille pour continuer.
        </p>
      )}

      <a
        href={selectionComplete ? buildWhatsAppUrl() : undefined}
        target="_blank"
        rel="noopener noreferrer"
        role="button"
        aria-disabled={!selectionComplete}
        onClick={(e) => {
          if (!selectionComplete) e.preventDefault();
        }}
        className={`flex min-h-[52px] w-full items-center justify-center px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ${
          selectionComplete
            ? "bg-stone-900 text-white hover:bg-stone-700"
            : "cursor-not-allowed bg-stone-200 text-stone-400"
        }`}
      >
        Commander via WhatsApp
      </a>
    </div>
  );
}
