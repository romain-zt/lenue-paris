import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCollectionBySlug } from "@/lib/cms/queries";
import type { ContentLocale } from "@/lib/cms/types";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug, locale as ContentLocale);
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
  const collection = await getCollectionBySlug(slug, contentLocale);
  if (!collection) notFound();

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
          <h1 className="font-serif text-3xl font-light text-stone-900 sm:text-4xl">{collection.title}</h1>
        </header>

        <ProductGrid products={collection.products} />
      </section>
    </main>
  );
}
