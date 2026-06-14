import {
  buildCatalogueHref,
  fetchProductDetail,
  isVariantSelectionComplete,
} from "@repo/product-detail";
import { normalizeLocale, type SupportedLocale } from "@repo/catalog";
import Link from "next/link";
import { getCheckoutCopy } from "@/lib/checkout-copy";
import { parseOrderVariantParams } from "@/lib/parse-order-variant-params";
import { findPayloadProductBySlug } from "@/lib/find-payload-product";
import {
  CheckoutForm,
  CheckoutVariantsMissing,
} from "@/components/checkout/CheckoutForm";
import styles from "@/components/checkout/checkout.module.css";

interface OrderPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { locale: localeParam, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const locale: SupportedLocale = normalizeLocale(localeParam);
  const copy = getCheckoutCopy(locale);
  const catalogueHref = buildCatalogueHref(locale);
  const variantSelection = parseOrderVariantParams(resolvedSearchParams);

  let result;
  try {
    result = await fetchProductDetail(
      { slug, locale: localeParam },
      { findProductBySlug: findPayloadProductBySlug },
    );
  } catch {
    return (
      <main className={styles.page}>
        <section className={styles.error}>
          <h1 className={styles.errorTitle}>{copy.errorTitle}</h1>
          <p className={styles.errorText}>{copy.errorBody}</p>
          <Link href={catalogueHref} className={styles.backLink}>
            {copy.backToCatalogue}
          </Link>
        </section>
      </main>
    );
  }

  if (result.kind === "not_found") {
    return (
      <main className={styles.page}>
        <section className={styles.empty}>
          <h1 className={styles.emptyTitle}>{copy.notFoundTitle}</h1>
          <p className={styles.emptyText}>{copy.notFoundBody}</p>
          <Link href={result.response.catalogueHref} className={styles.backLink}>
            {copy.backToCatalogue}
          </Link>
        </section>
      </main>
    );
  }

  const { product } = result.response;
  const productHref = `/${locale}/products/${product.slug}`;
  const variantsComplete = isVariantSelectionComplete(
    product.variantPickers,
    variantSelection,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{copy.pageTitle}</h1>
      </header>

      {!variantsComplete && product.variantPickers ? (
        <CheckoutVariantsMissing productHref={productHref} copy={copy} />
      ) : (
        <CheckoutForm
          product={product}
          locale={locale}
          variantSelection={variantSelection}
          copy={copy}
        />
      )}
    </main>
  );
}
