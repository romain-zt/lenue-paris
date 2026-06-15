import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Product } from "@/types/product";
import { ProductGallery } from "@/components/product/ProductGallery";
import { OrderCTA } from "@/components/product/OrderCTA";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type Locale = "fr" | "en" | "ru";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getProduct(slug: string, locale: Locale): Promise<Product | null> {
  try {
    const payload = await getPayload({ config });
    const query = {
      collection: "products" as const,
      where: {
        slug: { equals: slug },
        _status: { equals: "published" },
      },
      locale,
      limit: 1,
      depth: 1,
    };

    const { docs } = await payload.find(query);
    if (docs[0]) {
      return docs[0] as unknown as Product;
    }

    // Fall back to French when the product was published from the FR admin context.
    if (locale !== "fr") {
      const { docs: frDocs } = await payload.find({ ...query, locale: "fr" });
      return (frDocs[0] as unknown as Product) ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const product = await getProduct(slug, locale as Locale);
  if (!product) {
    return { title: t("notFoundTitle") };
  }
  return {
    title: `${product.title} — Lénue Paris`,
    description: product.description ?? t("metaDescriptionFallback", { title: product.title }),
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("product");
  const product = await getProduct(slug, locale as Locale);

  if (!product) {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <Link
          href="/catalogue"
          className="text-sm text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        >
          {t("backToCollection")}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <ProductGallery mainImage={product.mainImage} gallery={product.gallery} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-2 text-xl text-stone-700">{formattedPrice}</p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>
          )}

          <OrderCTA product={product} />
        </div>
      </div>
    </main>
  );
}
