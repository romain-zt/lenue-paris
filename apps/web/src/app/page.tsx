import Image from "next/image";
import Link from "next/link";
import type { Product, ProductsResponse } from "@/types/product";

export const metadata = {
  title: "Lénue Paris — Robes, sacs et foulards de luxe",
  description:
    "Pour les moments que vous voulez garder. Découvrez notre sélection de robes, sacs et foulards — commandez simplement via WhatsApp.",
};

/* ─── Static placeholder products ─── */
const PLACEHOLDER_PRODUCTS = [
  {
    id: "ph-1",
    title: "Robe Camille",
    slug: "robe-camille",
    price: 290,
    category: "dresses" as const,
    mainImage: {
      id: "ph-img-1",
      alt: "Robe Camille — Lénue Paris",
      url: "/images/dress-camille.jpg",
    },
    isPlaceholder: true,
  },
  {
    id: "ph-2",
    title: "Robe Louise",
    slug: "robe-louise",
    price: 320,
    category: "dresses" as const,
    mainImage: {
      id: "ph-img-2",
      alt: "Robe Louise — Lénue Paris",
      url: "/images/dress-louise.jpg",
    },
    isPlaceholder: true,
  },
  {
    id: "ph-3",
    title: "Robe Margot",
    slug: "robe-margot",
    price: 275,
    category: "dresses" as const,
    mainImage: {
      id: "ph-img-3",
      alt: "Robe Margot — Lénue Paris",
      url: "/images/dress-margot.jpg",
    },
    isPlaceholder: true,
  },
  {
    id: "ph-4",
    title: "Robe Héloïse",
    slug: "robe-heloise",
    price: 345,
    category: "dresses" as const,
    mainImage: {
      id: "ph-img-4",
      alt: "Robe Héloïse — Lénue Paris",
      url: "/images/dress-heloise.jpg",
    },
    isPlaceholder: true,
  },
];

type PlaceholderProduct = (typeof PLACEHOLDER_PRODUCTS)[0];
type FeaturedProduct = PlaceholderProduct | (Product & { isPlaceholder?: false });

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/products?where[_status][equals]=published&where[category][equals]=dresses&limit=4&locale=fr`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return PLACEHOLDER_PRODUCTS;
    const data = (await res.json()) as ProductsResponse;
    const products = data.docs ?? [];
    return products.length > 0 ? products.slice(0, 4) : PLACEHOLDER_PRODUCTS;
  } catch {
    return PLACEHOLDER_PRODUCTS;
  }
}

/* ─── Inline product card ─── */
function ProductCard({ product }: { product: FeaturedProduct }) {
  const imageUrl =
    "mainImage" in product && product.mainImage
      ? (product.mainImage as { url?: string | null }).url
      : null;

  const href = product.isPlaceholder
    ? `/catalogue?categorie=robes`
    : `/produits/${product.slug}`;

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe4]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={
              "mainImage" in product && product.mainImage
                ? (product.mainImage as { alt?: string }).alt ?? product.title
                : product.title
            }
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f5f0ea] to-[#e8e0d6]">
            <span
              className="select-none font-serif text-6xl font-light text-stone-300"
              aria-hidden="true"
            >
              L
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-700">
          {product.title}
        </p>
        <p className="mt-0.5 text-[11px] tracking-wide text-stone-400">
          {formattedPrice}
        </p>
      </div>
    </Link>
  );
}

/* ─── Page ─── */
export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <main>

      {/* ── 1. Hero — full-bleed editorial ── */}
      <section
        aria-labelledby="hero-heading"
        className="relative h-[90svh] min-h-[560px] overflow-hidden bg-stone-800"
      >
        <Image
          src="/images/hero.jpg"
          alt="Lénue Paris — collection Printemps Été 2026"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_15%]"
        />

        {/* Gradient layers for depth + text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-white/50">
            Printemps · Été 2026
          </p>

          <h1
            id="hero-heading"
            className="font-serif text-5xl font-light leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl"
          >
            LÉNUE
            <br />
            <span className="text-3xl tracking-[0.35em] text-white/80 sm:text-4xl lg:text-5xl">
              PARIS
            </span>
          </h1>

          <p className="mt-5 max-w-xs text-sm font-light leading-relaxed text-white/60 sm:text-[15px]">
            Pour les moments que vous voulez garder.
          </p>

          <div className="mt-8">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-white"
            >
              <span className="border-b border-white/40 pb-px group-hover:border-white/90 transition-colors">
                Découvrir la collection
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Quote ── */}
      <section
        aria-label="Philosophie"
        className="bg-[#f5f0ea] px-4 py-16 sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-xl font-light italic leading-relaxed text-stone-600 sm:text-2xl sm:leading-relaxed">
            &ldquo;Certains jours, vous n&apos;avez pas besoin de raison.
            <br className="hidden sm:block" />
            Vous avez juste besoin de la bonne robe.&rdquo;
          </p>
          <div
            className="mx-auto mt-7 h-px w-10 bg-stone-300"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ── 3. Featured products ── */}
      <section
        aria-labelledby="featured-heading"
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-screen-xl">
          {/* Section header */}
          <div className="mb-10 flex items-end justify-between border-b border-stone-100 pb-5">
            <div>
              <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.35em] text-stone-400">
                Printemps · Été 2026
              </p>
              <h2
                id="featured-heading"
                className="font-serif text-2xl font-light text-stone-900 sm:text-3xl"
              >
                Nos robes
              </h2>
            </div>
            <Link
              href="/catalogue"
              className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-800 sm:inline-flex"
            >
              Voir la collection →
            </Link>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 lg:gap-x-8">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="mt-12 text-center sm:hidden">
            <Link
              href="/catalogue"
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              Voir toute la collection →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Editorial split — brand statement ── */}
      <section
        aria-label="L'esprit Lénue"
        className="overflow-hidden bg-[#f0ebe4] lg:flex"
      >
        {/* Left: text */}
        <div className="flex flex-col justify-center px-8 py-16 sm:px-12 sm:py-20 lg:w-[42%] lg:px-14 lg:py-24">
          <p className="mb-6 text-[9px] font-medium uppercase tracking-[0.38em] text-stone-400">
            L&apos;esprit Lénue
          </p>
          <h2 className="font-serif text-3xl font-light leading-snug text-stone-800 sm:text-4xl lg:text-[2.6rem] lg:leading-snug">
            Lénue, ce n&apos;est pas
            <br />
            s&apos;habiller.
            <br />
            <em className="font-light not-italic text-stone-600">
              C&apos;est se sentir soi-même.
            </em>
          </h2>
          <div
            className="my-8 h-px w-12 bg-stone-300"
            aria-hidden="true"
          />
          <p className="max-w-xs text-sm leading-relaxed text-stone-500">
            Chaque pièce est sélectionnée pour sa matière, sa coupe, et ce
            qu&apos;elle dit de vous. Commandez en toute simplicité, via
            WhatsApp.
          </p>
          <div className="mt-10">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-600 transition-colors hover:text-stone-900"
            >
              <span className="border-b border-stone-400 pb-px transition-colors group-hover:border-stone-900">
                Explorer la boutique
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Right: editorial photo */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1">
          <Image
            src="/images/cafe-de-flore.jpg"
            alt="Femme en robe Lénue Paris au Café de Flore"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-top"
          />
          {/* Subtle left-edge fade to blend with the warm cream */}
          <div
            className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#f0ebe4] to-transparent lg:block"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ── 5. Category links — minimal strip ── */}
      <section
        aria-label="Univers"
        className="border-t border-stone-100 bg-white"
      >
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-8 sm:gap-x-12 sm:px-6 lg:px-8">
          <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-stone-300">
            Explorer
          </span>
          {[
            { href: "/catalogue?categorie=robes", label: "Robes" },
            { href: "/catalogue?categorie=sacs", label: "Sacs" },
            { href: "/catalogue?categorie=foulards", label: "Foulards" },
            { href: "/catalogue", label: "Toute la collection" },
          ].map((link) => (
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
