import Link from "next/link";
import type { SupportedLocale } from "@repo/catalog";
import type { ProductDetail } from "@repo/product-detail";
import { formatProductPrice, getPdpCopy } from "@/lib/pdp-copy";
import { ProductGallery } from "./ProductGallery";
import styles from "./pdp.module.css";

interface ProductDetailViewProps {
  product: ProductDetail;
  locale: SupportedLocale;
}

export function ProductDetailView({ product, locale }: ProductDetailViewProps) {
  const copy = getPdpCopy(locale);

  return (
    <article className={styles.layout}>
      <ProductGallery gallery={product.gallery} galleryLabel={copy.galleryLabel} />

      <div className={styles.details}>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.price}>
          {formatProductPrice(product.price, locale)}
        </p>
        {product.description ? (
          <p className={styles.description}>{product.description}</p>
        ) : null}
        <Link href={product.orderHref} className={styles.orderCta}>
          {copy.orderCta}
        </Link>
      </div>
    </article>
  );
}

interface ProductNotFoundStateProps {
  locale: SupportedLocale;
  catalogueHref: string;
}

export function ProductNotFoundState({
  locale,
  catalogueHref,
}: ProductNotFoundStateProps) {
  const copy = getPdpCopy(locale);

  return (
    <section className={styles.empty}>
      <h1 className={styles.emptyTitle}>{copy.notFoundTitle}</h1>
      <p className={styles.emptyText}>{copy.notFoundBody}</p>
      <Link href={catalogueHref} className={styles.backLink}>
        {copy.backToCatalogue}
      </Link>
    </section>
  );
}

interface ProductErrorStateProps {
  locale: SupportedLocale;
  catalogueHref: string;
}

export function ProductErrorState({
  locale,
  catalogueHref,
}: ProductErrorStateProps) {
  const copy = getPdpCopy(locale);

  return (
    <section className={styles.error}>
      <h1 className={styles.errorTitle}>{copy.errorTitle}</h1>
      <p className={styles.errorText}>{copy.errorBody}</p>
      <Link href={catalogueHref} className={styles.backLink}>
        {copy.backToCatalogue}
      </Link>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className={styles.skeletonPage} aria-busy="true" aria-live="polite">
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonLine} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
    </div>
  );
}
