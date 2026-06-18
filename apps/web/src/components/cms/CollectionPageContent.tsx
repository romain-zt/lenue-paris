"use client";

import Image from "next/image";
import { useLivePreview } from "@payloadcms/live-preview-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { mapPayloadProductToStorefront } from "@/lib/cms/blocks";
import { getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";
import { resolveMediaAlt, resolveMediaUrl } from "@/lib/cms/media";
import type { Collection as PayloadCollection } from "@/payload-types";
import type { ContentLocale } from "@/lib/cms/types";
import type { Product } from "@/types/product";
import { InlineEditor } from "./InlineEditor";

type CollectionPageContentProps = {
  initialCollection: PayloadCollection;
  locale: ContentLocale;
};

function mapCollectionForDisplay(doc: PayloadCollection, locale: ContentLocale) {
  const products = (doc.products ?? [])
    .map((entry) => (typeof entry === "number" ? null : mapPayloadProductToStorefront(entry)))
    .filter((p): p is Product => p != null);

  const heroImageUrl =
    doc.hero && typeof doc.hero !== "number" ? resolveMediaUrl(doc.hero) ?? undefined : undefined;
  const heroImageAlt =
    doc.hero && typeof doc.hero !== "number" ? resolveMediaAlt(doc.hero, doc.title) : doc.title;

  return {
    title: doc.title,
    heroImageUrl,
    heroImageAlt,
    products,
  };
}

export function CollectionPageContent({ initialCollection, locale }: CollectionPageContentProps) {
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || getPreviewSiteUrl();

  const { data: liveDoc } = useLivePreview<PayloadCollection>({
    initialData: initialCollection,
    serverURL,
    depth: 2,
  });

  const collection = mapCollectionForDisplay(liveDoc, locale);

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {collection.heroImageUrl ? (
        <section data-maison="hero" className="relative w-full overflow-hidden">
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <Image
              src={collection.heroImageUrl}
              alt={collection.heroImageAlt ?? collection.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </section>
      ) : null}

      <section
        data-maison="catalogue-grid"
        className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <header className="mb-12 border-b border-stone-100 pb-8">
          <h1 className="font-serif text-3xl font-light text-stone-900 sm:text-4xl">
            {collection.title}
          </h1>
        </header>

        <ProductGrid products={collection.products} />
      </section>
      <InlineEditor />
    </main>
  );
}
