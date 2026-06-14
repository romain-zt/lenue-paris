import Link from "next/link";
import type { ProductCategoryFilter, SupportedLocale } from "@repo/catalog";
import { getCatalogueCopy } from "@/lib/catalogue-copy";
import styles from "./catalogue.module.css";

interface CatalogueEmptyStateProps {
  locale: SupportedLocale;
  category: ProductCategoryFilter;
}

export function CatalogueEmptyState({
  locale,
  category,
}: CatalogueEmptyStateProps) {
  const copy = getCatalogueCopy(locale);
  const isFiltered = category !== "all";

  return (
    <div className={styles.empty}>
      <p className={styles.emptyText}>
        {isFiltered ? copy.emptyCategory : copy.emptyCatalogue}
      </p>
      {isFiltered ? (
        <Link href={`/${locale}/catalogue`} className={styles.backLink}>
          {copy.viewAll}
        </Link>
      ) : null}
    </div>
  );
}

interface CatalogueErrorStateProps {
  locale: SupportedLocale;
}

export function CatalogueErrorState({ locale }: CatalogueErrorStateProps) {
  const copy = getCatalogueCopy(locale);

  return (
    <div className={styles.error} role="alert">
      <p className={styles.errorText}>{copy.error}</p>
    </div>
  );
}
