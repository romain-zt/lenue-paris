import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CollectionPageContent } from "@/components/cms/CollectionPageContent";
import { getCollectionBySlug, getCollectionDocumentBySlug } from "@/lib/cms/queries";
import type { ContentLocale } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { isEnabled: isDraft } = await draftMode();
  const collection = await getCollectionBySlug(slug, locale as ContentLocale, { draft: isDraft });
  if (!collection) return { title: "Collection — Lénue Paris" };
  return {
    title: `${collection.title} — Lénue Paris`,
    description: collection.title,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const contentLocale = locale as ContentLocale;
  const { isEnabled: isDraft } = await draftMode();
  const collectionDoc = await getCollectionDocumentBySlug(slug, contentLocale, { draft: isDraft });

  if (!collectionDoc) notFound();

  return (
    <CollectionPageContent
      initialCollection={JSON.parse(JSON.stringify(collectionDoc))}
      locale={contentLocale}
    />
  );
}
