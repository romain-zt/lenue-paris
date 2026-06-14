import Link from "next/link";

export const metadata = {
  title: "Lénue Paris — Robes, sacs et foulards de luxe",
  description:
    "Boutique de mode de luxe. Découvrez notre sélection de robes, sacs et foulards, commandez simplement via WhatsApp.",
};

const categories = [
  {
    name: "Robes",
    href: "/catalogue?categorie=robes",
    description: "Silhouettes raffinées pour chaque occasion.",
    className: "bg-stone-100",
  },
  {
    name: "Sacs",
    href: "/catalogue?categorie=sacs",
    description: "Pièces iconiques, finitions impeccables.",
    className: "bg-stone-200",
  },
  {
    name: "Foulards",
    href: "/catalogue?categorie=foulards",
    description: "Soie et laine, touches de couleur discrètes.",
    className: "bg-stone-300/60",
  },
] as const;

export default function Home() {
  return (
    <main>
      <section
        aria-labelledby="hero-heading"
        className="border-b border-stone-200 bg-stone-50"
      >
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
            Boutique de luxe
          </p>
          <h1
            id="hero-heading"
            className="text-4xl font-light tracking-tight text-stone-900 sm:text-5xl lg:text-6xl"
          >
            Lénue Paris
          </h1>
          <p className="mt-4 max-w-md text-lg text-stone-600 sm:text-xl">
            Robes, sacs et foulards d&apos;exception.
          </p>
          <div className="mt-10">
            <Link
              href="/catalogue"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm bg-stone-900 px-8 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              Découvrir la collection
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="categories-heading"
        className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <h2
          id="categories-heading"
          className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-stone-500"
        >
          Nos univers
        </h2>
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {categories.map((category) => (
            <li key={category.name}>
              <Link
                href={category.href}
                className={`group flex min-h-44 flex-col justify-between rounded-sm p-6 transition-colors hover:ring-1 hover:ring-stone-300 ${category.className}`}
              >
                <div>
                  <h3 className="text-xl font-medium tracking-tight text-stone-900">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {category.description}
                  </p>
                </div>
                <span className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-amber-800 transition-colors group-hover:text-stone-900">
                  Explorer
                  <span aria-hidden="true" className="ml-1.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="brand-note-heading"
        className="border-t border-stone-200 bg-white"
      >
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 id="brand-note-heading" className="sr-only">
            À propos de Lénue Paris
          </h2>
          <blockquote className="mx-auto max-w-2xl text-center">
            <p className="text-lg leading-relaxed text-stone-700 sm:text-xl sm:leading-relaxed">
              Lénue Paris est une boutique où chaque pièce est choisie avec soin
              — robes, sacs et foulards aux matières nobles et aux finitions
              exigeantes. Parcourez la collection à votre rythme, puis
              commandez en toute simplicité via WhatsApp pour un accompagnement
              personnalisé.
            </p>
          </blockquote>
        </div>
      </section>
    </main>
  );
}
