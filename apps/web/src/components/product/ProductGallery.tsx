"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductMedia, ProductGalleryItem } from "@/types/product";

interface ProductGalleryProps {
  mainImage: ProductMedia;
  gallery?: ProductGalleryItem[] | null;
  title: string;
}

export function ProductGallery({ mainImage, gallery, title }: ProductGalleryProps) {
  const allImages: ProductMedia[] = [
    mainImage,
    ...(gallery ?? []).map((g) => g.image),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = allImages[activeIndex] ?? mainImage;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <Image
          src={active.url ?? "/placeholder.png"}
          alt={active.alt || title}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-12 shrink-0 overflow-hidden bg-stone-100 ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                i === activeIndex ? "ring-stone-900" : "ring-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Voir photo ${i + 1}`}
              aria-pressed={i === activeIndex}
            >
              <Image
                src={img.url ?? "/placeholder.png"}
                alt={img.alt || `${title} — photo ${i + 1}`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
