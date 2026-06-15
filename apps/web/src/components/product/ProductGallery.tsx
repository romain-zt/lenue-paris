"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductMedia, ProductGalleryItem } from "@/types/product";

interface ProductGalleryProps {
  mainImage: ProductMedia;
  gallery?: ProductGalleryItem[] | null;
  title: string;
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-200"
      aria-label={label}
    >
      <span
        className="select-none font-serif text-8xl font-light text-stone-300"
        aria-hidden="true"
      >
        L
      </span>
      <span
        className="mt-2 select-none text-[9px] tracking-[0.4em] text-stone-400"
        aria-hidden="true"
      >
        LÉNUE
      </span>
    </div>
  );
}

export function ProductGallery({ mainImage, gallery, title }: ProductGalleryProps) {
  const allImages: ProductMedia[] = [
    mainImage,
    ...(gallery ?? []).map((g) => g.image),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = allImages[activeIndex] ?? mainImage;
  const activeUrl = active.url ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={active.alt || title}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder label={title} />
        )}
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => {
            const thumbUrl = img.url ?? null;
            return (
              <button
                key={img.id ?? i}
                onClick={() => setActiveIndex(i)}
                className={`relative h-16 w-12 shrink-0 overflow-hidden bg-stone-100 ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                  i === activeIndex
                    ? "ring-stone-900"
                    : "opacity-60 ring-transparent hover:opacity-100"
                }`}
                aria-label={`Voir photo ${i + 1}`}
                aria-pressed={i === activeIndex}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={img.alt || `${title} — photo ${i + 1}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-stone-50 to-stone-200">
                    <span
                      className="select-none font-serif text-xl font-light text-stone-300"
                      aria-hidden="true"
                    >
                      L
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
