"use client";

import Image from "next/image";
import { useState } from "react";
import { useSiteBrand } from "@/lib/site/SiteBrandProvider";
import { getProductGalleryUrls, getProductMainImageUrl } from "@/lib/productImages";
import type { ProductGalleryItem, ProductMedia } from "@/types/product";

interface ProductGalleryProps {
  slug: string;
  mainImage: ProductMedia;
  gallery?: ProductGalleryItem[] | null;
  title: string;
}

function ImagePlaceholder({ label }: { label: string }) {
  const { wordmarkPrimary } = useSiteBrand();

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface to-skeleton"
      aria-label={label}
    >
      <span
        className="select-none font-serif text-8xl font-light text-subtle"
        aria-hidden="true"
      >
        {wordmarkPrimary.charAt(0) || "·"}
      </span>
      <span
        className="mt-2 select-none text-[9px] tracking-[0.4em] text-subtle"
        aria-hidden="true"
      >
        {wordmarkPrimary}
      </span>
    </div>
  );
}

export function ProductGallery({ slug, mainImage, gallery, title }: ProductGalleryProps) {
  const mainUrl = getProductMainImageUrl(slug, mainImage.url);
  const galleryUrls = getProductGalleryUrls(slug, gallery);
  const allUrls = [mainUrl, ...galleryUrls.filter((url) => url !== mainUrl)].filter(
    (url): url is string => Boolean(url),
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const activeUrl = allUrls[activeIndex] ?? null;

  return (
    <div className="space-y-3" data-maison="product-gallery">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={title}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder label={title} />
        )}
      </div>

      {allUrls.length > 1 && (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {allUrls.map((url, i) => (
            <button
              key={url}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-12 shrink-0 snap-start overflow-hidden bg-surface ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                i === activeIndex
                  ? "ring-accent"
                  : "opacity-60 ring-transparent hover:opacity-100"
              }`}
              aria-label={`Voir photo ${i + 1}`}
              aria-pressed={i === activeIndex}
            >
              <Image
                src={url}
                alt={`${title} — photo ${i + 1}`}
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
