import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import { getProductMainImageUrl } from "@/lib/productImages";
import { FeaturedProductItem, FeaturedProductsScroll } from "@/components/home/FeaturedProductsScroll";

type Locale = "fr" | "en" | "ru";

/** Home featured carousel — sold-out look in 3rd slot. */
const FEATURED_SLUGS = [
  "robe-camille",
  "look-elise-edition-limitee",
  "robe-margot",
  "sac-celeste",
  "robe-louise",
  "robe-heloise",
] as const;

export const dynamic = "force-dynamic";

const PLACEHOLDER_BY_SLUG: Record<
  (typeof FEATURED_SLUGS)[number],
  {
    id: string;
    title: string;
    slug: (typeof FEATURED_SLUGS)[number];
    price: number;
    category: "dresses" | "bags" | "scarfs";
    inStock?: boolean;
    mainImage: { id: string; alt: string; url: string };
    isPlaceholder: true;
  }
> = {
  "look-elise-edition-limitee": {
    id: "ph-elise",
    title: "Look Complet Élise",
    slug: "look-elise-edition-limitee",
    price: 495,
    category: "dresses",
    inStock: false,
    mainImage: {
      id: "ph-img-elise",
      alt: "Look Complet Élise — Lénue Paris",
      url: "/images/lenue-complete-look-mannequin.jpg",
    },
    isPlaceholder: true,
  },
  "robe-camille": {
    id: "ph-1",
    title: "Robe Camille",
    slug: "robe-camille",
    price: 290,
    category: "dresses",
    mainImage: { id: "ph-img-1", alt: "Robe Camille — Lénue Paris", url: "/images/dress-camille.jpg" },
    isPlaceholder: true,
  },
  "robe-louise": {
    id: "ph-2",
    title: "Robe Louise",
    slug: "robe-louise",
    price: 320,
    category: "dresses",
    mainImage: { id: "ph-img-2", alt: "Robe Louise — Lénue Paris", url: "/images/dress-louise.jpg" },
    isPlaceholder: true,
  },
  "robe-margot": {
    id: "ph-3",
    title: "Robe Margot",
    slug: "robe-margot",
    price: 275,
    category: "dresses",
    mainImage: { id: "ph-img-3", alt: "Robe Margot — Lénue Paris", url: "/images/dress-margot.jpg" },
    isPlaceholder: true,
  },
  "robe-heloise": {
    id: "ph-4",
    title: "Robe Héloïse",
    slug: "robe-heloise",
    price: 345,
    category: "dresses",
    mainImage: { id: "ph-img-4", alt: "Robe Héloïse — Lénue Paris", url: "/images/dress-heloise.jpg" },
    isPlaceholder: true,
  },
  "sac-celeste": {
    id: "ph-celeste",
    title: "Sac Céleste",
    slug: "sac-celeste",
    price: 310,
    category: "bags",
    mainImage: {
      id: "ph-img-celeste",
      alt: "Sac Céleste — Lénue Paris",
      url: "/images/lenue-sac-champagne.jpg",
    },
    isPlaceholder: true,
  },
};

type PlaceholderProduct = (typeof PLACEHOLDER_BY_SLUG)[keyof typeof PLACEHOLDER_BY_SLUG];
type FeaturedProduct = PlaceholderProduct | (Product & { isPlaceholder?: false });

async function getFeaturedProducts(locale: Locale): Promise<FeaturedProduct[]> {
  try {
    const payload = await getPayload({ config });
    const query = {
      collection: "products" as const,
      where: {
        _status: { equals: "published" as const },
        slug: { in: [...FEATURED_SLUGS] },
      },
      locale,
      limit: FEATURED_SLUGS.length,
      depth: 1,
    };

    let { docs } = await payload.find(query);
    if (docs.length === 0 && locale !== "fr") {
      ({ docs } = await payload.find({ ...query, locale: "fr" }));
    }

    return FEATURED_SLUGS.map((slug) => {
      const fromCms = docs.find((doc) => doc.slug === slug);
      if (fromCms) {
        return fromCms as unknown as Product;
      }
      return PLACEHOLDER_BY_SLUG[slug];
    });
  } catch {
    return FEATURED_SLUGS.map((slug) => PLACEHOLDER_BY_SLUG[slug]);
  }
}

function ProductCard({
  product,
  formattedPrice,
  outOfStockBadge,
}: {
  product: FeaturedProduct;
  formattedPrice: string;
  outOfStockBadge: string;
}) {
  const imageUrl = getProductMainImageUrl(
    product.slug,
    product.isPlaceholder ? product.mainImage.url : product.mainImage?.url,
  );
  const isOutOfStock = product.inStock === false;
  const href = product.isPlaceholder ? `/produits/${product.slug}` : `/produits/${product.slug}`;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe4]">
        {isOutOfStock && (
          <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] bg-white/95 px-2.5 py-1 text-[9px] font-medium uppercase leading-snug tracking-[0.12em] text-stone-800 shadow-sm">
            {outOfStockBadge}
          </span>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
              isOutOfStock ? "opacity-90 saturate-[0.85]" : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f5f0ea] to-[#e8e0d6]">
            <span className="select-none font-serif text-6xl font-light text-stone-300" aria-hidden="true">
              L
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700">
          {product.title}
        </p>
        <p className="mt-1.5 text-[11px] tracking-wide text-stone-400">{formattedPrice}</p>
      </div>
    </Link>
  );
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: "Lénue Paris",
    description: t("heroTagline"),
  };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const nav = await getTranslations("nav");
  const tProduct = await getTranslations("product");
  const featured = await getFeaturedProducts(locale as Locale);
  const priceFormatter = (price: number) => formatPrice(price, locale as Locale);

  const categoryLinks = [
    { href: "/catalogue?categorie=robes", label: nav("dresses") },
    { href: "/catalogue?categorie=sacs", label: nav("bags") },
    { href: "/catalogue?categorie=foulards", label: nav("scarfs") },
    { href: "/catalogue", label: t("allCollection") },
  ];

  return (
    <main>
      {/* ── 1. Hero ── */}
      {/* Pulls behind the sticky header — image fills the full viewport */}
      <section
        aria-labelledby="hero-heading"
        className="relative -mt-16 h-[100svh] min-h-[100dvh] overflow-hidden bg-stone-800 md:-mt-[72px]"
      >
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt={t("heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_40%] sm:object-[50%_32%] lg:object-[50%_24%]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" aria-hidden="true" />

        <div className="absolute bottom-0 left-0 px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/50">
            {t("season")}
          </p>
          <h1
            id="hero-heading"
            className="font-serif text-5xl font-light leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl"
          >
            LÉNUE
            <br />
            <span className="text-3xl tracking-[0.35em] text-white/80 sm:text-4xl lg:text-5xl">PARIS</span>
          </h1>
          <p className="mt-5 max-w-xs text-sm font-light leading-relaxed text-white/60 sm:text-[15px]">
            {t("heroTagline")}
          </p>
          <div className="mt-8">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white"
            >
              <span className="border-b border-white/40 pb-px transition-colors group-hover:border-white/90">
                {t("heroCta")}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Quote ── */}
      <section aria-label="Philosophie" className="bg-[#f5f0ea] px-4 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-xl font-light italic leading-relaxed text-stone-600 sm:text-2xl sm:leading-relaxed">
            {t("quote")}
          </p>
          <div className="mx-auto mt-7 h-px w-10 bg-stone-300" aria-hidden="true" />
        </div>
      </section>

      {/* ── 3. Featured products ── */}
      <section
        aria-labelledby="featured-heading"
        className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-14 flex items-end justify-between border-b border-stone-100 pb-6 sm:mb-16">
            <div>
              <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.35em] text-stone-400">
                {t("season")}
              </p>
              <h2
                id="featured-heading"
                className="font-serif text-2xl font-light text-stone-900 sm:text-3xl"
              >
                {t("featuredTitle")}
              </h2>
            </div>
            <Link
              href="/catalogue"
              className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-800 sm:inline-flex"
            >
              {t("viewCollection")}
            </Link>
          </div>
        </div>
        <FeaturedProductsScroll ariaLabel={t("featuredTitle")}>
          {featured.map((product) => (
            <FeaturedProductItem key={product.slug}>
              <ProductCard
                product={product}
                formattedPrice={priceFormatter(product.price)}
                outOfStockBadge={tProduct("outOfStockBadge")}
              />
            </FeaturedProductItem>
          ))}
        </FeaturedProductsScroll>
        <div className="mx-auto max-w-screen-xl">
          <div className="mt-14 text-center sm:hidden">
            <Link
              href="/catalogue"
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              {t("viewFullCollection")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Editorial ── */}
      <section aria-label={t("editorialLabel")} className="overflow-hidden bg-[#f0ebe4] lg:flex">
        <div className="flex flex-col justify-center px-8 py-16 sm:px-12 sm:py-20 lg:w-[42%] lg:px-14 lg:py-24">
          <p className="mb-6 text-[9px] font-medium uppercase tracking-[0.38em] text-stone-400">
            {t("editorialLabel")}
          </p>
          <h2 className="font-serif text-3xl font-light leading-snug text-stone-800 sm:text-4xl lg:text-[2.6rem] lg:leading-snug">
            {t("editorialHeadline")}
            <br />
            <em className="font-light not-italic text-stone-600">{t("editorialSubline")}</em>
          </h2>
          <div className="my-8 h-px w-12 bg-stone-300" aria-hidden="true" />
          <p className="max-w-xs text-sm leading-relaxed text-stone-500">{t("editorialBody")}</p>
          <div className="mt-10">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-900"
            >
              <span className="border-b border-stone-400 pb-px transition-colors group-hover:border-stone-900">
                {t("editorialCta")}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1">
          <Image
            src="/images/cafe-de-flore.jpg"
            alt={t("editorialImageAlt")}
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-top"
          />
          <div
            className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#f0ebe4] to-transparent lg:block"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ── 5. Category strip ── */}
      <section aria-label="Univers" className="border-t border-stone-100 bg-white">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
          <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-stone-300">
            {t("exploreLabel")}
          </span>
          {categoryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
