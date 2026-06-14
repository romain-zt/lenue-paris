import {
  buildCatalogueHref,
  fetchProductDetail,
} from "@repo/product-detail";
import { normalizeLocale, type SupportedLocale } from "@repo/catalog";
import {
  ProductDetailView,
  ProductErrorState,
  ProductNotFoundState,
} from "@/components/product-detail/ProductDetailView";
import { findPayloadProductBySlug } from "@/lib/find-payload-product";
import styles from "@/components/product-detail/pdp.module.css";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale: SupportedLocale = normalizeLocale(localeParam);
  const catalogueHref = buildCatalogueHref(locale);

  let result;
  try {
    result = await fetchProductDetail(
      { slug, locale: localeParam },
      { findProductBySlug: findPayloadProductBySlug },
    );
  } catch {
    return (
      <main className={styles.page}>
        <ProductErrorState locale={locale} catalogueHref={catalogueHref} />
      </main>
    );
  }

  if (result.kind === "not_found") {
    return (
      <main className={styles.page}>
        <ProductNotFoundState
          locale={locale}
          catalogueHref={result.response.catalogueHref}
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <ProductDetailView
        product={result.response.product}
        locale={result.response.locale}
      />
    </main>
  );
}
