import Image from "next/image";
import Link from "next/link";
import type { ProductCard, SupportedLocale } from "@repo/catalog";
import { formatCataloguePrice } from "@/lib/catalogue-copy";
import styles from "./catalogue.module.css";

interface ProductCardLinkProps {
  product: ProductCard;
  locale: SupportedLocale;
}

export function ProductCardLink({ product, locale }: ProductCardLinkProps) {
  return (
    <Link href={product.detailHref} className={styles.card}>
      <div className={styles.imageWrap}>
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div
            className={styles.imagePlaceholder}
            aria-hidden="true"
            role="presentation"
          />
        )}
      </div>
      <div className={styles.cardMeta}>
        <p className={styles.cardName}>{product.name}</p>
        <p className={styles.cardPrice}>
          {formatCataloguePrice(product.price, locale)}
        </p>
      </div>
    </Link>
  );
}

interface CatalogueGridProps {
  products: ProductCard[];
  locale: SupportedLocale;
}

export function CatalogueGrid({ products, locale }: CatalogueGridProps) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCardLink key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}

export function CatalogueGridSkeleton() {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-live="polite">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        </div>
      ))}
    </div>
  );
}
