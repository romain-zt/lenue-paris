"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { OrderCTA } from "@/components/product/OrderCTA";
import { CapsuleBadge } from "@/components/editorial/CapsuleBadge";
import { EditableField } from "@/components/cms/EditableField";
import { mapPayloadProductDetail } from "@/lib/cms/blocks";
import { getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";
import { useLivePreviewFieldBridge } from "@/hooks/useLivePreviewFieldBridge";
import type { Product as PayloadProduct } from "@/payload-types";
import type { ContentLocale } from "@/lib/cms/types";
import { InlineEditor } from "./InlineEditor";

type ProductPageContentProps = {
  initialProduct: PayloadProduct;
  locale: ContentLocale;
};

export function ProductPageContent({ initialProduct, locale }: ProductPageContentProps) {
  const t = useTranslations("product");
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || getPreviewSiteUrl();

  useLivePreviewFieldBridge();

  const { data: liveDoc } = useLivePreview<PayloadProduct>({
    initialData: initialProduct,
    serverURL,
    depth: 2,
  });

  const product = mapPayloadProductDetail(liveDoc, locale);
  if (!product) return null;

  const docId = String(liveDoc.id);
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
        <div data-payload-path="mainImage">
          <ProductGallery
            slug={product.slug}
            mainImage={product.mainImage}
            gallery={product.gallery}
            title={product.title}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {product.limitedSeries ? (
              <CapsuleBadge className="mb-3">{t("limitedSeriesBadge")}</CapsuleBadge>
            ) : null}
            <h1
              className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
              data-payload-path="title"
            >
              <EditableField
                collection="products"
                id={docId}
                field="title"
                fieldLabel="Titre produit"
                currentValue={product.title}
                locale={locale}
              >
                {product.title}
              </EditableField>
            </h1>
            <p className="mt-2 text-xl text-stone-700" data-payload-path="price">
              {formattedPrice}
            </p>
          </div>

          {product.description ? (
            <div
              className="text-sm leading-relaxed text-stone-600"
              data-payload-path="description"
            >
              <EditableField
                collection="products"
                id={docId}
                field="description"
                fieldLabel="Description produit"
                currentValue={product.description}
                locale={locale}
                multiline
              >
                {product.description}
              </EditableField>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-stone-600" data-payload-path="description">
              <EditableField
                collection="products"
                id={docId}
                field="description"
                fieldLabel="Description produit"
                currentValue=""
                locale={locale}
                multiline
              >
                <span className="italic text-stone-400">Ajouter une description…</span>
              </EditableField>
            </div>
          )}

          <OrderCTA product={product} />
        </div>
      </div>
      <InlineEditor />
    </main>
  );
}
