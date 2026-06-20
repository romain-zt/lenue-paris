"use client";

import { Suspense } from "react";
import { EditableField } from "@/components/cms/EditableField";
import { BlockOverlay } from "@/components/cms/BlockOverlay";
import { CatalogueGridSkeleton } from "@/components/skeletons/CatalogueGridSkeleton";
import { CatalogueClient } from "./CatalogueClient";
import type { ContentLocale } from "@/lib/cms/types";
import type { Product } from "@/types/product";

type CataloguePageContentProps = {
  pageTitle: string;
  products: Product[];
  error: string | null;
  pageId?: string;
  gridBlockIndex?: number;
  locale: ContentLocale;
};

export function CataloguePageContent({
  pageTitle,
  products,
  error,
  pageId,
  gridBlockIndex,
  locale,
}: CataloguePageContentProps) {
  const canEdit = Boolean(pageId && gridBlockIndex !== undefined);
  const field = `blocks.${gridBlockIndex}.title`;

  const titleNode = canEdit ? (
    <EditableField
      collection="pages"
      id={pageId!}
      field={field}
      fieldLabel="Titre catalogue"
      currentValue={pageTitle}
      locale={locale}
    >
      {pageTitle}
    </EditableField>
  ) : (
    pageTitle
  );

  const heading = (
    <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">{titleNode}</h1>
  );

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
      {canEdit ? (
        <BlockOverlay
          blockType="productGrid"
          blockIndex={gridBlockIndex!}
          docId={pageId}
          docCollection="pages"
        >
          {heading}
        </BlockOverlay>
      ) : (
        heading
      )}
      <Suspense fallback={<CatalogueGridSkeleton />}>
        <CatalogueClient initialProducts={products} initialError={error} locale={locale} />
      </Suspense>
    </main>
  );
}
