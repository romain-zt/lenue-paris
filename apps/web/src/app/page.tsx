import Image from "next/image";
import Link from "next/link";
import type { Product, ProductsResponse } from "@/types/product";

export const metadata = {
  title: "Lénue Paris — Robes, sacs et foulards de luxe",
  description:
    "Boutique de mode de luxe. Découvrez notre sélection de robes, sacs et foulards, commandez simplement via WhatsApp.",
};

/* ─── Static placeholder products (shown when CMS returns nothing) ─── */
const PLACEHOLDER_PRODUCTS = [
  {
    id: "ph-1",
    title: "Robe Camille",
    slug: "robe-camille",
    price: 385,
    category: "dresses" as const,
    mainImage: null,
    isPlaceholder: true,
  },
  {
    id: "ph-2",
    title: "Sac Juliette",
    slug: "sac-juliette",
    price: 295,
    category: "bags" as const,
    mainImage: null,
    isPlaceholder: true,
  },
  {
    id: "ph-3",
    title: "Foulard Diane",
    slug: "foulard-diane",
    price: 145,
    category: "scarfs" as const,
    mainImage: null,
    isPlaceholder: true,
  },
  {
    id: "ph-4",
    title: "Robe Louise",
    slug: "robe-louise",
    price: 425,
    category: "dresses" as const,
    mainImage: null,
    isPlaceholder: true,
  },
];

type FeaturedProduct = (typeof PLACEHOLDER_PRODUCTS)[0] | (Product & { isPlaceholder?: false });

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/products?where[_status][equals]=published&limit=4&locale=fr`,
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

/* ─── Category editorial config ─── */
const CATEGORIES = [
  {
    name: "Robes",
    href: "/catalogue?categorie=robes",
    description: "Silhouettes raffinées,\nmatières nobles.",
    bg: "bg-[#f0e8df]",
    accent: "text-[#8b6e57]",
  },
  {
    name: "Sacs",
    href: "/catalogue?categorie=sacs",
    description: "Pièces iconiques,\nfinitions impeccables.",
    bg: "bg-[#e5ddd5]",
    accent: "text-[#7a6356]",
  },
  {
    name: "Foulards",
    href: "/catalogue?categorie=foulards",
    description: "Soie et laine,\ntouches de couleur discrètes.",
    bg: "bg-[#dbd2c9]",
    accent: "text-[#6e5d52]",
  },
] as const;

/* ─── Inline product card for homepage ─── */
function HomepageProductCard({ product }: { product: FeaturedProduct }) {
  const imageUrl =
    "mainImage" in product && product.mainImage
      ? (product.mainImage as { url?: string | null }).url
      : null;

  const href = product.isPlaceholder
    ? `/catalogue?categorie=${
        product.category === "dresses"
          ? "robes"
          : product.category === "bags"
            ? "sacs"
            : "foulards"
      }`
    : `/produits/${product.slug}`;

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(product.price);

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-stone-200 transition-transform duration-700 group-hover:scale-[1.02]">
            <span
              className="select-none font-serif text-7xl font-light text-stone-300"
              aria-hidden="true"
            >
              L
            </span>
            <span
              className="mt-1 select-none text-[8px] tracking-[0.4em] text-stone-400"
              aria-hidden="true"
            >
              LÉNUE
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <p className="text-sm font-medium leading-snug text-stone-900">
          {product.title}
        </p>
        <p className="font-light text-sm text-stone-400">{formattedPrice}</p>
      </div>
    </Link>
  );
}

/* ─── Page ─── */
export default async function Home() {
  const featured = await getFeaturedProducts();

  return (
    <main>
      {/* ── Hero ── */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-[85svh] items-center bg-[#f8f4ef]"
      >
        {/* Decorative vertical rule */}
        <div
          className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-stone-300 to-transparent opacity-60"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-screen-xl px-6 py-24 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-stone-400">
              Printemps · Été 2026
            </p>

            <h1
              id="hero-heading"
              className="font-serif text-5xl font-light leading-[1.1] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              La nouvelle
              <br />
              <em className="not-italic text-stone-600">collection</em>
            </h1>

            <div
              className="my-8 h-px w-16 bg-stone-300"
              aria-hidden="true"
            />

            <p className="max-w-sm text-base leading-relaxed text-stone-500 sm:text-lg">
              Robes, sacs et foulards d&apos;exception — commandés simplement,
              livrés avec soin.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/catalogue"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center bg-stone-900 px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-stone-700"
              >
                Découvrir la collection
              </Link>
              <Link
                href="/catalogue?categorie=robes"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-stone-300 px-8 py-3 text-xs font-medium uppercase tracking-[0.15em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
              >
                Nos robes
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative corner monogram */}
        <div
          className="pointer-events-none absolute bottom-8 right-8 hidden select-none lg:block"
          aria-hidden="true"
        >
          <span className="font-serif text-[12rem] font-light leading-none text-stone-200/80">
            L
          </span>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section
        aria-labelledby="featured-heading"
        className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">
              Nos pièces
            </p>
            <h2
              id="featured-heading"
              className="font-serif text-3xl font-light text-stone-900 sm:text-4xl"
            >
              La sélection
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="hidden text-xs font-medium uppercase tracking-[0.15em] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline sm:inline-flex"
          >
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-4">
          {featured.map((product) => (
            <HomepageProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/catalogue"
            className="inline-flex min-h-[44px] items-center text-xs font-medium uppercase tracking-[0.15em] text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
          >
            Voir toute la collection →
          </Link>
        </div>
      </section>

      {/* ── Category editorial panels ── */}
      <section
        aria-labelledby="categories-heading"
        className="border-t border-stone-100"
      >
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-400">
            Nos univers
          </p>
          <h2
            id="categories-heading"
            className="mb-10 font-serif text-3xl font-light text-stone-900 sm:text-4xl"
          >
            Explorer par catégorie
          </h2>

          <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={cat.href}
                  className={`group flex min-h-64 flex-col justify-between p-7 transition-all hover:shadow-sm sm:min-h-72 lg:min-h-80 ${cat.bg}`}
                >
                  <div>
                    <h3 className="font-serif text-3xl font-light text-stone-900 sm:text-4xl">
                      {cat.name}
                    </h3>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
                      {cat.description}
                    </p>
                  </div>
                  <span
                    className={`mt-6 inline-flex items-center text-xs font-medium uppercase tracking-[0.15em] transition-colors group-hover:text-stone-900 ${cat.accent}`}
                  >
                    Explorer
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Brand editorial quote ── */}
      <section
        aria-labelledby="brand-heading"
        className="border-t border-stone-100 bg-stone-50"
      >
        <div className="mx-auto max-w-screen-xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <h2 id="brand-heading" className="sr-only">
            À propos de Lénue Paris
          </h2>
          <blockquote className="mx-auto max-w-2xl text-center">
            <p className="font-serif text-2xl font-light italic leading-relaxed text-stone-700 sm:text-3xl sm:leading-relaxed">
              &ldquo;Chaque pièce est choisie avec soin — pour sa matière, sa
              coupe, et ce qu&apos;elle dit de vous.&rdquo;
            </p>
            <footer className="mt-6">
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                Lénue Paris
              </span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── WhatsApp ordering strip ── */}
      <section className="border-t border-stone-200 bg-stone-900">
        <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                Commandez en toute simplicité
              </p>
              <p className="mt-1 font-serif text-2xl font-light text-white">
                Via WhatsApp, en quelques messages.
              </p>
            </div>
            <Link
              href="/catalogue"
              className="inline-flex min-h-[44px] shrink-0 items-center border border-stone-500 px-7 py-3 text-xs font-medium uppercase tracking-[0.15em] text-stone-300 transition-colors hover:border-white hover:text-white"
            >
              Choisir une pièce
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
