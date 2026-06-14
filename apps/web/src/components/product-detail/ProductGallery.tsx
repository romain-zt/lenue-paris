"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductGalleryImage } from "@repo/product-detail";
import styles from "./pdp.module.css";

interface ProductGalleryProps {
  gallery: ProductGalleryImage[];
  galleryLabel: string;
}

export function ProductGallery({ gallery, galleryLabel }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex];

  return (
    <section className={styles.gallerySection} aria-label={galleryLabel}>
      <div className={styles.mainImageWrap}>
        {activeImage ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className={styles.mainImage}
          />
        ) : (
          <div
            className={styles.imagePlaceholder}
            aria-hidden="true"
            role="presentation"
          />
        )}
      </div>

      {gallery.length > 1 ? (
        <div className={styles.thumbnails} role="tablist" aria-label={galleryLabel}>
          {gallery.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${galleryLabel} ${index + 1}`}
                className={`${styles.thumbnailButton} ${
                  isActive ? styles.thumbnailButtonActive : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="72px"
                  className={styles.thumbnailImage}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
