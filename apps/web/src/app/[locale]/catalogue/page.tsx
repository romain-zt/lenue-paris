import {
  fetchCatalogList,
  normalizeLocale,
  type SupportedLocale,
} from "@repo/catalog";
import {
  CatalogueErrorState,
  CatalogueEmptyState,
} from "@/components/catalogue/CatalogueEmptyState";
import { CategoryFilterChips } from "@/components/catalogue/CategoryFilterChips";
import { CatalogueGrid } from "@/components/catalogue/CatalogueGrid";
import { getCatalogueCopy } from "@/lib/catalogue-copy";
import { findPayloadProducts } from "@/lib/find-payload-products";
import styles from "@/components/catalogue/catalogue.module.css";

interface CataloguePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function CataloguePage({
  params,
  searchParams,
}: CataloguePageProps) {
  const { locale: localeParam } = await params;
  const { category: categoryParam } = await searchParams;
  const locale: SupportedLocale = normalizeLocale(localeParam);
  const copy = getCatalogueCopy(locale);

  let catalog;
  try {
    catalog = await fetchCatalogList(
      { locale: localeParam, category: categoryParam },
      { findProducts: findPayloadProducts },
    );
  } catch {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{copy.title}</h1>
          <CategoryFilterChips locale={locale} activeCategory="all" />
        </header>
        <CatalogueErrorState locale={locale} />
      </main>
    );
  }

  const hasProducts = catalog.products.length > 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{copy.title}</h1>
        <CategoryFilterChips
          locale={locale}
          activeCategory={catalog.category}
        />
      </header>

      {hasProducts ? (
        <CatalogueGrid products={catalog.products} locale={locale} />
      ) : (
        <CatalogueEmptyState locale={locale} category={catalog.category} />
      )}
    </main>
  );
}
